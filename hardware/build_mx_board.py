#!/usr/bin/env python3
"""
Taptile Mini MX — the shipping design.

9 MX switches (3-pin, direct solder), 2 encoders, 15 addressable LEDs,
Adafruit KB2040 module. Two layers. Built entirely in the sandbox.

WHY THIS REPLACED THE HALL EFFECT BOARD

    Costed against the real board files: at prototype scale a module board is
    NZ$41 against NZ$80 for the bare RP2040, because the bare chip carries
    ~NZ$35/unit of one-off JLCPCB fees and forces 4 layers plus mandatory
    machine assembly. At 100 units the two are within 1% of each other. The
    bare chip only wins well past that.

    Dropping the QFN-56 is what makes this a two-layer board. A 0.4mm-pitch
    QFN cannot be escaped with manufacturable trace widths on two layers --
    that is what forced 4 layers last time. A 2.54mm header has no such problem.

    Removing the magnetic switches also deletes the analog mux, all nine Hall
    sensors and the whole ADC path. Nine keys go straight to nine GPIO, and the
    firmware goes back to plain QMK with VIA_ENABLE -- no custom protocol.

SWITCHES
    3-pin plate-mount, direct soldered. No Kailh sockets by choice. The
    footprint is the PCB (5-pin) variant deliberately: a 3-pin switch drops
    straight into it leaving two alignment holes empty, but it also accepts
    5-pin switches if a later batch is easier to source that way.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_board as mx                       # noqa: E402

CX = mx.CX
COL, ROW = mx.COL, mx.ROW

# ---------------------------------------------------------- KB2040 pinout ---
# Verified against Adafruit's published pinout. Pin 1 at the USB end.
LEFT = ["GP0", "GP1", "GND", "GND", "GP2", "GP3", "GP4", "GP5",
        "GP6", "GP7", "GP8", "GP9"]
# GP28/GP29 are broken out but unused -- left as None so they get no net
# rather than a one-pad net that looks like a wiring mistake.
RIGHT = ["+5V", "GND", "RESET", "+3V3", None, None, "GP27", "GP26",
         "GP18", "GP20", "GP19", "GP10"]

KEY_NETS = [f"GP{i}" for i in range(9)]          # SW1..SW9
ENC = {"ENC1": ("GP9", "GP10", "GP18"),          # A, B, push
       "ENC2": ("GP19", "GP20", "GP26")}
LED_GPIO = "GP27"

# 16 of the KB2040's 18 broken-out GPIO used. GP28 and GP29 spare.


def led_pads(i, total=15):
    return {"1": "+5V", "3": "GND",
            "4": "LED_DIN" if i == 1 else f"LED_{i - 1}_{i}",
            **({"2": f"LED_{i}_{i + 1}"} if i < total else {})}


PARTS = {
    # KB2040 socket: two 1x12 female headers, 17.78mm apart (Pro Micro pitch).
    "J1": ("Connector_PinHeader_2.54mm", "PinHeader_1x12_P2.54mm_Vertical",
           CX - 8.89, 52.0, {str(i): n for i, n in enumerate(LEFT, 1)}),
    "J2": ("Connector_PinHeader_2.54mm", "PinHeader_1x12_P2.54mm_Vertical",
           CX + 8.89, 52.0,
           {str(i): n for i, n in enumerate(RIGHT, 1) if n}),
    # 74AHCT1G125: shifts the LED data line from 3.3V to 5V.
    "U5": ("Package_TO_SOT_SMD", "SOT-23-5", 78.0, 45.0,
           {"1": "GND", "2": LED_GPIO, "3": "GND", "4": "LED_DIN_R",
            "5": "+5V"}),
    # RESET, because the module's own button ends up buried in the case.
    # BOOT is not broken out on a KB2040 -- use QMK's QK_BOOT keycode instead.
    "SW10": ("Button_Switch_SMD", "SW_SPST_TL3342", 122.0, 45.0,
             {"1": "RESET", "2": "GND"}),
}

# This 2020-era MX footprint puts its ORIGIN ON PAD 1, not on the switch
# centre: the centre stem hole is at (-2.54, 5.08) and the courtyard runs
# -9.14..4.06 by -1.52..11.68. Placing at the grid coordinate directly would
# sit every key 2.54mm left and 5.08mm low -- a whole key grid visibly
# off-centre in the case. Offset the placement so the BODY lands on grid.
SW_ORIGIN_OFF = (2.54, -5.08)

KEY_XY = []                      # true switch centres, i.e. the visible grid
for _n in range(1, 10):
    _r, _c = divmod(_n - 1, 3)
    KEY_XY.append((COL[_c], ROW[_r]))
    PARTS[f"SW{_n}"] = ("Button_Switch_Keyboard", "SW_Cherry_MX_1.00u_PCB",
                        COL[_c] + SW_ORIGIN_OFF[0], ROW[_r] + SW_ORIGIN_OFF[1],
                        {"1": KEY_NETS[_n - 1], "2": "GND"})

LED_XY = [(x, y + 9.5) for x, y in KEY_XY] + [
    (68.8, 92.0), (68.8, 112.0), (68.8, 132.0),
    (130.8, 92.0), (130.8, 112.0), (130.8, 132.0),
]
for _i, (_lx, _ly) in enumerate(LED_XY, start=1):
    PARTS[f"D{_i}"] = ("LED_SMD", "LED_SK6812MINI_PLCC4_3.5x3.5mm_P1.75mm",
                       _lx, _ly, led_pads(_i))

for _i, _ref in enumerate(("ENC1", "ENC2")):
    _a, _b, _sw = ENC[_ref]
    PARTS[_ref] = ("Rotary_Encoder",
                   "RotaryEncoder_Alps_EC11E-Switch_Vertical_H20mm",
                   [77.75, 107.75][_i], 147.0,
                   {"A": _a, "B": _b, "C": "GND", "S1": _sw, "S2": "GND"})

for _i, (_hx, _hy) in enumerate(
        [(71.0, 46.0), (129.0, 46.0), (71.0, 154.0), (129.0, 154.0)], start=1):
    PARTS[f"H{_i}"] = ("MountingHole", "MountingHole_3.2mm_M3", _hx, _hy, {})

DISC = [
    ("C20", "470uF", "C_0805", "+5V", "GND", 86.0, 45.0),   # LED bulk
    ("C21", "100nF", "C_0402", "+5V", "GND", 91.0, 45.0),   # shifter decoupling
    ("C22", "100nF", "C_0402", "+3V3", "GND", 112.0, 45.0),
    ("R8", "470R", "R_0402", "LED_DIN_R", "LED_DIN", 73.0, 45.0),
    ("R7", "10K", "R_0402", "+3V3", "RESET", 115.0, 45.0),
]
_FP = {"C_0402": ("Capacitor_SMD", "C_0402_1005Metric"),
       "C_0805": ("Capacitor_SMD", "C_0805_2012Metric"),
       "R_0402": ("Resistor_SMD", "R_0402_1005Metric")}
for _r, _v, _f, _a, _b, _x, _y in DISC:
    _lib, _nm = _FP[_f]
    PARTS[_r] = (_lib, _nm, _x, _y, {"1": _a, "2": _b})
VALUES = {r: v for r, v, *_ in DISC}


def main(dst):
    mx.PARTS = PARTS
    mx.NETS = mx.collect_nets()
    mods, hooked = [], 0
    for ref, (lib, name, x, y, pads) in PARTS.items():
        text, n = mx.build_module(ref, lib, name, x, y, pads,
                                  VALUES.get(ref, name))
        mods.append(text)
        hooked += n

    nets_block = '  (net 0 "")\n' + "".join(
        f'  (net {i} "{n}")\n'
        for n, i in sorted(mx.NETS.items(), key=lambda kv: kv[1]))
    netclass = ('  (net_class Default "" (clearance 0.2) (trace_width 0.25)\n'
                '    (via_dia 0.8) (via_drill 0.4)\n'
                '    (uvia_dia 0.3) (uvia_drill 0.1)\n'
                + "".join(f'    (add_net "{n}")\n' for n in sorted(mx.NETS))
                + '  )\n')

    silk = []
    for kx, ky in KEY_XY:
        h = 14.0 / 2
        for a, b, c, d in ((-h, -h, h, -h), (h, -h, h, h),
                           (h, h, -h, h), (-h, h, -h, -h)):
            silk.append(f'  (gr_line (start {kx + a:g} {ky + b:g}) '
                        f'(end {kx + c:g} {ky + d:g}) (layer F.SilkS) '
                        f'(width 0.12))\n')

    board = ('(kicad_pcb (version 20171130) (host pcbnew "5.1.12")\n'
             '  (general (thickness 1.6))\n  (page A4)\n'
             + mx.LAYERS + '  (setup (pad_to_mask_clearance 0))\n'
             + nets_block + netclass
             + "\n".join("  " + m.replace("\n", "\n  ") for m in mods) + "\n"
             + "".join(silk) + mx.outline() + ")\n")
    open(dst, "w", encoding="utf-8").write(board)

    print(f"wrote {dst}  ({len(board):,} bytes)\n")
    print(f"  components : {len(PARTS)}   nets: {len(mx.NETS)}   "
          f"pads netted: {hooked}")
    used = set(KEY_NETS) | {n for v in ENC.values() for n in v} | {LED_GPIO}
    print(f"  GPIO used  : {len(used)} of 18 broken out "
          f"(spare: GP28, GP29)")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "Taptile_MX.kicad_pcb")
