#!/usr/bin/env python3
"""
Generate an isometric exploded diagram of the Taptile Dialect.

Geometry is the Rev A9 board brief, not an approximation:
  board      64 x 91 mm, centre origin, +y = rear
  key grid   cols x = -19.05 / 0 / 19.05,  rows y = 9.05 / -10 / -29.05
  encoders   x = +/-9.525, y = 28

This is a DIAGRAM, deliberately — flat fills, visible layer separation. It is
not pretending to be a photograph of a finished unit, because the shell has not
been printed yet and any photoreal render of it would be a guess.
"""
import math

S = 3.05                      # px per mm
COS30, SIN30 = math.cos(math.radians(30)), math.sin(math.radians(30))

BOARD_W, BOARD_D = 64.0, 91.0
KEY_COLS = [-19.05, 0.0, 19.05]
KEY_ROWS = [9.05, -10.0, -29.05]
ENC_X = [-9.525, 9.525]
ENC_Y = 28.0
CAP = 17.4
KNOB_R = 7.4

# exploded heights, top of stack first
# The board is ~139px deep once projected, so the gaps have to clear that or
# the layers occlude each other instead of reading as a stack.
Z_CAPS, Z_COVER, Z_PCB, Z_ACRYLIC = 486.0, 330.0, 174.0, 18.0

GRAD = [(0.0, '#3fa0ff'), (0.52, '#8b6bff'), (1.0, '#e96bd8')]


def iso(x, y, z):
    """Board millimetres -> screen pixels, 30° isometric."""
    return ((x - y) * COS30 * S, (x + y) * SIN30 * S - z)


def face(pts, fill, stroke=None, sw=1.0, extra=''):
    d = ' '.join(f'{x:.2f},{y:.2f}' for x, y in pts)
    st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else ''
    return f'<polygon points="{d}" fill="{fill}"{st}{extra}/>'


def slab(w, d, z, thick, top, side_l, side_r, stroke=None, sw=1.0):
    """An axis-aligned slab centred on the origin, drawn as three faces."""
    hw, hd = w / 2, d / 2
    corners = [(-hw, hd), (hw, hd), (hw, -hd), (-hw, -hd)]      # rear-L, rear-R, front-R, front-L
    t = [iso(x, y, z) for x, y in corners]
    b = [iso(x, y, z - thick) for x, y in corners]
    out = []
    # left side (rear-L -> front-L), right side (front-L? no: front-R -> rear-R)
    out.append(face([t[0], t[3], b[3], b[0]], side_l, stroke, sw))
    out.append(face([t[3], t[2], b[2], b[3]], side_r, stroke, sw))
    out.append(face(t, top, stroke, sw))
    return ''.join(out)


def key_cap(cx, cy, z):
    """An XDA cap: uniform height, gently dished spherical top."""
    s = CAP / 2
    corners = [(cx - s, cy + s), (cx + s, cy + s), (cx + s, cy - s), (cx - s, cy - s)]
    h = 8.5
    top_in = s * 0.86
    tin = [(cx - top_in, cy + top_in), (cx + top_in, cy + top_in),
           (cx + top_in, cy - top_in), (cx - top_in, cy - top_in)]
    b = [iso(x, y, z) for x, y in corners]
    t = [iso(x, y, z + h) for x, y in tin]
    out = []
    out.append(face([b[0], b[3], t[3], t[0]], '#1a1a1f'))
    out.append(face([b[3], b[2], t[2], t[3]], '#141418'))
    out.append(face([b[2], b[1], t[1], t[2]], '#202027'))
    out.append(face(t, '#2b2b33', '#3a3a44', 0.7))
    # the dish
    cxp, cyp = iso(cx, cy, z + h)
    out.append(f'<ellipse cx="{cxp:.2f}" cy="{cyp:.2f}" rx="{top_in * S * COS30 * 0.92:.2f}" '
               f'ry="{top_in * S * SIN30 * 0.92:.2f}" fill="#191920" opacity=".85"/>')
    return ''.join(out)


def knob(cx, cy, z):
    """Aluminium dial: a short cylinder in isometric."""
    rx, ry = KNOB_R * S * COS30, KNOB_R * S * SIN30
    h = 26.0
    x0, y0 = iso(cx, cy, z)
    top_y = y0 - h
    out = []
    out.append(f'<path d="M {x0 - rx:.2f},{y0:.2f} A {rx:.2f},{ry:.2f} 0 0 0 {x0 + rx:.2f},{y0:.2f} '
               f'L {x0 + rx:.2f},{top_y:.2f} A {rx:.2f},{ry:.2f} 0 0 1 {x0 - rx:.2f},{top_y:.2f} Z" '
               f'fill="url(#alu)"/>')
    out.append(f'<ellipse cx="{x0:.2f}" cy="{top_y:.2f}" rx="{rx:.2f}" ry="{ry:.2f}" '
               f'fill="#b9b5b2" stroke="#6e6a68" stroke-width=".8"/>')
    out.append(f'<ellipse cx="{x0:.2f}" cy="{top_y:.2f}" rx="{rx * 0.62:.2f}" ry="{ry * 0.62:.2f}" '
               f'fill="#9a9694" opacity=".55"/>')
    return ''.join(out)


parts = []

# ---- 4. laser-cut acrylic base, lit ---------------------------------------
parts.append(f'<g id="acrylic">{slab(BOARD_W + 6, BOARD_D + 6, Z_ACRYLIC, 12, "url(#glass)", "url(#glassL)", "url(#glassR)", "#a98bff", 0.8)}</g>')

# ---- 3. custom PCB ---------------------------------------------------------
pcb = [slab(BOARD_W, BOARD_D, Z_PCB, 5, '#123026', '#0b1f18', '#0e261d', '#1d4a3a', 0.8)]
# a hint of traces + the ten underglow LEDs around the perimeter
led_pos = [(-25.0, 14.5), (-27.5, -3.5), (-25.4, -20.5), (-21.0, -37.5), (0.0, -41.0),
           (21.0, -37.5), (26.0, -20.5), (27.5, -3.5), (25.0, 14.5), (0.0, 14.5)]
for lx, ly in led_pos:
    px, py = iso(lx, ly, Z_PCB)
    pcb.append(f'<ellipse cx="{px:.2f}" cy="{py:.2f}" rx="3.1" ry="1.8" fill="#f4f1ff" opacity=".9"/>')
for cy in KEY_ROWS:
    for cx in KEY_COLS:
        px, py = iso(cx, cy, Z_PCB)
        pcb.append(f'<ellipse cx="{px:.2f}" cy="{py:.2f}" rx="8.5" ry="4.9" fill="#0a1c15" '
                   f'stroke="#c9a227" stroke-width=".7"/>')
parts.append(f'<g id="pcb">{"".join(pcb)}</g>')

# ---- 2. 3D-printed cover ---------------------------------------------------
cover = [slab(BOARD_W + 6, BOARD_D + 6, Z_COVER, 9, '#1c1b1f', '#111013', '#161518', '#2a2930', 0.9)]
# key cutouts
for cy in KEY_ROWS:
    for cx in KEY_COLS:
        s = CAP / 2 + 0.6
        pts = [iso(cx - s, cy + s, Z_COVER), iso(cx + s, cy + s, Z_COVER),
               iso(cx + s, cy - s, Z_COVER), iso(cx - s, cy - s, Z_COVER)]
        cover.append(face(pts, '#0a090b', '#2a2930', 0.7))
# the recessed dial pill + logo badge, as on the real top plate
pill = [iso(-26.5, ENC_Y + 9.5, Z_COVER), iso(20.0, ENC_Y + 9.5, Z_COVER),
        iso(20.0, ENC_Y - 9.5, Z_COVER), iso(-26.5, ENC_Y - 9.5, Z_COVER)]
cover.append(face(pill, '#0d0c0f', '#2a2930', 0.7))
parts.append(f'<g id="cover">{"".join(cover)}</g>')

# ---- 1. XDA keycaps + aluminium dials -------------------------------------
caps = []
for cy in KEY_ROWS:            # rear row first so nearer caps paint over it
    for cx in KEY_COLS:
        caps.append(key_cap(cx, cy, Z_CAPS))
parts.append(f'<g id="caps">{"".join(caps)}</g>')

dials = [knob(cx, ENC_Y, Z_CAPS) for cx in ENC_X]
parts.append(f'<g id="dials">{"".join(dials)}</g>')

# ---- canvas ---------------------------------------------------------------
xs, ys = [], []
for x, y in [(-BOARD_W / 2 - 6, -BOARD_D / 2 - 6), (BOARD_W / 2 + 6, -BOARD_D / 2 - 6),
             (BOARD_W / 2 + 6, BOARD_D / 2 + 6), (-BOARD_W / 2 - 6, BOARD_D / 2 + 6)]:
    for z in (0.0, Z_CAPS + 40):
        px, py = iso(x, y, z)
        xs.append(px); ys.append(py)
pad = 26
minx, maxx, miny, maxy = min(xs) - pad, max(xs) + pad, min(ys) - pad, max(ys) + pad
w, h = maxx - minx, maxy - miny

stops = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in GRAD)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{minx:.1f} {miny:.1f} {w:.1f} {h:.1f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="Exploded view of the Taptile Dialect: XDA keycaps and aluminium dials, a 3D-printed cover, the custom PCB with its ten underglow LEDs, and the laser-cut acrylic base">
<defs>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">{stops}</linearGradient>
  <linearGradient id="glassL" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5f7dff"/><stop offset="1" stop-color="#2b2f6b"/>
  </linearGradient>
  <linearGradient id="glassR" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#c86bd8"/><stop offset="1" stop-color="#5d2f66"/>
  </linearGradient>
  <linearGradient id="alu" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#6f6b69"/><stop offset=".35" stop-color="#d6d2cf"/>
    <stop offset=".62" stop-color="#8e8a88"/><stop offset="1" stop-color="#5d5957"/>
  </linearGradient>
  <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="9"/>
  </filter>
</defs>
<g filter="url(#glow)" opacity=".5">{slab(BOARD_W + 6, BOARD_D + 6, Z_ACRYLIC, 12, "url(#glass)", "url(#glass)", "url(#glass)")}</g>
{''.join(parts)}
</svg>
'''

import sys
open(sys.argv[1], 'w', encoding='utf-8').write(svg)
print('wrote', sys.argv[1], f'{len(svg)/1024:.1f} KB')
