#!/usr/bin/env python3
"""
Place the Taptile Mini footprints inside the existing board outline.

Reads the cofounder's TaptileMini_Base_PCB.kicad_pcb, which already contains
the rounded-rectangle Edge.Cuts outline and a pile of unpositioned footprints,
and writes a copy with everything moved onto a proper grid, named with real
reference designators, and with the two placeholder parts removed.

Board outline, read from the file rather than assumed:
    X 65 -> 135  (70 mm wide)
    Y 40 -> 160  (120 mm tall)
    3 mm corner radius, centre at (100, 100)

The 3D models already point at ${KICAD10_3DMODEL_DIR}, so 3D view resolves
against a stock KiCad 10 install with no extra setup. The outline is a closed
loop (4 lines + 4 arcs), which is what 3D view needs in order to extrude a
board at all -- an open outline renders nothing, and that is the usual reason
3D view comes up empty.
"""

import re
import sys

# ------------------------------------------------------------ board geometry --
BOARD_X0, BOARD_X1 = 65.0, 135.0
BOARD_Y0, BOARD_Y1 = 40.0, 160.0
CX = (BOARD_X0 + BOARD_X1) / 2      # 100.0

KEY_PITCH = 19.05                   # standard MX centre-to-centre
KEY_ROW_Y = [84.0, 103.05, 122.1]
KEY_COL_X = [CX - KEY_PITCH, CX, CX + KEY_PITCH]   # 80.95, 100, 119.05

# (reference, x, y, rotation) in the order each type appears in the file.
PLACEMENT = {
    "Button_Switch_Keyboard:SW_Cherry_MX_1.00u_PCB": [
        (f"SW{n}", KEY_COL_X[c], KEY_ROW_Y[r], 0)
        for n, (r, c) in enumerate(
            [(r, c) for r in range(3) for c in range(3)], start=1)
    ],
    "Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm": [
        ("U1", CX, 60.0, 0),
    ],
    "Connector_USB:USB_C_Receptacle_GCT_USB4105-xx-A_16P_TopMnt_Horizontal": [
        ("J1", CX, 43.0, 0),
    ],
    "Potentiometer_SMD:Potentiometer_ACP_CA14-VSMD_Vertical": [
        ("ENC1", 85.0, 145.0, 0),
        ("ENC2", 115.0, 145.0, 0),
    ],
    "MountingHole_7.6mm": [
        ("H1", 72.0, 47.0, 0),
        ("H2", 128.0, 47.0, 0),
        ("H3", 72.0, 153.0, 0),
        ("H4", 128.0, 153.0, 0),
    ],
}

# Placeholder parts with no role in this design. An 01005 is a 0.4 x 0.2 mm
# part -- smaller than a grain of sand, unplaceable by hand, and there is no
# diode or LED in the schematic anyway.
DELETE = {
    "Diode_SMD:D_01005_0402Metric",
    "LED_SMD:LED_01005_0402Metric",
}


def find_blocks(text, token="(footprint "):
    """Yield (start, end, name) for each top-level block starting with token."""
    out = []
    i = 0
    while True:
        i = text.find(token, i)
        if i < 0:
            break
        m = re.match(r'\(footprint\s+"([^"]+)"', text[i:])
        name = m.group(1) if m else "?"
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
        out.append((i, j + 1, name))
        i = j + 1
    return out


def set_position(block, x, y, rot):
    """Replace the footprint's own (at ...) -- the first one at depth 1."""
    depth, i, in_str, esc = 0, 0, False, False
    while i < len(block):
        ch = block[i]
        if esc:
            esc = False
        elif ch == "\\":
            esc = True
        elif ch == '"':
            in_str = not in_str
        elif not in_str:
            if ch == "(":
                depth += 1
                if depth == 2 and block.startswith("(at ", i):
                    j = block.index(")", i)
                    new = f"(at {x:g} {y:g}" + (f" {rot:g})" if rot else ")")
                    return block[:i] + new + block[j + 1:]
            elif ch == ")":
                depth -= 1
        i += 1
    return block


def set_reference(block, ref):
    return re.sub(r'\(property "Reference" "[^"]*"',
                  f'(property "Reference" "{ref}"', block, count=1)


def main(src, dst):
    text = open(src, encoding="utf-8").read()
    blocks = find_blocks(text)

    counters = {k: 0 for k in PLACEMENT}
    edits = []          # (start, end, replacement or None)
    placed, removed = [], []

    for start, end, name in blocks:
        if name in DELETE:
            edits.append((start, end, None))
            removed.append(name)
            continue
        if name not in PLACEMENT:
            continue
        idx = counters[name]
        if idx >= len(PLACEMENT[name]):
            continue
        ref, x, y, rot = PLACEMENT[name][idx]
        counters[name] += 1

        b = text[start:end]
        b = set_position(b, x, y, rot)
        b = set_reference(b, ref)
        edits.append((start, end, b))
        placed.append((ref, name.split(":")[-1], x, y))

    for start, end, repl in sorted(edits, key=lambda e: -e[0]):
        text = text[:start] + (repl or "") + text[end:]

    text = re.sub(r"\n{3,}", "\n\n", text)
    open(dst, "w", encoding="utf-8").write(text)

    print(f"wrote {dst}\n")
    print(f"board  {BOARD_X1 - BOARD_X0:g} x {BOARD_Y1 - BOARD_Y0:g} mm"
          f"   centre ({CX:g}, {(BOARD_Y0 + BOARD_Y1) / 2:g})\n")
    for ref, fp, x, y in placed:
        inside = (BOARD_X0 + 2 < x < BOARD_X1 - 2
                  and BOARD_Y0 + 2 < y < BOARD_Y1 - 2)
        print(f"  {ref:5s} {fp[:46]:46s} ({x:7.2f}, {y:6.2f})"
              f" {'ok' if inside else 'OUTSIDE OUTLINE'}")
    if removed:
        print(f"\nremoved {len(removed)} placeholder part(s): "
              f"{', '.join(sorted(set(removed)))}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
