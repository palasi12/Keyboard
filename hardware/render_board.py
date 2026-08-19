#!/usr/bin/env python3
"""
Render the Taptile PCB to images without KiCad.

Parses the generated .kicad_pcb and draws two views:

    taptile_pcb_top.svg   copper, pads, silkscreen, board outline -- what the
                          fab sees, and what KiCad's PCB editor shows
    taptile_pcb_3d.svg    isometric view with real component heights -- the
                          equivalent of KiCad's 3D viewer

Both are vector, so they stay sharp at any zoom.

Component heights are taken from the datasheets rather than guessed, because
the whole point of the 3D view is to catch mechanical collisions -- an encoder
that fouls a keycap, or a USB connector that sits proud of the case.
"""

import math
import os
import re
import sys

# --------------------------------------------------------------- heights ----
# mm above the top surface of the board.
HEIGHTS = [
    ("SW_Cherry_MX",       11.6, "#2b2b2b", "MX switch"),
    ("RotaryEncoder",      20.0, "#8a8f98", "EC11 encoder"),
    ("USB_C",               3.2, "#c8ccd2", "USB-C"),
    ("QFN-56",              0.9, "#1b1b1b", "RP2040"),
    ("SOIC-8",              1.75, "#1b1b1b", "flash"),
    ("SOT-23",              1.1, "#1b1b1b", "LDO"),
    ("Crystal_SMD",         0.8, "#b9bfc7", "crystal"),
    ("PinHeader",           2.6, "#1b1b1b", "header"),
    ("SW_SPST",             1.6, "#3d3d3d", "button"),
    ("C_0402", 0.55, "#8d7b5a", "cap"), ("C_0603", 0.9, "#8d7b5a", "cap"),
    ("C_0805", 1.1, "#8d7b5a", "cap"), ("R_0402", 0.45, "#2b2b2b", "res"),
    ("SK6812", 1.0, "#e8e4d8", "RGB LED"),
    ("SOIC-16", 1.75, "#1b1b1b", "analog mux"),
    ("SOT-23.kicad", 1.1, "#1b1b1b", "hall sensor"),
    ("MountingHole",        0.0, "#0a3d20", "hole"),
]

COPPER = "#c9a227"
SOLDER = "#0d5c33"
SILK = "#f2f2f2"
EDGE = "#e8e8e8"


def part_style(fp):
    for key, h, col, kind in HEIGHTS:
        if key in fp:
            return h, col, kind
    return 1.0, "#555555", "part"


# ---------------------------------------------------------------- parser ----
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


NUM = r"(-?[\d.]+)"


def parse(path):
    t = open(path, encoding="utf-8").read()

    edges = []
    for m in re.finditer(
            rf"\(gr_line \(start {NUM} {NUM}\) \(end {NUM} {NUM}\) "
            rf"\(layer Edge\.Cuts\)", t):
        edges.append(("line", *[float(g) for g in m.groups()]))
    for m in re.finditer(
            rf"\(gr_arc \(start {NUM} {NUM}\) \(end {NUM} {NUM}\) "
            rf"\(angle {NUM}\) \(layer Edge\.Cuts\)", t):
        edges.append(("arc", *[float(g) for g in m.groups()]))

    board_silk = []
    for m in re.finditer(
            rf"\(gr_line \(start {NUM} {NUM}\) \(end {NUM} {NUM}\) "
            rf"\(layer F\.SilkS\)", t):
        board_silk.append(tuple(float(g) for g in m.groups()))

    segs = []
    for m in re.finditer(
            rf"\(segment \(start {NUM} {NUM}\) \(end {NUM} {NUM}\) "
            rf"\(width {NUM}\) \(layer (\S+)\)", t):
        segs.append((float(m.group(1)), float(m.group(2)), float(m.group(3)),
                     float(m.group(4)), float(m.group(5)), m.group(6)))
    vias = [(float(m.group(1)), float(m.group(2)), float(m.group(3)))
            for m in re.finditer(rf"\(via \(at {NUM} {NUM}\) \(size {NUM}\)", t)]

    parts = []
    for b in blocks(t, "(module "):
        fp = re.match(r"\(module (\S+)", b).group(1)
        at = re.search(rf"\n\s*\(at {NUM} {NUM}", b)
        if not at:
            continue
        ox, oy = float(at.group(1)), float(at.group(2))
        ref = (re.search(r"\(fp_text reference (\S+)", b) or [None, "?"])[1] \
            if isinstance(re.search(r"\(fp_text reference (\S+)", b), re.Match) \
            else "?"
        m = re.search(r"\(fp_text reference (\S+)", b)
        ref = m.group(1) if m else "?"

        pads = []
        for pb in blocks(b, "(pad "):
            pm = re.match(r'\(pad\s+("(?:[^"]*)"|\S+)\s+(\S+)\s+(\S+)', pb)
            if not pm:
                continue
            ptype, shape = pm.group(2), pm.group(3)
            pa = re.search(rf"\(at {NUM} {NUM}", pb)
            ps = re.search(rf"\(size {NUM} {NUM}", pb)
            dr = re.search(rf"\(drill {NUM}", pb)
            net = re.search(r'\(net \d+ "([^"]*)"', pb)
            if not (pa and ps):
                continue
            pads.append(dict(
                x=ox + float(pa.group(1)), y=oy + float(pa.group(2)),
                w=float(ps.group(1)), h=float(ps.group(2)),
                shape=shape, ptype=ptype,
                drill=float(dr.group(1)) if dr else 0.0,
                net=net.group(1) if net else ""))

        silk = []
        for m2 in re.finditer(
                rf"\(fp_line \(start {NUM} {NUM}\) \(end {NUM} {NUM}\) "
                rf"\(layer F\.SilkS\)", b):
            a, c, d, e = [float(g) for g in m2.groups()]
            silk.append((ox + a, oy + c, ox + d, oy + e))

        crt = [float(g) for m3 in re.finditer(
            rf"\(fp_line \(start {NUM} {NUM}\) \(end {NUM} {NUM}\) "
            rf"\(layer F\.CrtYd\)", b) for g in m3.groups()]
        if crt:
            xs, ys = crt[0::2], crt[1::2]
            bbox = (ox + min(xs), oy + min(ys), ox + max(xs), oy + max(ys))
        else:
            xs = [p["x"] for p in pads] or [ox]
            ys = [p["y"] for p in pads] or [oy]
            bbox = (min(xs) - 1, min(ys) - 1, max(xs) + 1, max(ys) + 1)

        parts.append(dict(ref=ref, fp=fp, x=ox, y=oy,
                          pads=pads, silk=silk, bbox=bbox))
    return edges, parts, board_silk, segs, vias


# ------------------------------------------------------------- top view -----
def render_top(edges, parts, dst, scale=7.0, pad=14, board_silk=(), segs=(), vias=()):
    xs = [e[1] for e in edges] + [e[3] for e in edges]
    ys = [e[2] for e in edges] + [e[4] for e in edges]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    W = (x1 - x0) * scale + pad * 2
    H = (y1 - y0) * scale + pad * 2

    def X(v):
        return (v - x0) * scale + pad

    def Y(v):
        return (v - y0) * scale + pad

    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" '
         f'height="{H:.0f}" viewBox="0 0 {W:.0f} {H:.0f}">',
         '<rect width="100%" height="100%" fill="#0b0a0a"/>',
         f'<rect x="{X(x0):.1f}" y="{Y(y0):.1f}" '
         f'width="{(x1 - x0) * scale:.1f}" height="{(y1 - y0) * scale:.1f}" '
         f'rx="{3 * scale:.1f}" fill="{SOLDER}" stroke="{EDGE}" '
         f'stroke-width="1.5"/>']

    for x1, y1, x2, y2, w, layer in segs:
        col = "#d4732a" if layer == "F.Cu" else "#3a7fd4"
        s.append(f'<line x1="{X(x1):.1f}" y1="{Y(y1):.1f}" x2="{X(x2):.1f}" '
                 f'y2="{Y(y2):.1f}" stroke="{col}" stroke-width="{w * scale:.1f}" '
                 f'stroke-linecap="round" opacity="0.9"/>')
    for vx, vy, vd in vias:
        s.append(f'<circle cx="{X(vx):.1f}" cy="{Y(vy):.1f}" '
                 f'r="{vd / 2 * scale:.1f}" fill="#9aa0a6"/>')

    for a, b, c, d in board_silk:
        s.append(f'<line x1="{X(a):.1f}" y1="{Y(b):.1f}" x2="{X(c):.1f}" '
                 f'y2="{Y(d):.1f}" stroke="{SILK}" stroke-width="1.4" '
                 f'opacity="0.75"/>')

    for p in parts:
        for a, b, c, d in p["silk"]:
            s.append(f'<line x1="{X(a):.1f}" y1="{Y(b):.1f}" x2="{X(c):.1f}" '
                     f'y2="{Y(d):.1f}" stroke="{SILK}" stroke-width="0.8" '
                     f'opacity="0.55"/>')

    for p in parts:
        for q in p["pads"]:
            w, h = q["w"] * scale, q["h"] * scale
            col = COPPER if q["net"] else "#6f6f6f"
            if q["shape"] == "circle" or (q["ptype"] == "np_thru_hole"):
                s.append(f'<circle cx="{X(q["x"]):.1f}" cy="{Y(q["y"]):.1f}" '
                         f'r="{w / 2:.1f}" fill="{col}"/>')
            else:
                s.append(f'<rect x="{X(q["x"]) - w / 2:.1f}" '
                         f'y="{Y(q["y"]) - h / 2:.1f}" width="{w:.1f}" '
                         f'height="{h:.1f}" rx="{min(w, h) * 0.22:.1f}" '
                         f'fill="{col}"/>')
            if q["drill"]:
                s.append(f'<circle cx="{X(q["x"]):.1f}" cy="{Y(q["y"]):.1f}" '
                         f'r="{q["drill"] / 2 * scale:.1f}" fill="#0b0a0a"/>')

    for p in parts:
        bx0, by0, bx1, by1 = p["bbox"]
        s.append(f'<text x="{X((bx0 + bx1) / 2):.1f}" y="{Y(by0) - 2:.1f}" '
                 f'fill="{SILK}" font-family="monospace" font-size="7" '
                 f'text-anchor="middle" opacity="0.85">{p["ref"]}</text>')

    s.append("</svg>")
    open(dst, "w").write("\n".join(s))
    return W, H


# -------------------------------------------------------------- 3d view -----
def render_3d(edges, parts, dst, scale=6.0):
    xs = [e[1] for e in edges] + [e[3] for e in edges]
    ys = [e[2] for e in edges] + [e[4] for e in edges]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)

    ax = math.radians(30)
    THICK = 1.6

    def iso(x, y, z):
        u = (x - x0) - (y - y0)
        v = ((x - x0) + (y - y0)) * math.sin(ax) - z
        return u * scale * 0.87, v * scale * 0.62

    pts = [iso(x, y, z) for x in (x0, x1) for y in (y0, y1)
           for z in (-THICK, 22)]
    us = [p[0] for p in pts]
    vs = [p[1] for p in pts]
    pad = 30
    W = max(us) - min(us) + pad * 2
    H = max(vs) - min(vs) + pad * 2
    ou, ov = -min(us) + pad, -min(vs) + pad

    def P(x, y, z):
        u, v = iso(x, y, z)
        return f"{u + ou:.1f},{v + ov:.1f}"

    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" '
         f'height="{H:.0f}" viewBox="0 0 {W:.0f} {H:.0f}">',
         '<rect width="100%" height="100%" fill="#0b0a0a"/>']

    # board slab
    s.append(f'<polygon points="{P(x0,y0,0)} {P(x1,y0,0)} {P(x1,y1,0)} '
             f'{P(x0,y1,0)}" fill="{SOLDER}" stroke="#0a4526"/>')
    for a, b in ((x0, y1), (x1, y1)):
        s.append(f'<polygon points="{P(a,b,0)} {P(x1,y1,0)} '
                 f'{P(x1,y1,-THICK)} {P(a,b,-THICK)}" fill="#093d21"/>')
    s.append(f'<polygon points="{P(x0,y1,0)} {P(x1,y1,0)} {P(x1,y1,-THICK)} '
             f'{P(x0,y1,-THICK)}" fill="#08381e"/>')
    s.append(f'<polygon points="{P(x1,y0,0)} {P(x1,y1,0)} {P(x1,y1,-THICK)} '
             f'{P(x1,y0,-THICK)}" fill="#0a4324"/>')

    # parts, painted back to front
    def depth(p):
        bx0, by0, bx1, by1 = p["bbox"]
        return (bx0 + bx1) / 2 + (by0 + by1) / 2

    def box(a, b, c, d, z0, z1, col, op=1.0):
        s.append(f'<polygon points="{P(a,b,z1)} {P(c,b,z1)} {P(c,d,z1)} '
                 f'{P(a,d,z1)}" fill="{col}" fill-opacity="{op}" stroke="#000" '
                 f'stroke-width="0.3" stroke-opacity="0.5"/>')
        s.append(f'<polygon points="{P(a,d,z1)} {P(c,d,z1)} {P(c,d,z0)} '
                 f'{P(a,d,z0)}" fill="{col}" fill-opacity="{op * 0.72:.2f}" '
                 f'stroke="#000" stroke-width="0.3" stroke-opacity="0.4"/>')
        s.append(f'<polygon points="{P(c,b,z1)} {P(c,d,z1)} {P(c,d,z0)} '
                 f'{P(c,b,z0)}" fill="{col}" fill-opacity="{op * 0.55:.2f}" '
                 f'stroke="#000" stroke-width="0.3" stroke-opacity="0.4"/>')

    for p in sorted(parts, key=depth):
        h, col, _kind = part_style(p["fp"])
        if h <= 0:
            continue
        a, b, c, d = p["bbox"]

        # An EC11 is a 6.5 mm body with a 6 mm shaft sticking out of it. Drawing
        # the whole courtyard as one 20 mm block hides everything behind it and
        # makes the board look far more crowded than it is.
        if "RotaryEncoder" in p["fp"]:
            box(a, b, c, d, 0, 6.5, col)
            mx, my = (a + c) / 2, (b + d) / 2
            box(mx - 3, my - 3, mx + 3, my + 3, 6.5, h, "#6f757e")
            continue

        box(a, b, c, d, 0, h, col)

    s.append("</svg>")
    open(dst, "w").write("\n".join(s))
    return W, H


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "Taptile_RP2040.kicad_pcb"
    edges, parts, bsilk, segs, vias = parse(src)
    d = os.path.dirname(os.path.abspath(src))
    w1, h1 = render_top(edges, parts, os.path.join(d, "taptile_pcb_top.svg"), board_silk=bsilk, segs=segs, vias=vias)
    w2, h2 = render_3d(edges, parts, os.path.join(d, "taptile_pcb_3d.svg"))
    npad = sum(len(p["pads"]) for p in parts)
    nnet = sum(1 for p in parts for q in p["pads"] if q["net"])
    print(f"parsed {len(parts)} components, {npad} pads, {nnet} netted")
    print(f"  taptile_pcb_top.svg  {w1:.0f}x{h1:.0f}")
    print(f"  taptile_pcb_3d.svg   {w2:.0f}x{h2:.0f}")
