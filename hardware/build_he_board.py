#!/usr/bin/env python3
"""
Taptile Mini HE — Hall effect build.

9 magnetic switches, 2 encoders, 15 addressable LEDs, bare RP2040.
Built entirely in the sandbox from real KiCad library footprints.

HOW THIS DIFFERS FROM THE MX BOARD
    A magnetic switch has no electrical contacts. It is a magnet in a housing.
    All the sensing happens on the PCB: a linear Hall sensor sits directly
    under each key and reports the magnet's distance as a voltage. So the nine
    two-pad switch footprints are gone, replaced by nine SOT-23 sensors.

    Consequences that follow from that, and which drove this design:

    * Hot-swap is free. Nothing is soldered to the switch, so it just clips
      into the plate. No Kailh sockets, no cost.
    * The board is plate-mount. There are no switch holes in the PCB at all --
      the sensor needs the middle of the key, which is exactly where an MX
      footprint puts its 4mm stem hole. The plate holds the switches.
    * The RP2040 has 4 ADC channels and we need 9 readings. A CD74HC4051
      8-channel analog mux covers keys 1-8 on ADC0; key 9 goes straight to
      ADC1. Cheaper and smaller than a 16-channel part.

LED CHAIN
    15x SK6812MINI: 9 under the keys, 6 around the edge for underglow.
    SK6812 is used rather than WS2812B because its data threshold tolerates
    3.3V logic better. A 74AHCT1G125 still shifts the line to 5V, because
    "usually works" is not a thing to ship.

    Power: 15 LEDs x 60mA worst case = 900mA, against 500mA from USB. Firmware
    MUST cap global brightness. At 30% that is ~270mA, which is comfortable.
    C20 (470uF) absorbs the switching transients.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_board as mx                      # noqa: E402  (reuse machinery)
from gen_rp2040_schematic import RP2040_PINS  # noqa: E402  (datasheet pinout)

LIB = mx.LIB
BOARD = mx.BOARD
CX = mx.CX
COL, ROW = mx.COL, mx.ROW

# ============================================================ RP2040 nets ====
GPIO = {
    2: "MUX_S0", 3: "MUX_S1", 4: "MUX_S2",
    6: "ENC1_A", 7: "ENC1_B", 8: "ENC1_SW",
    9: "ENC2_A", 10: "ENC2_B", 11: "ENC2_SW",
    16: "LED_DIN_3V3",
    26: "MUX_COM",        # ADC0 -- keys 1-8 through the mux
    27: "HALL9",          # ADC1 -- key 9 direct
}

RP = {}
for _p, _n in RP2040_PINS.items():
    if _n == "IOVDD":
        RP[_p] = "+3V3"
    elif _n == "DVDD":
        RP[_p] = "+1V1"
    elif _n == "TESTEN":
        RP[_p] = "GND"
    elif _n in ("ADC_AVDD", "VREG_VIN", "USB_VDD"):
        RP[_p] = "+3V3"
    elif _n == "VREG_VOUT":
        RP[_p] = "+1V1"
    elif _n.startswith("GPIO"):
        RP[_p] = GPIO.get(int(_n[4:]))          # None -> no-connect
    else:
        RP[_p] = _n
RP_PADS = {str(p): n for p, n in RP.items() if n}
RP_PADS["57"] = "GND"

# CD74HC4051 8-channel analog mux, SOIC-16. Standard 4051 pinout.
MUX_PADS = {
    "1": "HALL5", "2": "HALL7", "3": "MUX_COM", "4": "HALL8", "5": "HALL6",
    "6": "GND",            # E, active-low enable
    "7": "GND",            # VEE
    "8": "GND",            # VSS
    "9": "MUX_S2", "10": "MUX_S1", "11": "MUX_S0",
    "12": "HALL4", "13": "HALL1", "14": "HALL2", "15": "HALL3",
    "16": "+3V3",
}

# 74AHCT1G125 buffer, SOT-23-5: shifts the LED data line 3.3V -> 5V.
SHIFT_PADS = {"1": "GND", "2": "LED_DIN_3V3", "3": "GND",
              "4": "LED_DIN_R", "5": "+5V"}

# DRV5055A4 linear Hall sensor, SOT-23: 1 VCC, 2 GND, 3 VOUT.
def hall_pads(n):
    return {"1": "+3V3", "2": "GND", "3": f"HALL{n}"}


# SK6812MINI PLCC4: 1 VDD, 2 DOUT, 3 GND, 4 DIN.
def led_pads(i, total=15):
    return {"1": "+5V", "3": "GND",
            "4": "LED_DIN" if i == 1 else f"LED_{i - 1}_{i}",
            **({"2": f"LED_{i}_{i + 1}"} if i < total else {})}


# ================================================================ layout =====
PARTS = {
    "U1": ("Package_DFN_QFN", "QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm",
           CX, 64.0, RP_PADS),
    "U2": ("Package_SO", "SOIC-8_5.23x5.23mm_P1.27mm", CX, 53.5,
           {str(p): mx.FLASH_PINS[p][1] for p in mx.FLASH_PINS}),
    "U3": ("Package_TO_SOT_SMD", "SOT-23-5", 72.0, 55.0,
           {str(p): mx.LDO_PINS[p][1] for p in mx.LDO_PINS if mx.LDO_PINS[p][1]}),
    "U4": ("Package_SO", "SOIC-16_3.9x9.9mm_P1.27mm", 119.0, 69.0, MUX_PADS),
    "U5": ("Package_TO_SOT_SMD", "SOT-23-5", 81.0, 70.0, SHIFT_PADS),
    "J1": ("Connector_USB", "USB_C_Receptacle_XKB_U262-16XN-4BVC11", CX, 45.0,
           {**{k: v[1] for k, v in mx.USB_PINS.items() if v[1]}, "S1": "GND"}),
    "Y1": ("Crystal", "Crystal_SMD_3225-4Pin_3.2x2.5mm", 99.6, 73.5,
           {"1": "XIN", "2": "GND", "3": "XOUT_R", "4": "GND"}),
    "J2": ("Connector_PinHeader_2.54mm", "PinHeader_1x03_P2.54mm_Vertical",
           122.0, 46.0, {"1": "SWCLK", "2": "SWDIO", "3": "GND"}),
    "SW10": ("Button_Switch_SMD", "SW_SPST_TL3342", 78.0, 137.5,
             {"1": "BOOT_BTN", "2": "GND"}),
    "SW11": ("Button_Switch_SMD", "SW_SPST_TL3342", 122.0, 137.5,
             {"1": "RUN", "2": "GND"}),
}

# --- 9 Hall sensors, one dead centre under each key ---------------------
KEY_XY = []
for _n in range(1, 10):
    _r, _c = divmod(_n - 1, 3)
    KEY_XY.append((COL[_c], ROW[_r]))
    PARTS[f"HS{_n}"] = ("Package_TO_SOT_SMD", "SOT-23",
                        COL[_c], ROW[_r], hall_pads(_n))

# --- 15 LEDs: 9 under the keys, 6 around the edge ----------------------
LED_XY = [(x, y + 9.4) for x, y in KEY_XY] + [
    (69.0, 92.0), (69.0, 112.0), (69.0, 132.0),
    (131.0, 92.0), (131.0, 112.0), (131.0, 132.0),
]
for _i, (_lx, _ly) in enumerate(LED_XY, start=1):
    PARTS[f"D{_i}"] = ("LED_SMD", "LED_SK6812MINI_PLCC4_3.5x3.5mm_P1.75mm",
                       _lx, _ly, led_pads(_i))

# --- 2 encoders --------------------------------------------------------
for _i, _ref in enumerate(("ENC1", "ENC2")):
    PARTS[_ref] = ("Rotary_Encoder",
                   "RotaryEncoder_Alps_EC11E-Switch_Vertical_H20mm",
                   [77.75, 107.75][_i], 147.0,
                   {"A": f"{_ref}_A", "B": f"{_ref}_B", "C": "GND",
                    "S1": f"{_ref}_SW", "S2": "GND"})

# --- 4 mounting holes --------------------------------------------------
for _i, (_hx, _hy) in enumerate(
        [(71.0, 46.0), (129.0, 46.0), (71.0, 154.0), (129.0, 154.0)], start=1):
    PARTS[f"H{_i}"] = ("MountingHole", "MountingHole_3.2mm_M3", _hx, _hy, {})

# --- discretes ---------------------------------------------------------
# (ref, value, footprint key, net A, net B, x, y)
DISC = [
    ("C1", "100nF", "C_0402", "+3V3", "GND", 93.0, 61.0),
    ("C2", "100nF", "C_0402", "+3V3", "GND", 93.0, 64.0),
    ("C3", "100nF", "C_0402", "+3V3", "GND", 95.0, 70.0),
    ("C4", "100nF", "C_0402", "+3V3", "GND", 107.0, 64.0),
    ("C5", "100nF", "C_0402", "+3V3", "GND", 107.0, 61.0),
    ("C6", "100nF", "C_0402", "+3V3", "GND", 97.0, 58.0),
    ("C7", "100nF", "C_0402", "+1V1", "GND", 99.0, 70.0),
    ("C8", "100nF", "C_0402", "+1V1", "GND", 99.5, 58.0),
    ("C9", "100nF", "C_0402", "+3V3", "GND", 102.0, 58.0),
    ("C10", "100nF", "C_0402", "+3V3", "GND", 104.5, 58.0),
    ("C11", "1uF", "C_0603", "+1V1", "GND", 103.0, 70.0),
    ("C12", "10uF", "C_0805", "+3V3", "GND", 79.0, 62.0),
    ("C13", "1uF", "C_0603", "+5V", "GND", 72.0, 50.0),
    ("C14", "1uF", "C_0603", "+3V3", "GND", 72.0, 60.0),
    ("C15", "100nF", "C_0402", "+3V3", "GND", 91.0, 53.5),
    ("C16", "15pF", "C_0402", "XIN", "GND", 95.0, 73.5),
    ("C17", "15pF", "C_0402", "XOUT_R", "GND", 104.5, 73.5),
    ("C18", "100nF", "C_0402", "RUN", "GND", 108.0, 137.5),
    ("C19", "100nF", "C_0402", "+3V3", "GND", 113.0, 69.0),   # mux decoupling
    ("C20", "470uF", "C_0805", "+5V", "GND", 86.0, 50.0),     # LED bulk
    ("C21", "100nF", "C_0402", "+5V", "GND", 86.0, 70.0),     # shifter
    ("R1", "27R", "R_0402", "USB_DP", "USB_DP_C", 110.0, 55.5),
    ("R2", "27R", "R_0402", "USB_DM", "USB_DM_C", 110.0, 57.5),
    ("R3", "5K1", "R_0402", "CC1", "GND", 90.0, 51.0),
    ("R4", "5K1", "R_0402", "CC2", "GND", 110.0, 51.0),
    ("R5", "1K", "R_0402", "XOUT", "XOUT_R", 107.0, 68.0),
    ("R6", "1K", "R_0402", "QSPI_SS_N", "BOOT_BTN", 86.0, 137.5),
    ("R7", "10K", "R_0402", "+3V3", "RUN", 114.0, 137.5),
    ("R8", "470R", "R_0402", "LED_DIN", "LED_DIN_R", 76.0, 70.0),
]
_FP = {"C_0402": ("Capacitor_SMD", "C_0402_1005Metric"),
       "C_0603": ("Capacitor_SMD", "C_0603_1608Metric"),
       "C_0805": ("Capacitor_SMD", "C_0805_2012Metric"),
       "R_0402": ("Resistor_SMD", "R_0402_1005Metric")}
for _r, _v, _f, _a, _b, _x, _y in DISC:
    _lib, _nm = _FP[_f]
    PARTS[_r] = (_lib, _nm, _x, _y, {"1": _a, "2": _b})

VALUES = {r: v for r, v, *_ in DISC}


# ================================================================= build =====
def main(dst):
    mx.PARTS = PARTS
    mx.NETS = mx.collect_nets()
    mods, hooked = [], 0
    for ref, (lib, name, x, y, pads) in PARTS.items():
        val = VALUES.get(ref, name)
        text, n = mx.build_module(ref, lib, name, x, y, pads, val)
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

    # Key outlines on silkscreen. The board is plate-mount and has no switch
    # holes, so without these there is nothing showing where the keys sit.
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
    print(f"  components  : {len(PARTS)}")
    print(f"  nets        : {len(mx.NETS)}")
    print(f"  pads netted : {hooked}")
    leds = sum(1 for r in PARTS if r.startswith("D"))
    print(f"  hall sensors: {sum(1 for r in PARTS if r.startswith('HS'))}")
    print(f"  LEDs        : {leds}  "
          f"({leds * 60}mA worst case, cap brightness in firmware)")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "Taptile_HE.kicad_pcb")
