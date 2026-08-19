#!/usr/bin/env python3
"""
Build the complete Taptile RP2040 PCB from real KiCad library footprints,
with every pad assigned to its net. Runs entirely in the sandbox -- no KiCad
installation, no GUI, nothing on the laptop.

WHY THE FILE FORMAT LOOKS OLD
    The only reachable copy of the KiCad footprint library is the GitHub mirror,
    frozen in 2020, which uses the legacy `(module ...)` syntax. Rather than
    convert 14 footprints construct-by-construct -- fiddly, and a single missed
    difference produces a file KiCad refuses to open -- this emits the whole
    board in the same legacy format so library footprints paste in verbatim.

    KiCad 10 opens legacy boards without complaint and upgrades them on save.
    Pad geometry for these parts (0402, SOIC-8, SOT-23-5, MX, EC11) has not
    changed since 2020, so nothing is lost.

WHAT "CONNECTED" MEANS HERE
    Every pad carries a (net N "NAME") entry. That is the same thing KiCad's
    "Update PCB from Schematic" produces -- the ratsnest, DRC and the Gerber
    netlist all read exactly this. It is derived from the same net tables the
    schematic generator uses, so the two cannot drift apart.

NOT DONE
    Copper routing. Nets are assigned; the traces between them are not drawn.
    Autorouting a mixed-signal board with a USB pair is a bad idea, and the
    placement rules in RP2040_LAYOUT_RULES.md have to be honoured by hand.
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_rp2040_schematic import (          # noqa: E402
    RP2040_NETS, FLASH_PINS, LDO_PINS, USB_PINS, DISCRETES,
    KEY_NETS, ENCODERS,
)

LIB = "/tmp/kfp"

BOARD = dict(x0=65.0, x1=135.0, y0=40.0, y1=160.0, r=3.0)
CX = 100.0
KEY_PITCH = 19.05
COL = [CX - KEY_PITCH, CX, CX + KEY_PITCH]
ROW = [84.0, 103.05, 122.1]

# ---------------------------------------------------------------- parts -----
# ref -> (library, footprint, x, y, {pad: net})

def rp2040_nets():
    d = {str(p): RP2040_NETS[p] for p in range(1, 57) if RP2040_NETS[p]}
    d["57"] = "GND"          # exposed thermal pad is the ground connection
    return d


PARTS = {
    "U1": ("Package_DFN_QFN", "QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm",
           CX, 64.0, rp2040_nets()),
    "U2": ("Package_SO", "SOIC-8_5.23x5.23mm_P1.27mm", CX, 53.5,
           {str(p): FLASH_PINS[p][1] for p in FLASH_PINS}),
    "U3": ("Package_TO_SOT_SMD", "SOT-23-5", 72.0, 55.0,
           {str(p): LDO_PINS[p][1] for p in LDO_PINS if LDO_PINS[p][1]}),
    # The XKB footprint's origin is 4.75 mm above its top edge; at y=45 the
    # connector body finishes flush with the board edge instead of hanging off.
    "J1": ("Connector_USB", "USB_C_Receptacle_XKB_U262-16XN-4BVC11",
           CX, 45.0,
           {**{k: v[1] for k, v in USB_PINS.items() if v[1]}, "S1": "GND"}),
    # 4-pin SMD crystal: 1 = XI, 3 = XO, 2 and 4 are the metal can -> GND.
    "Y1": ("Crystal", "Crystal_SMD_3225-4Pin_3.2x2.5mm", 99.6, 73.5,
           {"1": "XIN", "2": "GND", "3": "XOUT_R", "4": "GND"}),
    "J2": ("Connector_PinHeader_2.54mm", "PinHeader_1x03_P2.54mm_Vertical",
           122.0, 52.0, {"1": "SWCLK", "2": "SWDIO", "3": "GND"}),
    "SW10": ("Button_Switch_SMD", "SW_SPST_TL3342", 78.0, 137.5,
             {"1": "BOOT_BTN", "2": "GND"}),
    "SW11": ("Button_Switch_SMD", "SW_SPST_TL3342", 122.0, 137.5,
             {"1": "RUN", "2": "GND"}),
}

# 9 keys
for _n in range(1, 10):
    _r, _c = divmod(_n - 1, 3)
    PARTS[f"SW{_n}"] = ("Button_Switch_Keyboard", "SW_Cherry_MX_1.00u_PCB",
                        COL[_c], ROW[_r],
                        {"1": KEY_NETS[_n - 1], "2": "GND"})

# 2 encoders
for _i, (_ref, (_a, _b, _sw)) in enumerate(ENCODERS.items()):
    PARTS[_ref] = ("Rotary_Encoder",
                   "RotaryEncoder_Alps_EC11E-Switch_Vertical_H20mm",
                   [77.75, 107.75][_i], 147.0,
                   {"A": _a, "B": _b, "C": "GND", "S1": _sw, "S2": "GND"})

# 4 mounting holes
for _i, (_hx, _hy) in enumerate(
        [(71.0, 46.0), (129.0, 46.0), (71.0, 154.0), (129.0, 154.0)], start=1):
    PARTS[f"H{_i}"] = ("MountingHole", "MountingHole_3.2mm_M3", _hx, _hy, {})

# discretes -- position table lives here, values/nets come from the schematic
DISCRETE_POS = {
    # Decoupling, ringed tight around U1 at (100, 64). Each one names the
    # RP2040 pin it serves in build_board's DISCRETES table.
    "C6": (97.0, 58.0), "C8": (99.5, 58.0), "C9": (102.0, 58.0),
    "C10": (104.5, 58.0),
    "C1": (93.0, 61.0), "C2": (93.0, 64.0),
    "C5": (107.0, 61.0), "C4": (107.0, 64.0),
    "C3": (95.0, 70.0), "C7": (99.0, 70.0), "C11": (103.0, 70.0),
    # Power section, left edge
    "C13": (72.0, 50.0), "C14": (72.0, 60.0), "C12": (79.0, 62.0),
    # Flash decoupling
    "C15": (91.0, 53.5),
    # Crystal load caps, flanking Y1 at (99.6, 73.5)
    "C16": (95.0, 73.5), "C17": (104.5, 73.5), "R5": (107.0, 68.0),
    # USB
    "R1": (110.0, 55.5), "R2": (110.0, 57.5),
    "R3": (90.0, 51.0), "R4": (110.0, 51.0),
    # Buttons
    "R6": (86.0, 137.5), "R7": (114.0, 137.5), "C18": (108.0, 137.5),
}

_FPMAP = {"C_0402": ("Capacitor_SMD", "C_0402_1005Metric"),
          "C_0603": ("Capacitor_SMD", "C_0603_1608Metric"),
          "C_0805": ("Capacitor_SMD", "C_0805_2012Metric"),
          "R_0402": ("Resistor_SMD", "R_0402_1005Metric")}
for _ref, _val, _fp, _a, _b, *_ in DISCRETES:
    _lib, _name = _FPMAP[_fp]
    _x, _y = DISCRETE_POS[_ref]
    PARTS[_ref] = (_lib, _name, _x, _y, {"1": _a, "2": _b})


# ------------------------------------------------------------ net numbers ---
def collect_nets():
    names = set()
    for _lib, _fp, _x, _y, pads in PARTS.values():
        names.update(n for n in pads.values() if n)
    ordered = ["GND", "+3V3", "+5V", "+1V1"] + sorted(
        n for n in names if n not in ("GND", "+3V3", "+5V", "+1V1"))
    return {n: i + 1 for i, n in enumerate(ordered)}


NETS = collect_nets()


# ------------------------------------------------------------- footprints ---
def load_module(lib, name):
    path = os.path.join(LIB, lib + ".pretty", name + ".kicad_mod")
    if not os.path.exists(path):
        raise SystemExit(f"MISSING FOOTPRINT: {lib}:{name}")
    return open(path, encoding="utf-8").read()


def iter_pads(text):
    """Yield (start, end, pad_name) for each (pad ...) block."""
    out, i = [], 0
    while True:
        i = text.find("(pad ", i)
        if i < 0:
            return out
        m = re.match(r'\(pad\s+("(?:[^"]*)"|\S+)\s', text[i:])
        raw = m.group(1) if m else ""
        name = raw.strip('"')
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


def build_module(ref, lib, name, x, y, padnets, value):
    text = load_module(lib, name)

    # (module NAME ...) -> (module LIB:NAME ...) and give it a position
    text = re.sub(r'^\(module\s+\S+', f'(module {lib}:{name}', text, count=1)
    head_end = text.index("\n")
    text = text[:head_end] + f"\n  (at {x:g} {y:g})" + text[head_end:]

    # reference designator and value
    text = re.sub(r'\(fp_text reference \S+', f'(fp_text reference {ref}',
                  text, count=1)
    text = re.sub(r'\(fp_text value \S+', f'(fp_text value {value}',
                  text, count=1)

    # attach nets, working backwards so offsets stay valid
    hooked = 0
    for start, end, pname in reversed(iter_pads(text)):
        net = padnets.get(pname)
        if not net:
            continue
        block = text[start:end]
        block = block[:-1].rstrip() + f' (net {NETS[net]} "{net}"))'
        text = text[:start] + block + text[end:]
        hooked += 1
    return text, hooked


# ----------------------------------------------------------------- board ----
LAYERS = """  (layers
    (0 F.Cu signal)
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


def outline():
    x0, x1 = BOARD["x0"], BOARD["x1"]
    y0, y1 = BOARD["y0"], BOARD["y1"]
    r = BOARD["r"]
    o = []
    for a, b in (((x0 + r, y0), (x1 - r, y0)), ((x1, y0 + r), (x1, y1 - r)),
                 ((x1 - r, y1), (x0 + r, y1)), ((x0, y1 - r), (x0, y0 + r))):
        o.append(f'  (gr_line (start {a[0]:g} {a[1]:g}) '
                 f'(end {b[0]:g} {b[1]:g}) (layer Edge.Cuts) (width 0.05))\n')
    for cx, cy, sx, sy in ((x0 + r, y0 + r, x0, y0 + r),
                           (x1 - r, y0 + r, x0 + r, y0),
                           (x1 - r, y1 - r, x1, y0 + r),
                           (x0 + r, y1 - r, x0 + r, y1)):
        pass
    # four 90-degree corner arcs, drawn centre + start + angle
    for cx, cy, sx, sy in ((x0 + r, y0 + r, x0, y0 + r),
                           (x1 - r, y0 + r, x1 - r, y0),
                           (x1 - r, y1 - r, x1, y1 - r),
                           (x0 + r, y1 - r, x0 + r, y1)):
        o.append(f'  (gr_arc (start {cx:g} {cy:g}) (end {sx:g} {sy:g}) '
                 f'(angle 90) (layer Edge.Cuts) (width 0.05))\n')
    return "".join(o)


def main(dst):
    mods, total_pads = [], 0
    for ref, (lib, name, x, y, padnets) in PARTS.items():
        value = next((d[1] for d in DISCRETES if d[0] == ref), name)
        text, hooked = build_module(ref, lib, name, x, y, padnets, value)
        mods.append(text)
        total_pads += hooked

    nets_block = '  (net 0 "")\n' + "".join(
        f'  (net {i} "{n}")\n' for n, i in sorted(NETS.items(), key=lambda kv: kv[1]))
    netclass = ('  (net_class Default "" (clearance 0.2) (trace_width 0.25)\n'
                '    (via_dia 0.8) (via_drill 0.4)\n'
                '    (uvia_dia 0.3) (uvia_drill 0.1)\n'
                + "".join(f'    (add_net "{n}")\n' for n in sorted(NETS)) +
                '  )\n')

    board = (
        '(kicad_pcb (version 20171130) (host pcbnew "5.1.12")\n'
        '  (general (thickness 1.6))\n'
        '  (page A4)\n'
        + LAYERS +
        '  (setup (pad_to_mask_clearance 0))\n'
        + nets_block + netclass
        + "\n".join("  " + m.replace("\n", "\n  ") for m in mods) + "\n"
        + outline() + ")\n"
    )
    open(dst, "w", encoding="utf-8").write(board)

    print(f"wrote {dst}  ({len(board):,} bytes)\n")
    print(f"  components : {len(PARTS)}")
    print(f"  nets       : {len(NETS)}")
    print(f"  pads netted: {total_pads}")

    missing = [r for r, (_l, _f, _x, _y, p) in PARTS.items()
               if p and not any(p.values())]
    print(f"  unconnected components: {missing or 'none'}")

    outside = [r for r, (_l, _f, x, y, _p) in PARTS.items()
               if not (BOARD["x0"] < x < BOARD["x1"]
                       and BOARD["y0"] < y < BOARD["y1"])]
    print(f"  outside outline       : {outside or 'none'}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "Taptile_RP2040.kicad_pcb")
