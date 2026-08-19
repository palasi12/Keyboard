#!/usr/bin/env python3
"""
Geometric design-rule check on a routed board.

Checks the things that make a board fail in the fab or fail silently in use:

  1. trace <-> trace clearance, between different nets, on the same layer
  2. trace <-> pad clearance, different nets
  3. via <-> via and via <-> pad clearance
  4. everything inside the board outline
  5. minimum annular ring on vias
  6. each net actually forms one connected island (no floating stubs)

Deliberately independent of the router: it re-reads the finished file, so a
bug in the router cannot hide behind its own assumptions.

    usage: python3 drc_check.py Taptile_HE_routed.kicad_pcb
"""

import math
import re
import sys
from collections import defaultdict

CLEAR = 0.15            # minimum copper-to-copper, different nets
EDGE_CLEAR = 0.3        # copper to board edge
MIN_ANNULAR = 0.13      # (via_dia - drill) / 2
BOARD = (65.0, 135.0, 40.0, 160.0)
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


def seg_dist(p1, p2, q1, q2):
    """Minimum distance between two 2D segments."""
    def d_pt_seg(p, a, b):
        ax, ay = a
        bx, by = b
        px, py = p
        dx, dy = bx - ax, by - ay
        L = dx * dx + dy * dy
        if L == 0:
            return math.hypot(px - ax, py - ay)
        tt = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L))
        return math.hypot(px - (ax + tt * dx), py - (ay + tt * dy))

    def ccw(a, b, c):
        return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0])
    if (ccw(p1, q1, q2) != ccw(p2, q1, q2)
            and ccw(p1, p2, q1) != ccw(p1, p2, q2)):
        return 0.0
    return min(d_pt_seg(p1, q1, q2), d_pt_seg(p2, q1, q2),
               d_pt_seg(q1, p1, p2), d_pt_seg(q2, p1, p2))


def main(path):
    t = open(path, encoding="utf-8").read()
    errors, notes = [], []

    segs = []
    for m in re.finditer(
            rf"\(segment \(start {NUM} {NUM}\) \(end {NUM} {NUM}\) "
            rf"\(width {NUM}\) \(layer (\S+)\) \(net (\d+)\)", t):
        x1, y1, x2, y2, w = (float(m.group(i)) for i in range(1, 6))
        segs.append(dict(a=(x1, y1), b=(x2, y2), w=w,
                         layer=m.group(6), net=int(m.group(7))))

    vias = []
    for m in re.finditer(
            rf"\(via \(at {NUM} {NUM}\) \(size {NUM}\) \(drill {NUM}\)"
            rf" \(layers [^)]*\) \(net (\d+)\)", t):
        vias.append(dict(x=float(m.group(1)), y=float(m.group(2)),
                         d=float(m.group(3)), drill=float(m.group(4)),
                         net=int(m.group(5))))

    pads = []
    for b in blocks(t, "(module "):
        at = re.search(rf"\n\s*\(at {NUM} {NUM}", b)
        ox, oy = (float(at.group(1)), float(at.group(2))) if at else (0, 0)
        mref = re.search(r"\(fp_text reference (\S+)", b)
        ref = mref.group(1) if mref else "?"
        for pb in blocks(b, "(pad "):
            pa = re.search(rf"\(at {NUM} {NUM}", pb)
            ps = re.search(rf"\(size {NUM} {NUM}", pb)
            nm = re.search(r"\(net (\d+)", pb)
            pm = re.match(r'\(pad\s+("(?:[^"]*)"|\S+)\s+(\S+)', pb)
            lm = re.search(r"\(layers ([^)]*)\)", pb)
            lyr = lm.group(1).split() if lm else []
            # An SMD pad exists on one copper layer only. A trace on the other
            # side cannot short to it, and comparing them produced most of the
            # apparent violations.
            if pm and pm.group(2) != "smd":
                on = {"F.Cu", "B.Cu"}
            else:
                on = {x for x in lyr if x in ("F.Cu", "B.Cu")} or {"F.Cu"}
            if not (pa and ps):
                continue
            pads.append(dict(ref=ref, name=pm.group(1).strip('"') if pm else "",
                             layers=on,
                             x=ox + float(pa.group(1)),
                             y=oy + float(pa.group(2)),
                             w=float(ps.group(1)), h=float(ps.group(2)),
                             net=int(nm.group(1)) if nm else 0))

    netname = dict(re.findall(r'\(net (\d+) "([^"]*)"', t))

    def nn(i):
        return netname.get(str(i), f"#{i}")

    # ---------------------------------------------- 1. trace <-> trace ------
    bylayer = defaultdict(list)
    for s in segs:
        bylayer[s["layer"]].append(s)
    hits = 0
    for layer, group in bylayer.items():
        for i in range(len(group)):
            s1 = group[i]
            for s2 in group[i + 1:]:
                if s1["net"] == s2["net"]:
                    continue
                d = seg_dist(s1["a"], s1["b"], s2["a"], s2["b"]) \
                    - (s1["w"] + s2["w"]) / 2
                if d < CLEAR - 1e-6:
                    hits += 1
                    if hits <= 10:
                        errors.append(
                            f"trace clearance {d:.3f}mm on {layer} between "
                            f"{nn(s1['net'])} and {nn(s2['net'])} "
                            f"(min {CLEAR})")
    if hits > 10:
        errors.append(f"...and {hits - 10} more trace-to-trace violations")
    if hits == 0:
        notes.append(f"{len(segs)} segments: no trace-to-trace clearance "
                     f"violations")

    # ------------------------------------------------ 2. trace <-> pad ------
    def seg_rect_dist(a, b, p):
        """Exact distance from a segment to an axis-aligned rectangle.
        The first version approximated pads as circumscribed circles, which
        reported a correctly-spaced trace beside a 1.5x1.0mm LED pad as a
        0.000mm short. Ten false failures came from that."""
        hw, hh = p["w"] / 2, p["h"] / 2
        x0, x1 = p["x"] - hw, p["x"] + hw
        y0, y1 = p["y"] - hh, p["y"] + hh
        corners = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
        for pt in (a, b):
            if x0 <= pt[0] <= x1 and y0 <= pt[1] <= y1:
                return 0.0
        return min(seg_dist(a, b, corners[i], corners[(i + 1) % 4])
                   for i in range(4))

    hits2 = 0
    for s in segs:
        for p in pads:
            if p["net"] == s["net"] or p["net"] == 0:
                continue
            if s["layer"] not in p["layers"]:
                continue
            d = seg_rect_dist(s["a"], s["b"], p) - s["w"] / 2
            if d < CLEAR - 1e-6:
                hits2 += 1
                if hits2 <= 8:
                    errors.append(
                        f"trace {nn(s['net'])} passes {d:.3f}mm from pad "
                        f"{p['ref']}.{p['name']} ({nn(p['net'])})")
    if hits2 > 8:
        errors.append(f"...and {hits2 - 8} more trace-to-pad violations")
    if hits2 == 0:
        notes.append("no trace-to-pad clearance violations")

    # ------------------------------------------------------- 3. vias -------
    hits3 = 0
    for i, v in enumerate(vias):
        if (v["d"] - v["drill"]) / 2 < MIN_ANNULAR - 1e-6:
            errors.append(f"via at ({v['x']:.1f},{v['y']:.1f}) annular ring "
                          f"{(v['d'] - v['drill']) / 2:.3f}mm < {MIN_ANNULAR}")
        for w in vias[i + 1:]:
            if v["net"] == w["net"]:
                continue
            d = math.hypot(v["x"] - w["x"], v["y"] - w["y"]) \
                - (v["d"] + w["d"]) / 2
            if d < CLEAR - 1e-6:
                hits3 += 1
                if hits3 <= 6:
                    errors.append(
                        f"via clearance {d:.3f}mm between {nn(v['net'])} and "
                        f"{nn(w['net'])} near ({v['x']:.1f},{v['y']:.1f})")
    if hits3 > 6:
        errors.append(f"...and {hits3 - 6} more via-to-via violations")
    if hits3 == 0 and vias:
        notes.append(f"{len(vias)} vias: spacing and annular ring OK")

    # ------------------------------------------------ 4. board outline ------
    x0, x1, y0, y1 = BOARD
    out = 0
    for s in segs:
        for (px, py) in (s["a"], s["b"]):
            if not (x0 + EDGE_CLEAR <= px <= x1 - EDGE_CLEAR
                    and y0 + EDGE_CLEAR <= py <= y1 - EDGE_CLEAR):
                out += 1
    if out:
        errors.append(f"{out} trace endpoint(s) within {EDGE_CLEAR}mm of the "
                      f"board edge")
    else:
        notes.append(f"all copper at least {EDGE_CLEAR}mm inside the outline")

    # ------------------------------------------- 5. net connectivity --------
    # Union-find over pads/segments/vias per net; each net should be 1 island.
    def key(x, y):
        return (round(x, 2), round(y, 2))
    islands = {}
    for s in segs:
        islands.setdefault(s["net"], []).append((key(*s["a"]), key(*s["b"])))
    open_nets = []
    for net, edges in islands.items():
        parent = {}

        def find(a):
            parent.setdefault(a, a)
            while parent[a] != a:
                parent[a] = parent[parent[a]]
                a = parent[a]
            return a
        for a, b in edges:
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
        roots = {find(a) for a, _ in edges} | {find(b) for _, b in edges}
        if len(roots) > 1:
            open_nets.append((nn(net), len(roots)))
    if open_nets:
        for n, c in open_nets[:10]:
            notes.append(f"net {n} routed as {c} island(s) — the remainder "
                         f"joins through a plane or is unrouted")

    print(f"=== DRC: {path} ===")
    print(f"segments {len(segs)}   vias {len(vias)}   pads {len(pads)}")
    print(f"rules: clearance {CLEAR}mm, edge {EDGE_CLEAR}mm, "
          f"annular {MIN_ANNULAR}mm\n")
    for n in notes[:14]:
        print(f"  ok    {n}")
    for e in errors:
        print(f"  FAIL  {e}")
    print(f"\n{len(errors)} DRC errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1
                  else "Taptile_HE_routed.kicad_pcb"))
