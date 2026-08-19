#!/usr/bin/env python3
"""
Generate the complete Taptile Mini schematic as a KiCad .kicad_sch file.

Why generate it instead of drawing it: the schematic file is plain text
(s-expressions), so writing it directly is faster and far less error-prone
than placing 200-odd items by hand in the GUI.

Everything is wired by NET NAME using global labels rather than long wires
across the sheet. Two pins carrying the same label are the same net as far as
KiCad, ERC and the PCB netlist are concerned. This is standard practice on
keyboard schematics -- drawing 24 wires from a header to a key grid would be
unreadable.

Board contents (this really is all of it):
  9x  SW_Push          -- the keys, one GPIO each, other side to ground
  2x  Rotary encoder   -- A/B quadrature + push switch, common to ground
  2x  1x12 header      -- the Adafruit KB2040 socket

There is no RP2040, no flash, no crystal, no regulator, no USB connector and
no boot/reset buttons on this board, because all of those live on the KB2040
module that plugs into the two headers.

No diodes either: 9 keys wired one-per-GPIO is a direct-pin layout, not a
matrix, so there is nothing to ghost and nothing to block.
"""

import uuid
import os

# --------------------------------------------------------------- net map ----
# KB2040 (Pro Micro footprint), pin 1 at the USB end, going down each side.

LEFT = ["GP0", "GP1", "GND", "GND", "GP2", "GP3", "GP4", "GP5",
        "GP6", "GP7", "GP8", "GP9"]

RIGHT = ["RAW", "GND", "RESET", "+3V3", "GP29", "GP28", "GP27", "GP26",
         "GP18", "GP20", "GP19", "GP10"]

# Left on the module and not used by this design. Flagged no-connect so ERC
# stays quiet instead of warning about 6 dangling pins.
UNUSED = {"RAW", "RESET", "+3V3", "GP29", "GP28", "GP27"}

KEY_NETS = ["GP0", "GP1", "GP2", "GP3", "GP4", "GP5", "GP6", "GP7", "GP8"]

# ref -> (A phase, B phase, push switch)
ENCODERS = {
    "ENC1": ("GP9",  "GP10", "GP18"),
    "ENC2": ("GP19", "GP20", "GP26"),
}

FP_SWITCH  = "Button_Switch_Keyboard:SW_Cherry_MX_1.00u_PCB"
FP_ENCODER = "Rotary_Encoder:RotaryEncoder_Alps_EC11E-Switch_Vertical_H20mm"
FP_HEADER  = "Connector_PinHeader_2.54mm:PinHeader_1x12_P2.54mm_Vertical"

# ---------------------------------------------------------------- layout ----
# A3 sheet, 420 x 297 mm. Millimetres throughout, Y increases downward.

KEY_X = [40.0, 90.0, 140.0]
KEY_Y = [40.0, 65.0, 90.0]

ENC_POS = {"ENC1": (60.0, 140.0), "ENC2": (60.0, 180.0)}

J1_POS = (280.0, 150.0)   # left side of the module
J2_POS = (340.0, 150.0)   # right side

ROOT = str(uuid.uuid4())
PROJECT = "Taptile PCB"


def uid():
    return str(uuid.uuid4())


# ------------------------------------------------------- symbol libraries ---
# Defined inline so the file opens identically on any machine, with or without
# the stock KiCad libraries installed. Pin coordinates are the connection
# points -- that is what wires must land on.

LIB_SYMBOLS = r'''
	(symbol "Switch:SW_Push"
		(pin_numbers (hide yes))
		(pin_names (offset 1.016) (hide yes))
		(exclude_from_sim no) (in_bom yes) (on_board yes)
		(property "Reference" "SW" (at 0 5.08 0)
			(effects (font (size 1.27 1.27))))
		(property "Value" "SW_Push" (at 0 -5.08 0)
			(effects (font (size 1.27 1.27))))
		(property "Footprint" "" (at 0 0 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Datasheet" "~" (at 0 0 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(symbol "SW_Push_0_1"
			(circle (center -3.048 0) (radius 0.508)
				(stroke (width 0) (type default)) (fill (type none)))
			(circle (center 3.048 0) (radius 0.508)
				(stroke (width 0) (type default)) (fill (type none)))
			(polyline (pts (xy 0 1.27) (xy 0 3.048))
				(stroke (width 0) (type default)) (fill (type none)))
			(polyline (pts (xy -2.54 1.27) (xy 2.54 1.27))
				(stroke (width 0) (type default)) (fill (type none)))
		)
		(symbol "SW_Push_1_1"
			(pin passive line (at -7.62 0 0) (length 4.572)
				(name "1" (effects (font (size 1.27 1.27))))
				(number "1" (effects (font (size 1.27 1.27)))))
			(pin passive line (at 7.62 0 180) (length 4.572)
				(name "2" (effects (font (size 1.27 1.27))))
				(number "2" (effects (font (size 1.27 1.27)))))
		)
	)
	(symbol "Device:Rotary_Encoder_Switch"
		(pin_names (offset 0.254))
		(exclude_from_sim no) (in_bom yes) (on_board yes)
		(property "Reference" "ENC" (at 0 11.43 0)
			(effects (font (size 1.27 1.27))))
		(property "Value" "Rotary_Encoder_Switch" (at 0 -11.43 0)
			(effects (font (size 1.27 1.27))))
		(property "Footprint" "" (at 0 0 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Datasheet" "~" (at 0 0 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(symbol "Rotary_Encoder_Switch_0_1"
			(rectangle (start -5.08 8.89) (end 5.08 -8.89)
				(stroke (width 0.254) (type default))
				(fill (type background)))
			(polyline (pts (xy -2.54 3.81) (xy 2.54 3.81))
				(stroke (width 0.254) (type default)) (fill (type none)))
			(polyline (pts (xy -2.54 0) (xy 2.54 0))
				(stroke (width 0.254) (type default)) (fill (type none)))
			(polyline (pts (xy -2.54 -3.81) (xy 2.54 -3.81))
				(stroke (width 0.254) (type default)) (fill (type none)))
		)
		(symbol "Rotary_Encoder_Switch_1_1"
			(pin passive line (at -7.62 3.81 0) (length 2.54)
				(name "A" (effects (font (size 1.27 1.27))))
				(number "1" (effects (font (size 1.27 1.27)))))
			(pin passive line (at -7.62 -3.81 0) (length 2.54)
				(name "B" (effects (font (size 1.27 1.27))))
				(number "2" (effects (font (size 1.27 1.27)))))
			(pin passive line (at 7.62 0 180) (length 2.54)
				(name "C" (effects (font (size 1.27 1.27))))
				(number "3" (effects (font (size 1.27 1.27)))))
			(pin passive line (at 7.62 6.35 180) (length 2.54)
				(name "S1" (effects (font (size 1.27 1.27))))
				(number "4" (effects (font (size 1.27 1.27)))))
			(pin passive line (at 7.62 -6.35 180) (length 2.54)
				(name "S2" (effects (font (size 1.27 1.27))))
				(number "5" (effects (font (size 1.27 1.27)))))
		)
	)
	(symbol "power:GND"
		(power)
		(pin_numbers (hide yes))
		(pin_names (offset 0) (hide yes))
		(exclude_from_sim no) (in_bom yes) (on_board yes)
		(property "Reference" "#PWR" (at 0 -6.35 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Value" "GND" (at 0 -3.81 0)
			(effects (font (size 1.27 1.27))))
		(property "Footprint" "" (at 0 0 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Datasheet" "" (at 0 0 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(symbol "GND_0_1"
			(polyline (pts (xy 0 0) (xy 0 -1.27) (xy 1.27 -1.27)
				(xy 0 -2.54) (xy -1.27 -1.27) (xy 0 -1.27))
				(stroke (width 0) (type default)) (fill (type none)))
		)
		(symbol "GND_1_1"
			(pin power_in line (at 0 0 270) (length 0) (hide yes)
				(name "GND" (effects (font (size 1.27 1.27))))
				(number "1" (effects (font (size 1.27 1.27)))))
		)
	)
'''


def header_symbol(name, side):
    """A 1x12 header. side='left' puts the pins on the left of the body."""
    sign = -1 if side == "left" else 1
    angle = 0 if side == "left" else 180

    pins = []
    for i in range(1, 13):
        y = 13.97 - (i - 1) * 2.54
        label = (LEFT if side == "left" else RIGHT)[i - 1]
        pins.append(
            f'\t\t\t(pin passive line (at {sign * 7.62:g} {y:g} {angle}) '
            f'(length 2.54)\n'
            f'\t\t\t\t(name "{label}" (effects (font (size 1.27 1.27))))\n'
            f'\t\t\t\t(number "{i}" (effects (font (size 1.27 1.27)))))'
        )

    return f'''
	(symbol "{name}"
		(pin_names (offset 1.016))
		(exclude_from_sim no) (in_bom yes) (on_board yes)
		(property "Reference" "J" (at 0 18.0 0)
			(effects (font (size 1.27 1.27))))
		(property "Value" "KB2040_{side}" (at 0 -18.0 0)
			(effects (font (size 1.27 1.27))))
		(property "Footprint" "" (at 0 0 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Datasheet" "~" (at 0 0 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(symbol "{name.split(":")[1]}_0_1"
			(rectangle (start {-2.54 if side == "left" else -2.54:g} 15.24)
				(end {2.54:g} -15.24)
				(stroke (width 0.254) (type default))
				(fill (type background)))
		)
		(symbol "{name.split(":")[1]}_1_1"
{chr(10).join(pins)}
		)
	)
'''


# ------------------------------------------------------------- emitters -----

def sym(lib_id, ref, value, footprint, x, y, ref_dy=-8.0, val_dy=8.0):
    return f'''	(symbol
		(lib_id "{lib_id}")
		(at {x:g} {y:g} 0)
		(unit 1)
		(exclude_from_sim no) (in_bom yes) (on_board yes) (dnp no)
		(uuid "{uid()}")
		(property "Reference" "{ref}" (at {x:g} {y + ref_dy:g} 0)
			(effects (font (size 1.27 1.27))))
		(property "Value" "{value}" (at {x:g} {y + val_dy:g} 0)
			(effects (font (size 1.27 1.27))))
		(property "Footprint" "{footprint}" (at {x:g} {y:g} 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Datasheet" "~" (at {x:g} {y:g} 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(instances
			(project "{PROJECT}"
				(path "/{ROOT}" (reference "{ref}") (unit 1))))
	)
'''


def gnd(x, y):
    return f'''	(symbol
		(lib_id "power:GND")
		(at {x:g} {y:g} 0)
		(unit 1)
		(exclude_from_sim no) (in_bom yes) (on_board yes) (dnp no)
		(uuid "{uid()}")
		(property "Reference" "#PWR?" (at {x:g} {y + 6.35:g} 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Value" "GND" (at {x:g} {y + 3.81:g} 0)
			(effects (font (size 1.27 1.27))))
		(property "Footprint" "" (at {x:g} {y:g} 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Datasheet" "" (at {x:g} {y:g} 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(instances
			(project "{PROJECT}"
				(path "/{ROOT}" (reference "#PWR?") (unit 1))))
	)
'''


def wire(x1, y1, x2, y2):
    return (f'\t(wire (pts (xy {x1:g} {y1:g}) (xy {x2:g} {y2:g}))\n'
            f'\t\t(stroke (width 0) (type default)) (uuid "{uid()}"))\n')


def label(text, x, y, angle):
    just = "right" if angle == 180 else "left"
    return (f'\t(global_label "{text}" (shape passive) (at {x:g} {y:g} {angle})\n'
            f'\t\t(effects (font (size 1.27 1.27)) (justify {just}))\n'
            f'\t\t(uuid "{uid()}"))\n')


def nc(x, y):
    return f'\t(no_connect (at {x:g} {y:g}) (uuid "{uid()}"))\n'


# ---------------------------------------------------------------- build -----

def build():
    out = []

    # --- 9 keys: one GPIO each, other side to ground -----------------------
    n = 0
    for row, ky in enumerate(KEY_Y):
        for col, kx in enumerate(KEY_X):
            n += 1
            net = KEY_NETS[n - 1]
            out.append(sym("Switch:SW_Push", f"SW{n}", "SW_Push",
                           FP_SWITCH, kx, ky, ref_dy=-6.5, val_dy=6.5))
            # pin 1 -> net
            out.append(wire(kx - 7.62, ky, kx - 17.78, ky))
            out.append(label(net, kx - 17.78, ky, 180))
            # pin 2 -> ground
            out.append(wire(kx + 7.62, ky, kx + 15.24, ky))
            out.append(gnd(kx + 15.24, ky))

    # --- 2 encoders --------------------------------------------------------
    for ref, (net_a, net_b, net_sw) in ENCODERS.items():
        ex, ey = ENC_POS[ref]
        out.append(sym("Device:Rotary_Encoder_Switch", ref, "EC11",
                       FP_ENCODER, ex, ey, ref_dy=-12.0, val_dy=12.0))

        # A / B quadrature outputs
        out.append(wire(ex - 7.62, ey - 3.81, ex - 17.78, ey - 3.81))
        out.append(label(net_a, ex - 17.78, ey - 3.81, 180))
        out.append(wire(ex - 7.62, ey + 3.81, ex - 17.78, ey + 3.81))
        out.append(label(net_b, ex - 17.78, ey + 3.81, 180))

        # common -> ground
        out.append(wire(ex + 7.62, ey, ex + 15.24, ey))
        out.append(gnd(ex + 15.24, ey))

        # push switch: one side to a GPIO, the other to ground
        out.append(wire(ex + 7.62, ey - 6.35, ex + 25.4, ey - 6.35))
        out.append(label(net_sw, ex + 25.4, ey - 6.35, 0))
        out.append(wire(ex + 7.62, ey + 6.35, ex + 15.24, ey + 6.35))
        out.append(gnd(ex + 15.24, ey + 6.35))

    # --- KB2040 socket, left header ---------------------------------------
    jx, jy = J1_POS
    out.append(sym("Connector:KB2040_L", "J1", "KB2040_left",
                   FP_HEADER, jx, jy, ref_dy=-19.0, val_dy=19.0))
    for i, net in enumerate(LEFT, start=1):
        py = jy + 13.97 - (i - 1) * 2.54
        px = jx - 7.62
        if net == "GND":
            out.append(wire(px, py, px - 5.08, py))
            out.append(gnd(px - 5.08, py))
        elif net in UNUSED:
            out.append(nc(px, py))
        else:
            out.append(wire(px, py, px - 12.7, py))
            out.append(label(net, px - 12.7, py, 180))

    # --- KB2040 socket, right header --------------------------------------
    jx, jy = J2_POS
    out.append(sym("Connector:KB2040_R", "J2", "KB2040_right",
                   FP_HEADER, jx, jy, ref_dy=-19.0, val_dy=19.0))
    for i, net in enumerate(RIGHT, start=1):
        py = jy + 13.97 - (i - 1) * 2.54
        px = jx + 7.62
        if net == "GND":
            out.append(wire(px, py, px + 5.08, py))
            out.append(gnd(px + 5.08, py))
        elif net in UNUSED:
            out.append(nc(px, py))
        else:
            out.append(wire(px, py, px + 12.7, py))
            out.append(label(net, px + 12.7, py, 0))

    body = "".join(out)

    libs = (LIB_SYMBOLS
            + header_symbol("Connector:KB2040_L", "left")
            + header_symbol("Connector:KB2040_R", "right"))

    return f'''(kicad_sch
	(version 20231120)
	(generator "eeschema")
	(generator_version "8.0")
	(uuid "{ROOT}")
	(paper "A3")
	(title_block
		(title "Taptile Mini")
		(date "2026-08-15")
		(rev "A")
		(comment 1 "9 keys + 2 encoders, direct pin, KB2040 module")
	)
	(lib_symbols
{libs}	)
{body}	(sheet_instances
		(path "/" (page "1"))
	)
)
'''


if __name__ == "__main__":
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else "Taptile PCB.kicad_sch"
    text = build()
    with open(target, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"wrote {target}  ({len(text)} bytes)")
    print(f"  9 switches   -> {', '.join(KEY_NETS)}")
    for ref, nets in ENCODERS.items():
        print(f"  {ref}         -> A={nets[0]} B={nets[1]} SW={nets[2]}")
    print(f"  J1/J2        -> KB2040 socket, {len(UNUSED)} pins no-connect")
