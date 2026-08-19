#!/usr/bin/env python3
"""
Position every component on the finished Taptile RP2040 board.

RUN THIS AFTER "Update PCB from Schematic" (F8), not before.

F8 is what actually connects the board: KiCad pulls each footprint from your
real installed libraries -- correct pads, correct 3D models -- and assigns every
pad to the net its schematic symbol sits on. It also swaps the placeholder
potentiometers for real EC11 encoder footprints, because the schematic asks for
EC11s. None of that can be faked by editing the file from outside.

What F8 does NOT do is arrange anything. It dumps all 44 parts in a heap off
the side of the board. This script moves them onto the layout below.

    usage:  python3 place_final.py "Taptile RP2040.kicad_pcb"

It edits in place after writing a .bak, and reports anything it could not find
or that lands outside the board outline.
"""

import re
import shutil
import sys

BOARD_X0, BOARD_X1 = 65.0, 135.0
BOARD_Y0, BOARD_Y1 = 40.0, 160.0
CX = 100.0

KEY_PITCH = 19.05
COL = [CX - KEY_PITCH, CX, CX + KEY_PITCH]        # 80.95 / 100 / 119.05
ROW = [84.0, 103.05, 122.1]

# ---------------------------------------------------------------- layout ----
# The board reads as four horizontal bands:
#
#   Y 40-47    USB-C at the top edge, CC resistors beside it
#   Y 48-73    all the electronics, in the gap above the key grid
#   Y 74-132   the 3x3 key grid on a true 19.05 mm pitch
#   Y 133-157  BOOT/RESET, then the two encoders at the bottom edge
#
# Decoupling capacitors are placed against the specific RP2040 pin each one
# serves -- see RP2040_LAYOUT_RULES.md. That proximity is not cosmetic; a
# decoupling cap 15 mm from its pin is an antenna, not a decoupling cap.

PLACE = {
    # --- band 1: USB ----------------------------------------------------
    "J1":  (CX, 42.5, 0),          # USB-C, top edge
    "R3":  (92.0, 48.0, 0),        # CC1 pull-down 5k1
    "R4":  (108.0, 48.0, 0),       # CC2 pull-down 5k1

    # --- band 2: power ---------------------------------------------------
    "U3":  (72.0, 55.0, 0),        # AP2112K 3.3V LDO
    "C13": (72.0, 50.0, 0),        # LDO input 1uF
    "C14": (72.0, 60.0, 0),        # LDO output 1uF
    "C12": (79.0, 60.0, 0),        # 3V3 bulk 10uF

    # --- band 2: flash + SWD ---------------------------------------------
    "U2":  (CX, 51.5, 0),          # W25Q128, hard against U1's QSPI edge
    "C15": (91.0, 51.5, 0),        # flash VCC decoupling
    "J2":  (122.0, 52.0, 0),       # SWD header

    # --- band 2: RP2040 and its decoupling -------------------------------
    # U1 sits at (100, 62). QFN-56 7x7: pins 1-14 left, 15-28 bottom,
    # 29-42 right, 43-56 top. Each cap below names the pin it serves.
    "U1":  (CX, 62.0, 0),
    "C1":  (93.0, 58.5, 90),       # IOVDD pin 1
    "C2":  (93.0, 62.0, 90),       # IOVDD pin 10
    "C3":  (95.0, 66.5, 0),        # IOVDD pin 22
    "C4":  (107.0, 65.0, 90),      # IOVDD pin 33
    "C5":  (107.0, 61.0, 90),      # IOVDD pin 42
    "C6":  (97.0, 56.5, 0),        # IOVDD pin 49
    "C7":  (99.0, 66.5, 0),        # DVDD pin 23
    "C8":  (100.5, 56.5, 0),       # DVDD pin 50
    "C9":  (103.0, 56.5, 0),       # USB_VDD pin 48
    "C10": (105.5, 56.5, 0),       # ADC_AVDD pin 43
    "C11": (107.0, 57.5, 90),      # VREG_VOUT 1uF
    "R1":  (104.0, 54.5, 0),       # USB D+ 27R series
    "R2":  (106.5, 54.5, 0),       # USB D- 27R series

    # --- band 2: crystal, against pins 20/21 -----------------------------
    "Y1":  (99.6, 70.5, 0),
    "C16": (95.5, 70.5, 0),        # load cap, XIN
    "C17": (104.0, 70.5, 0),       # load cap, XOUT
    "R5":  (103.0, 67.0, 0),       # 1k crystal series

    # --- band 3: the 3x3 key grid ----------------------------------------
    **{f"SW{r * 3 + c + 1}": (COL[c], ROW[r], 0)
       for r in range(3) for c in range(3)},

    # --- band 4: buttons and encoders ------------------------------------
    "SW10": (78.0, 135.0, 0),      # BOOT
    "R6":   (84.0, 135.0, 0),      # BOOT 1k series
    "SW11": (122.0, 135.0, 0),     # RESET
    "R7":   (116.0, 135.0, 0),     # RUN 10k pull-up
    "C18":  (116.0, 138.5, 0),     # RUN debounce
    "ENC1": (85.0, 147.0, 0),
    "ENC2": (115.0, 147.0, 0),

    # --- mounting holes ---------------------------------------------------
    "H1": (71.0, 46.0, 0),
    "H2": (129.0, 46.0, 0),
    "H3": (71.0, 154.0, 0),
    "H4": (129.0, 154.0, 0),
}


def find_footprints(text):
    """Yield (start, end, reference) for each top-level footprint block."""
    out, i = [], 0
    while True:
        i = text.find("(footprint ", i)
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
        block = text[i:j + 1]
        m = re.search(r'\(property "Reference" "([^"]*)"', block)
        out.append((i, j + 1, m.group(1) if m else "?"))
        i = j + 1


def set_position(block, x, y, rot):
    """Replace the footprint's own (at ...), which is the first one at depth 2."""
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


def main(path):
    shutil.copy(path, path + ".bak")
    text = open(path, encoding="utf-8").read()

    found, edits = {}, []
    for start, end, ref in find_footprints(text):
        if ref in PLACE:
            x, y, rot = PLACE[ref]
            edits.append((start, end, set_position(text[start:end], x, y, rot)))
            found[ref] = (x, y)

    for start, end, repl in sorted(edits, key=lambda e: -e[0]):
        text = text[:start] + repl + text[end:]
    open(path, "w", encoding="utf-8").write(text)

    nets = len(set(re.findall(r'\(net \d+ "([^"]*)"', text)))
    print(f"placed {len(found)} of {len(PLACE)} components")
    print(f"nets on the board: {nets}"
          + ("   <-- run F8 first, the board has no nets yet" if nets < 5 else ""))

    missing = sorted(set(PLACE) - set(found))
    if missing:
        print(f"\nNOT FOUND (run F8 to add them): {', '.join(missing)}")

    outside = [r for r, (x, y) in found.items()
               if not (BOARD_X0 + 1 < x < BOARD_X1 - 1
                       and BOARD_Y0 + 1 < y < BOARD_Y1 - 1)]
    print(f"outside the outline: {outside if outside else 'none'}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "Taptile RP2040.kicad_pcb")
