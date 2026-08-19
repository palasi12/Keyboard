#!/usr/bin/env python3
"""
Route the Taptile board properly: 4 layers, plane vias, A* for signals.

    usage: python3 route_board4.py Taptile_HE.kicad_pcb Taptile_HE_routed.kicad_pcb

WHY FOUR LAYERS

    The two-layer attempt routed 26 of 58 nets. Every failure was the same
    thing: escaping the RP2040. A QFN-56 has 0.4mm pitch, so the corridor
    between two adjacent pads is 0.2mm wide. A 0.25mm trace with 0.2mm
    clearance needs 0.65mm. It does not fit, and no amount of cleverness makes
    it fit -- that is geometry, not router quality.

    Two things fix it together:

    * 0.15mm track and 0.15mm clearance (JLCPCB's standard 2-layer capability
      is 0.127mm, so this is comfortably inside spec, not a stretch goal).
      0.15 + 0.15 + 0.15 = 0.45mm, and pads fan out radially, so by 6mm from
      the die centre the pitch has opened to 0.62mm. That escapes.

    * Dedicated GND and +3V3 planes on the inner layers. Those are the two
      biggest nets; giving them planes removes ~110 pads from the routing
      problem entirely and replaces each with a single via.

    The cost is real but small -- JLCPCB 4-layer is roughly USD$2 more for five
    boards at this size. In exchange you get an unbroken ground plane directly
    under the USB pair and under all nine analog Hall lines, which is the
    single biggest factor in whether this board actually works. On two layers
    that plane is chopped up by signal routing.

STACKUP
    F.Cu    signal
    In1.Cu  GND plane
    In2.Cu  +3V3 plane
    B.Cu    signal
"""

import heapq
import re
import sys
from collections import defaultdict

GRID = 0.1
TRACK = 0.15
CLEAR = 0.15
VIA_D = 0.55
VIA_DRILL = 0.25
VIA_COST = 22
TRACE_HALO = 3      # cells: 0.15/2 + 0.15 + 0.15/2 = 0.30mm
VIA_HALO = 5        # cells: 0.55/2 + 0.15 + 0.15/2 = 0.50mm
BOARD = (65.0, 135.0, 40.0, 160.0)
PLANES = {"GND": "In1.Cu", "+3V3": "In2.Cu"}

NUM = r"(-?[\d.]+)"

LAYERS4 = """  (layers
    (0 F.Cu signal)
    (1 In1.Cu power)
    (2 In2.Cu power)
    (31 B.Cu signal)
    (32 B.Adhes user)
    (33 F.Adhes user)
    (34 B.Paste user)
    (35 F.Paste user)
    (36 B.SilkS user)
    (37 F.SilkS user)
    (38 B.Mask user)
    (39 F.Mask user)
    (40 Dwgs.User user)
    (41 Cmts.User user)
    (42 Eco1.User user)
    (43 Eco2.User user)
    (44 Edge.Cuts user)
    (45 Margin user)
    (46 B.CrtYd user)
    (47 F.CrtYd user)
    (48 B.Fab user)
    (49 F.Fab user)
  )
"""


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
    netnames = dict(re.findall(r'\(net (\d+) "([^"]*)"', t))
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
            pads.append(dict(
                ref=ref, name=pm.group(1).strip('"'),
                x=ox + float(pa.group(1)), y=oy + float(pa.group(2)),
                w=float(ps.group(1)), h=float(ps.group(2)),
                thru=pm.group(2) != "smd",
                netid=int(nm.group(1)) if nm else 0,
                net=nm.group(2) if nm else ""))
    return t, netnames, pads


class Grid:
    def __init__(self):
        x0, x1, y0, y1 = BOARD
        self.x0, self.y0 = x0, y0
        self.nx = int((x1 - x0) / GRID) + 1
        self.ny = int((y1 - y0) / GRID) + 1
        self.g = [bytearray(self.nx * self.ny) for _ in range(2)]
        self.owner = [dict(), dict()]

    def to_cell(self, x, y):
        return (int(round((x - self.x0) / GRID)),
                int(round((y - self.y0) / GRID)))

    def to_mm(self, cx, cy):
        return (self.x0 + cx * GRID, self.y0 + cy * GRID)

    def stamp(self, x, y, w, h, netid, layers):
        halo = CLEAR + TRACK / 2
        cx0, cy0 = self.to_cell(x - w / 2 - halo, y - h / 2 - halo)
        cx1, cy1 = self.to_cell(x + w / 2 + halo, y + h / 2 + halo)
        for L in layers:
            g, own = self.g[L], self.owner[L]
            for cy in range(max(0, cy0), min(self.ny, cy1 + 1)):
                base = cy * self.nx
                for cx in range(max(0, cx0), min(self.nx, cx1 + 1)):
                    k = base + cx
                    if g[k] == 0:
                        g[k] = 1
                        own[k] = netid

    def free(self, L, cx, cy, netid):
        if not (0 <= cx < self.nx and 0 <= cy < self.ny):
            return False
        k = cy * self.nx + cx
        return self.g[L][k] == 0 or self.owner[L].get(k) == netid

    def claim(self, L, cx, cy, netid):
        if 0 <= cx < self.nx and 0 <= cy < self.ny:
            k = cy * self.nx + cx
            self.g[L][k] = 1
            self.owner[L][k] = netid


def astar(grid, sources, targets, netid, budget=400000):
    tset = set(targets)
    if not tset or not sources:
        return None
    tx = sum(c[1] for c in tset) / len(tset)
    ty = sum(c[2] for c in tset) / len(tset)
    openq, best, came = [], {}, {}
    for s in sources:
        if grid.free(s[0], s[1], s[2], netid):
            best[s] = 0
            heapq.heappush(openq, (abs(s[1] - tx) + abs(s[2] - ty), 0, s, None))
    seen = 0
    while openq and seen < budget:
        _f, g0, cur, prev = heapq.heappop(openq)
        if cur in came:
            continue
        came[cur] = prev
        seen += 1
        if cur in tset:
            path, n = [], cur
            while n is not None:
                path.append(n)
                n = came[n]
            return path[::-1]
        L, cx, cy = cur
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx_, ny_ = cx + dx, cy + dy
            nxt = (L, nx_, ny_)
            if nxt in came or not grid.free(L, nx_, ny_, netid):
                continue
            ng = g0 + 1
            if best.get(nxt, 1 << 30) <= ng:
                continue
            best[nxt] = ng
            heapq.heappush(openq, (ng + abs(nx_ - tx) + abs(ny_ - ty),
                                   ng, nxt, cur))
        nxt = (1 - L, cx, cy)
        if nxt not in came and grid.free(1 - L, cx, cy, netid):
            ng = g0 + VIA_COST
            if best.get(nxt, 1 << 30) > ng:
                best[nxt] = ng
                heapq.heappush(openq, (ng + abs(cx - tx) + abs(cy - ty),
                                       ng, nxt, cur))
    return None


def main(src, dst):
    t, netnames, pads = load(src)
    grid = Grid()
    by_net = defaultdict(list)
    for p in pads:
        if p["net"]:
            by_net[p["net"]].append(p)

    for p in pads:
        grid.stamp(p["x"], p["y"], p["w"], p["h"], p["netid"] or -1,
                   (0, 1) if p["thru"] else (0,))

    tracks, vias = [], []
    plane_vias, unplaced = [], []

    # GND and +3V3 pads each get one via down to their plane. These are placed
    # BEFORE signal routing and stamped into the grid -- the first version
    # emitted them afterwards, so the router happily drove signal traces
    # straight through them. DRC caught 419 trace-to-pad violations from that.
    def can_via(cx, cy, netid):
        return all(grid.free(L, cx + a, cy + b, netid)
                   for L in (0, 1)
                   for a in (-VIA_HALO, 0, VIA_HALO)
                   for b in (-VIA_HALO, 0, VIA_HALO))

    def escape(p, netid, maxsteps=90000):
        """Dijkstra from the pad out to the nearest cell that can host a via.

        A straight line from pad to via is what the previous version did, and
        on a 0.4mm-pitch QFN it drove the stub straight across the neighbouring
        pads -- 431 DRC violations. Plane pads have to escape radially exactly
        like signal pads do."""
        import heapq as _h
        s = grid.to_cell(p["x"], p["y"])
        q, seen, came = [(0, s)], {s: 0}, {s: None}
        best = None
        while q and len(seen) < maxsteps:
            d, cur = _h.heappop(q)
            if d > seen.get(cur, 1 << 30):
                continue
            if can_via(cur[0], cur[1], netid):
                best = cur
                break
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx_, ny_ = cur[0] + dx, cur[1] + dy
                if not grid.free(0, nx_, ny_, netid):
                    continue
                nd = d + 1
                if nd < seen.get((nx_, ny_), 1 << 30):
                    seen[(nx_, ny_)] = nd
                    came[(nx_, ny_)] = cur
                    _h.heappush(q, (nd, (nx_, ny_)))
        if best is None:
            return None
        path, n = [], best
        while n is not None:
            path.append(n)
            n = came[n]
        return path[::-1]

    # Keep all copper clear of the board edge.
    ex0, ex1, ey0, ey1 = BOARD
    for L in (0, 1):
        for cx in range(grid.nx):
            for cy in range(grid.ny):
                x, y = grid.to_mm(cx, cy)
                if not (ex0 + 0.45 < x < ex1 - 0.45 and
                        ey0 + 0.45 < y < ey1 - 0.45):
                    grid.claim(L, cx, cy, -2)

    for net in PLANES:
        for p in sorted(by_net.get(net, []), key=lambda q: -q["w"] * q["h"]):
            if p["thru"]:
                continue
            if p["w"] > 2.0 and p["h"] > 2.0:          # RP2040 thermal pad
                step = p["w"] / 3
                for i in (-1, 0, 1):
                    for j in (-1, 0, 1):
                        vx, vy = p["x"] + i * step, p["y"] + j * step
                        plane_vias.append(((vx, vy), p["netid"], net))
                        grid.stamp(vx, vy, VIA_D, VIA_D, p["netid"], (0, 1))
                continue
            path = escape(p, p["netid"])
            if path is None:
                unplaced.append(f"{net}: {p['ref']}.{p['name']}")
                continue
            for i in range(len(path) - 1):
                a, b = grid.to_mm(*path[i]), grid.to_mm(*path[i + 1])
                tracks.append((a, b, 0, p["netid"], net))
            vx, vy = grid.to_mm(*path[-1])
            plane_vias.append(((vx, vy), p["netid"], net))
            grid.stamp(vx, vy, VIA_D, VIA_D, p["netid"], (0, 1))
            for cx, cy in path:
                for a in range(-TRACE_HALO, TRACE_HALO + 1):
                    for b in range(-TRACE_HALO, TRACE_HALO + 1):
                        grid.claim(0, cx + a, cy + b, p["netid"])

    routed, failed = [], []
    signal = [n for n in by_net if n not in PLANES]
    signal.sort(key=lambda n: (len(by_net[n]),
                               max(q["x"] for q in by_net[n])
                               - min(q["x"] for q in by_net[n])))

    for net in signal:
        group = by_net[net]
        if len(group) < 2:
            continue
        netid = group[0]["netid"]
        connected, remaining, ok = [group[0]], group[1:], True
        while remaining:
            remaining.sort(key=lambda q: min(
                (q["x"] - c["x"]) ** 2 + (q["y"] - c["y"]) ** 2
                for c in connected))
            tgt = remaining.pop(0)

            def cells(p):
                cx, cy = grid.to_cell(p["x"], p["y"])
                return [(L, cx, cy) for L in ((0, 1) if p["thru"] else (0,))]

            path = astar(grid, [c for p in connected for c in cells(p)],
                         cells(tgt), netid)
            if not path:
                failed.append(f"{net}: {tgt['ref']}.{tgt['name']}")
                ok = False
                connected.append(tgt)
                continue

            run = [path[0]]
            for c in path[1:]:
                if c[0] != run[-1][0]:
                    if len(run) > 1:
                        tracks.append((grid.to_mm(*run[0][1:]),
                                       grid.to_mm(*run[-1][1:]),
                                       run[0][0], netid, net))
                    vias.append((grid.to_mm(c[1], c[2]), netid, net))
                    run = [c]
                else:
                    if len(run) >= 2:
                        d1 = (run[-1][1] - run[-2][1], run[-1][2] - run[-2][2])
                        d2 = (c[1] - run[-1][1], c[2] - run[-1][2])
                        if d1 != d2:
                            tracks.append((grid.to_mm(*run[0][1:]),
                                           grid.to_mm(*run[-1][1:]),
                                           run[0][0], netid, net))
                            run = [run[-1]]
                    run.append(c)
            if len(run) > 1:
                tracks.append((grid.to_mm(*run[0][1:]),
                               grid.to_mm(*run[-1][1:]),
                               run[0][0], netid, net))
            vcells = {(c[1], c[2]) for i, c in enumerate(path[:-1])
                      if path[i + 1][0] != c[0]}
            for L, cx, cy in path:
                r = VIA_HALO if (cx, cy) in vcells else TRACE_HALO
                for ddx in range(-r, r + 1):
                    for ddy in range(-r, r + 1):
                        grid.claim(L, cx + ddx, cy + ddy, netid)
            connected.append(tgt)
        if ok:
            routed.append(net)

    # ----------------------------------------------------------- emit -------
    x0, x1, y0, y1 = BOARD
    zones = ""
    for net, layer in PLANES.items():
        nid = next((int(i) for i, n in netnames.items() if n == net), 1)
        zones += (f'  (zone (net {nid}) (net_name "{net}") (layer {layer})\n'
                  f'    (hatch edge 0.508)\n'
                  f'    (connect_pads (clearance 0.2))\n'
                  f'    (min_thickness 0.2)\n'
                  f'    (fill yes (arc_segments 32) (thermal_gap 0.2)\n'
                  f'      (thermal_bridge_width 0.3))\n'
                  f'    (polygon (pts (xy {x0} {y0}) (xy {x1} {y0}) '
                  f'(xy {x1} {y1}) (xy {x0} {y1})))\n  )\n')

    seg = "".join(
        f'  (segment (start {a[0]:.3f} {a[1]:.3f}) (end {b[0]:.3f} {b[1]:.3f}) '
        f'(width {TRACK}) (layer {"F.Cu" if L == 0 else "B.Cu"}) (net {nid}))\n'
        for a, b, L, nid, _ in tracks if a != b)
    vs = "".join(
        f'  (via (at {p[0]:.3f} {p[1]:.3f}) (size {VIA_D}) '
        f'(drill {VIA_DRILL}) (layers F.Cu B.Cu) (net {nid}))\n'
        for p, nid, _ in vias + plane_vias)

    out = t.rstrip()
    out = re.sub(r"  \(layers\n(?:.*?\n)*?  \)\n", LAYERS4, out, count=1)
    out = out[:-1] + zones + seg + vs + ")\n"
    open(dst, "w", encoding="utf-8").write(out)

    print(f"wrote {dst}\n")
    print("  stackup    : F.Cu / In1.Cu=GND / In2.Cu=+3V3 / B.Cu")
    print(f"  track/clear: {TRACK}mm / {CLEAR}mm  (JLCPCB min 0.127mm)")
    for net in PLANES:
        print(f"  {net:10s}: plane, {len(by_net.get(net, []))} pads via-dropped")
    print(f"  signal nets: {len(routed)} / {len(signal)} fully routed")
    print(f"  segments   : {len(tracks)}   vias: {len(vias) + len(plane_vias)}")
    if unplaced:
        print(f"\n  {len(unplaced)} plane pad(s) with no room for a via:")
        for u in unplaced[:10]:
            print(f"    - {u}")
    if failed:
        print(f"\n  {len(failed)} connection(s) unrouted (left as ratsnest):")
        for f in failed[:20]:
            print(f"    - {f}")
        if len(failed) > 20:
            print(f"    ... and {len(failed) - 20} more")
    return 0


if __name__ == "__main__":
    a = sys.argv[1] if len(sys.argv) > 1 else "Taptile_HE.kicad_pcb"
    b = sys.argv[2] if len(sys.argv) > 2 else "Taptile_HE_routed.kicad_pcb"
    sys.exit(main(a, b))
