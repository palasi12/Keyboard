#!/usr/bin/env python3
"""
Route the Taptile board: ground pour plus an A* maze router for signals.

    usage: python3 route_board.py Taptile_HE.kicad_pcb Taptile_HE_routed.kicad_pcb

STRATEGY

    GND is not routed. It gets a filled zone on the bottom layer, which is what
    you want anyway -- an unbroken ground plane is the single biggest factor in
    whether a board with a USB pair and nine analog lines actually works. That
    one decision removes the largest net (~90 pads) from the routing problem.

    Everything else is routed by A* on a 0.2mm grid across two layers, with
    vias allowed at a cost. Nets are ordered shortest-first, which lets the
    easy connections claim clean paths before the hard ones need them.

HONEST LIMIT

    A 0.4mm-pitch QFN-56 on a two-layer board is genuinely hard. There is not
    enough room between pads to escape the inner rows without either finer
    design rules than JLCPCB's cheap tier allows, or more layers. Expect this
    router to leave some U1 connections unrouted, and expect to finish them by
    hand in KiCad's interactive router -- or to move the board to 4 layers,
    which is what most RP2040 designs do.

    Whatever it cannot route is listed at the end and left as a ratsnest, not
    silently dropped or bodged through a short.
"""

import heapq
import math
import re
import sys
from collections import defaultdict

GRID = 0.2                 # mm per cell
TRACK = 0.25               # trace width
CLEAR = 0.2                # copper-to-copper clearance
VIA_D = 0.6
VIA_DRILL = 0.3
VIA_COST = 20
TRACE_HALO = 3    # 0.25/2 + 0.2 + 0.25/2 = 0.45mm at 0.2mm grid
VIA_HALO = 5      # 0.6 + 0.2 = 0.80mm between via centres              # in grid steps; discourages layer changes
BOARD = (65.0, 135.0, 40.0, 160.0)
POUR_NET = "GND"

NUM = r"(-?[\d.]+)"


def blocks(text, token):
    out, i = [], 0
    while True:
        i = text.find(token, i)
        if i < 0:
            return out
        depth, j, in_str, esc = 0, i, False, False
        while j < len(text):
            ch = text[j]
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = not in_str
            elif not in_str:
                if ch == "(":
                    depth += 1
                elif ch == ")":
                    depth -= 1
                    if depth == 0:
                        break
            j += 1
        out.append(text[i:j + 1])
        i = j + 1


def load(path):
    t = open(path, encoding="utf-8").read()
    nets = dict(re.findall(r'\(net (\d+) "([^"]*)"', t))
    pads = []
    for b in blocks(t, "(module "):
        m = re.search(r"\(fp_text reference (\S+)", b)
        ref = m.group(1) if m else "?"
        at = re.search(rf"\n\s*\(at {NUM} {NUM}", b)
        ox, oy = (float(at.group(1)), float(at.group(2))) if at else (0, 0)
        for pb in blocks(b, "(pad "):
            pm = re.match(r'\(pad\s+("(?:[^"]*)"|\S+)\s+(\S+)\s+(\S+)', pb)
            pa = re.search(rf"\(at {NUM} {NUM}", pb)
            ps = re.search(rf"\(size {NUM} {NUM}", pb)
            nm = re.search(r'\(net (\d+) "([^"]*)"', pb)
            if not (pm and pa and ps):
                continue
            thru = pm.group(2) != "smd"
            pads.append(dict(
                ref=ref, name=pm.group(1).strip('"'),
                x=ox + float(pa.group(1)), y=oy + float(pa.group(2)),
                w=float(ps.group(1)), h=float(ps.group(2)),
                thru=thru,
                netid=int(nm.group(1)) if nm else 0,
                net=nm.group(2) if nm else ""))
    return t, nets, pads


class Grid:
    def __init__(self):
        x0, x1, y0, y1 = BOARD
        self.x0, self.y0 = x0, y0
        self.nx = int((x1 - x0) / GRID) + 1
        self.ny = int((y1 - y0) / GRID) + 1
        # occupancy per layer: 0 free, else net id
        self.g = [[0] * (self.nx * self.ny) for _ in range(2)]

    def idx(self, cx, cy):
        return cy * self.nx + cx

    def to_cell(self, x, y):
        return (int(round((x - self.x0) / GRID)),
                int(round((y - self.y0) / GRID)))

    def to_mm(self, cx, cy):
        return (self.x0 + cx * GRID, self.y0 + cy * GRID)

    def stamp(self, x, y, w, h, netid, layers, pad_clear=CLEAR):
        # +GRID: to_cell() rounds to the nearest cell, so without a full
        # cell of margin a pad edge landing mid-cell leaves the neighbour
        # only partly covered. That rounding was worth -0.125mm of real
        # clearance violation, which is exactly one grid step.
        halo = pad_clear + TRACK / 2 + GRID
        cx0, cy0 = self.to_cell(x - w / 2 - halo, y - h / 2 - halo)
        cx1, cy1 = self.to_cell(x + w / 2 + halo, y + h / 2 + halo)
        for L in layers:
            g = self.g[L]
            for cy in range(max(0, cy0), min(self.ny, cy1 + 1)):
                base = cy * self.nx
                for cx in range(max(0, cx0), min(self.nx, cx1 + 1)):
                    cur = g[base + cx]
                    if cur == 0:
                        g[base + cx] = netid
                    elif cur != netid:
                        g[base + cx] = -3          # contested: blocks everyone

    def free(self, L, cx, cy, netid):
        if not (0 <= cx < self.nx and 0 <= cy < self.ny):
            return False
        v = self.g[L][cy * self.nx + cx]
        return v == 0 or v == netid


def astar(grid, sources, targets, netid, allow_via=True):
    """Multi-source A* to the nearest target. Returns [(L,cx,cy), ...]."""
    tset = set(targets)
    if not tset or not sources:
        return None
    tx = sum(c[1] for c in tset) / len(tset)
    ty = sum(c[2] for c in tset) / len(tset)

    def h(c):
        return (abs(c[1] - tx) + abs(c[2] - ty))

    openq = []
    best = {}
    for s in sources:
        if grid.free(s[0], s[1], s[2], netid):
            best[s] = 0
            heapq.heappush(openq, (h(s), 0, s, None))
    came = {}
    while openq:
        _f, g0, cur, prev = heapq.heappop(openq)
        if cur in came:
            continue
        came[cur] = prev
        if cur in tset:
            path, n = [], cur
            while n is not None:
                path.append(n)
                n = came[n]
            return path[::-1]
        L, cx, cy = cur
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nxt = (L, cx + dx, cy + dy)
            if nxt in came or not grid.free(L, nxt[1], nxt[2], netid):
                continue
            ng = g0 + 1
            if best.get(nxt, 1 << 30) <= ng:
                continue
            best[nxt] = ng
            heapq.heappush(openq, (ng + h(nxt), ng, nxt, cur))
        if allow_via:
            nxt = (1 - L, cx, cy)
            if nxt not in came and grid.free(nxt[0], cx, cy, netid):
                ng = g0 + VIA_COST
                if best.get(nxt, 1 << 30) > ng:
                    best[nxt] = ng
                    heapq.heappush(openq, (ng + h(nxt), ng, nxt, cur))
    return None


def main(src, dst):
    t, netnames, pads = load(src)
    grid = Grid()

    by_net = defaultdict(list)
    for p in pads:
        if p["net"]:
            by_net[p["net"]].append(p)

    # Every pad is an obstacle for every other net. Through-hole pads block
    # both layers; SMD pads block only the front.
    for p in pads:
        layers = (0, 1) if p["thru"] else (0,)
        grid.stamp(p["x"], p["y"], p["w"], p["h"], p["netid"] or -1, layers)

    tracks, vias = [], []
    routed, failed = [], []
    order = sorted((n for n in by_net if n != POUR_NET),
                   key=lambda n: (len(by_net[n]),
                                  max(q["x"] for q in by_net[n])
                                  - min(q["x"] for q in by_net[n])))

    for net in order:
        group = by_net[net]
        if len(group) < 2:
            continue
        netid = group[0]["netid"]
        connected = [group[0]]
        remaining = group[1:]
        ok = True
        while remaining:
            remaining.sort(key=lambda q: min(
                (q["x"] - c["x"]) ** 2 + (q["y"] - c["y"]) ** 2
                for c in connected))
            tgt = remaining.pop(0)

            def cells_of(p):
                cx, cy = grid.to_cell(p["x"], p["y"])
                out = []
                for L in ((0, 1) if p["thru"] else (0,)):
                    out.append((L, cx, cy))
                return out

            sources = [c for p in connected for c in cells_of(p)]
            targets = [c for c in cells_of(tgt)]
            path = astar(grid, sources, targets, netid)
            if not path:
                failed.append(f"{net}: {tgt['ref']}.{tgt['name']}")
                ok = False
                connected.append(tgt)
                continue

            # emit segments, breaking at layer changes (which become vias)
            run = [path[0]]
            for c in path[1:]:
                if c[0] != run[-1][0]:
                    if len(run) > 1:
                        a = grid.to_mm(run[0][1], run[0][2])
                        b = grid.to_mm(run[-1][1], run[-1][2])
                        tracks.append((a, b, run[0][0], netid, net))
                    vias.append((grid.to_mm(c[1], c[2]), netid, net))
                    run = [c]
                else:
                    if len(run) >= 2:
                        d1 = (run[-1][1] - run[-2][1], run[-1][2] - run[-2][2])
                        d2 = (c[1] - run[-1][1], c[2] - run[-1][2])
                        if d1 != d2:
                            a = grid.to_mm(run[0][1], run[0][2])
                            b = grid.to_mm(run[-1][1], run[-1][2])
                            tracks.append((a, b, run[0][0], netid, net))
                            run = [run[-1]]
                    run.append(c)
            if len(run) > 1:
                a = grid.to_mm(run[0][1], run[0][2])
                b = grid.to_mm(run[-1][1], run[-1][2])
                tracks.append((a, b, run[0][0], netid, net))

            vcells = {(c[1], c[2]) for i, c in enumerate(path[:-1])
                      if path[i + 1][0] != c[0]}
            for L, cx, cy in path:
                r = VIA_HALO if (cx, cy) in vcells else TRACE_HALO
                for ddx in range(-r, r + 1):
                    for ddy in range(-r, r + 1):
                        gx, gy = cx + ddx, cy + ddy
                        if 0 <= gx < grid.nx and 0 <= gy < grid.ny:
                            grid.g[L][gy * grid.nx + gx] = netid
            connected.append(tgt)
        if ok:
            routed.append(net)

    # ------------------------------------------------------------ emit ------
    gnd_id = next((int(i) for i, n in netnames.items() if n == POUR_NET), 1)
    x0, x1, y0, y1 = BOARD
    zone = (f'  (zone (net {gnd_id}) (net_name "{POUR_NET}") (layer B.Cu)\n'
            f'    (hatch edge 0.508)\n'
            f'    (connect_pads (clearance 0.25))\n'
            f'    (min_thickness 0.25)\n'
            f'    (fill yes (arc_segments 32) (thermal_gap 0.25)\n'
            f'      (thermal_bridge_width 0.35))\n'
            f'    (polygon (pts (xy {x0} {y0}) (xy {x1} {y0}) '
            f'(xy {x1} {y1}) (xy {x0} {y1})))\n  )\n')

    seg = "".join(
        f'  (segment (start {a[0]:.3f} {a[1]:.3f}) (end {b[0]:.3f} {b[1]:.3f}) '
        f'(width {TRACK}) (layer {"F.Cu" if L == 0 else "B.Cu"}) '
        f'(net {nid}))\n'
        for a, b, L, nid, _n in tracks if a != b)
    vs = "".join(
        f'  (via (at {p[0]:.3f} {p[1]:.3f}) (size {VIA_D}) '
        f'(drill {VIA_DRILL}) (layers F.Cu B.Cu) (net {nid}))\n'
        for p, nid, _n in vias)

    out = t.rstrip()
    assert out.endswith(")")
    out = out[:-1] + zone + seg + vs + ")\n"
    open(dst, "w", encoding="utf-8").write(out)

    total = len(order)
    print(f"wrote {dst}\n")
    print(f"  GND       : poured as a zone on B.Cu "
          f"({len(by_net[POUR_NET])} pads, not routed)")
    print(f"  nets routed: {len(routed)} / {total}")
    print(f"  segments   : {len(tracks)}")
    print(f"  vias       : {len(vias)}")
    if failed:
        print(f"\n  {len(failed)} connection(s) NOT routed — left as ratsnest:")
        for f in failed[:25]:
            print(f"    - {f}")
        if len(failed) > 25:
            print(f"    ... and {len(failed) - 25} more")
    return 0


if __name__ == "__main__":
    a = sys.argv[1] if len(sys.argv) > 1 else "Taptile_HE.kicad_pcb"
    b = sys.argv[2] if len(sys.argv) > 2 else a.replace(".kicad_pcb",
                                                        "_routed.kicad_pcb")
    sys.exit(main(a, b))
