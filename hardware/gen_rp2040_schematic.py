#!/usr/bin/env python3
"""
Taptile Mini — bare RP2040 schematic generator.

Produces a complete, fully connected KiCad schematic for a 9-key + 2-encoder
macropad built on a bare RP2040 rather than a plug-in module.

WHY THIS EXISTS
    The module version (gen_schematic.py) costs NZ$10-60 per board just for the
    controller. Putting the RP2040 on the board directly drops that to roughly
    USD$4 in parts, and every part here is SMD and in JLCPCB's own library, so
    their line can assemble it. That is how a competitive unit price becomes
    possible at all.

PIN NUMBERS
    Every RP2040 pin number below was taken from the official Raspberry Pi
    RP2040 product brief pinout diagram (RP-008372-DS-1, published Aug 2022),
    not from memory and not from a search summary. A web search consulted while
    writing this returned QSPI_SD0 on pin 49 and QSPI_SCLK on pin 50 -- both
    wrong; those pins are IOVDD and DVDD. Building from that would have shorted
    the flash bus onto the power rails.

    If you change anything here, re-check against the datasheet. A transposed
    pin number is invisible in the schematic and fatal in the assembled board.

HOW IT IS WIRED
    Every pin gets a short wire stub and a global label. Two pins carrying the
    same label are the same net. There are no long wires crossing the sheet.
    This means correctness is auditable by reading the net table rather than by
    tracing lines, and it means nothing can be "not connected" by accident --
    which is the failure mode that bit the first attempt at this board.

WHAT THIS FILE DOES NOT DO
    It does not lay out the PCB. On a bare-RP2040 design the layout matters as
    much as the schematic: USB D+/D- must be routed as a 90 ohm differential
    pair, the crystal must sit hard against pins 20/21 with a guarded ground,
    and every decoupling capacitor must be within a couple of millimetres of the
    pin it serves. Those rules are in hardware/RP2040_LAYOUT_RULES.md.
"""

import uuid

PROJECT = "Taptile RP2040"
ROOT = str(uuid.uuid4())


def uid():
    return str(uuid.uuid4())


# ============================================================== RP2040 pinout ==
# Verified against the RP2040 product brief pinout diagram, top view.
# Left edge 1-14, bottom edge 15-28, right edge 29-42, top edge 43-56.

RP2040_PINS = {
    1: "IOVDD",      2: "GPIO0",      3: "GPIO1",      4: "GPIO2",
    5: "GPIO3",      6: "GPIO4",      7: "GPIO5",      8: "GPIO6",
    9: "GPIO7",     10: "IOVDD",     11: "GPIO8",     12: "GPIO9",
    13: "GPIO10",   14: "GPIO11",    15: "GPIO12",    16: "GPIO13",
    17: "GPIO14",   18: "GPIO15",    19: "TESTEN",    20: "XIN",
    21: "XOUT",     22: "IOVDD",     23: "DVDD",      24: "SWDIO",
    25: "SWCLK",    26: "RUN",       27: "GPIO16",    28: "GPIO17",
    29: "GPIO18",   30: "GPIO19",    31: "GPIO20",    32: "GPIO21",
    33: "IOVDD",    34: "GPIO22",    35: "GPIO23",    36: "GPIO24",
    37: "GPIO25",   38: "GPIO26",    39: "GPIO27",    40: "GPIO28",
    41: "GPIO29",   42: "IOVDD",     43: "ADC_AVDD",  44: "VREG_VIN",
    45: "VREG_VOUT", 46: "USB_DM",   47: "USB_DP",    48: "USB_VDD",
    49: "IOVDD",    50: "DVDD",      51: "QSPI_SD3",  52: "QSPI_SCLK",
    53: "QSPI_SD0", 54: "QSPI_SD2",  55: "QSPI_SD1",  56: "QSPI_SS_N",
}

# What each RP2040 pin actually connects to on this board.
#   "+3V3" / "GND" / "+1V1"  -> a power symbol
#   None                      -> no-connect flag
#   anything else             -> a global label of that name
RP2040_NETS = {}
for _p, _n in RP2040_PINS.items():
    if _n == "IOVDD":
        RP2040_NETS[_p] = "+3V3"
    elif _n == "DVDD":
        RP2040_NETS[_p] = "+1V1"
    elif _n == "TESTEN":
        RP2040_NETS[_p] = "GND"
    elif _n in ("ADC_AVDD", "VREG_VIN", "USB_VDD"):
        RP2040_NETS[_p] = "+3V3"
    elif _n == "VREG_VOUT":
        RP2040_NETS[_p] = "+1V1"
    else:
        RP2040_NETS[_p] = _n

# Keys and encoders. Contiguous GPIO0-14 -- the whole point of dropping the
# module is that we are no longer limited to whichever pins it broke out.
KEY_NETS = [f"GPIO{i}" for i in range(9)]           # SW1..SW9
ENCODERS = {
    "ENC1": ("GPIO9",  "GPIO10", "GPIO11"),         # A, B, push
    "ENC2": ("GPIO12", "GPIO13", "GPIO14"),
}

# Unused GPIO get no-connect flags so ERC stays quiet.
UNUSED_GPIO = [f"GPIO{i}" for i in range(15, 30)]
for _p, _n in RP2040_PINS.items():
    if _n in UNUSED_GPIO:
        RP2040_NETS[_p] = None

# W25Q128 QSPI flash, SOIC-8.
FLASH_PINS = {
    1: ("CS",   "QSPI_SS_N"),
    2: ("DO",   "QSPI_SD1"),
    3: ("WP",   "QSPI_SD2"),
    4: ("GND",  "GND"),
    5: ("DI",   "QSPI_SD0"),
    6: ("CLK",  "QSPI_SCLK"),
    7: ("HOLD", "QSPI_SD3"),
    8: ("VCC",  "+3V3"),
}

# AP2112K-3.3, SOT-23-5. EN tied high to VIN so it is always on.
LDO_PINS = {
    1: ("VIN",  "+5V"),
    2: ("GND",  "GND"),
    3: ("EN",   "+5V"),
    4: ("NC",   None),
    5: ("VOUT", "+3V3"),
}

# USB-C receptacle, 16-pin. Both D+ pairs and both D- pairs are tied together
# so the cable works either way up. CC1 and CC2 each need their OWN 5.1k
# pull-down -- sharing one resistor is the classic first-board mistake and the
# host will refuse to supply 5V.
USB_PINS = {
    "A4": ("VBUS",  "+5V"),      "B4": ("VBUS", "+5V"),
    "A5": ("CC1",   "CC1"),      "B5": ("CC2",  "CC2"),
    "A6": ("DP1",   "USB_DP_C"), "B6": ("DP2",  "USB_DP_C"),
    "A7": ("DN1",   "USB_DM_C"), "B7": ("DN2",  "USB_DM_C"),
    "A8": ("SBU1",  None),       "B8": ("SBU2", None),
    "A1": ("GND",   "GND"),      "B1": ("GND",  "GND"),
    "A12": ("GND",  "GND"),      "B12": ("GND", "GND"),
    "A9": ("VBUS",  "+5V"),      "B9": ("VBUS", "+5V"),
}

# ------------------------------------------------------------- discretes ----
# (ref, value, footprint, net_a, net_b, x, y, note)
DISCRETES = [
    # Decoupling -- one per supply pin. Placement matters more than value.
    ("C1",  "100nF", "C_0402", "+3V3", "GND",  40, 250, "IOVDD pin 1"),
    ("C2",  "100nF", "C_0402", "+3V3", "GND",  70, 250, "IOVDD pin 10"),
    ("C3",  "100nF", "C_0402", "+3V3", "GND", 100, 250, "IOVDD pin 22"),
    ("C4",  "100nF", "C_0402", "+3V3", "GND", 130, 250, "IOVDD pin 33"),
    ("C5",  "100nF", "C_0402", "+3V3", "GND", 160, 250, "IOVDD pin 42"),
    ("C6",  "100nF", "C_0402", "+3V3", "GND", 190, 250, "IOVDD pin 49"),
    ("C7",  "100nF", "C_0402", "+1V1", "GND", 220, 250, "DVDD pin 23"),
    ("C8",  "100nF", "C_0402", "+1V1", "GND", 250, 250, "DVDD pin 50"),
    ("C9",  "100nF", "C_0402", "+3V3", "GND", 280, 250, "USB_VDD pin 48"),
    ("C10", "100nF", "C_0402", "+3V3", "GND", 310, 250, "ADC_AVDD pin 43"),
    ("C11", "1uF",   "C_0603", "+1V1", "GND", 340, 250, "VREG_VOUT bulk"),
    ("C12", "10uF",  "C_0805", "+3V3", "GND", 370, 250, "3V3 bulk"),
    ("C13", "1uF",   "C_0603", "+5V",  "GND", 400, 250, "LDO input"),
    ("C14", "1uF",   "C_0603", "+3V3", "GND", 430, 250, "LDO output"),
    ("C15", "100nF", "C_0402", "+3V3", "GND", 460, 250, "flash VCC"),
    # Crystal load caps. 15pF suits a 12MHz part with CL=12pF.
    ("C16", "15pF",  "C_0402", "XIN",  "GND", 490, 250, "crystal load"),
    ("C17", "15pF",  "C_0402", "XOUT_R", "GND", 520, 250, "crystal load"),
    # RUN debounce.
    ("C18", "100nF", "C_0402", "RUN",  "GND", 550, 250, "RUN debounce"),
    # USB series termination. 27R each, close to the chip.
    ("R1",  "27R",  "R_0402", "USB_DP", "USB_DP_C", 40, 285, "USB D+ series"),
    ("R2",  "27R",  "R_0402", "USB_DM", "USB_DM_C", 70, 285, "USB D- series"),
    # CC pull-downs. Each CC pin needs its own -- see note above.
    ("R3",  "5K1",  "R_0402", "CC1", "GND", 100, 285, "CC1 pull-down"),
    ("R4",  "5K1",  "R_0402", "CC2", "GND", 130, 285, "CC2 pull-down"),
    # Crystal drive-level limiting resistor on XOUT.
    ("R5",  "1K",   "R_0402", "XOUT", "XOUT_R", 160, 285, "crystal series"),
    # BOOT: series resistor so the button cannot fight the flash chip.
    ("R6",  "1K",   "R_0402", "QSPI_SS_N", "BOOT_BTN", 190, 285, "BOOT series"),
    # RUN pull-up. The RP2040 has an internal one; this makes it deterministic.
    ("R7",  "10K",  "R_0402", "+3V3", "RUN", 220, 285, "RUN pull-up"),
]


# ============================================================ symbol library ==

def pin_defs(pins, side, x, y0, spacing=2.54):
    """pins: list of (number, name). Returns s-expr pin lines + coord map."""
    angle = 0 if side == "left" else 180
    out, coords = [], {}
    for i, (num, name) in enumerate(pins):
        py = y0 - i * spacing
        out.append(
            f'\t\t\t(pin passive line (at {x:g} {py:g} {angle}) (length 5.08)\n'
            f'\t\t\t\t(name "{name}" (effects (font (size 1.27 1.27))))\n'
            f'\t\t\t\t(number "{num}" (effects (font (size 1.27 1.27)))))'
        )
        coords[num] = (x, py)
    return out, coords


def box_symbol(lib_id, left, right, half_w, ref, value):
    """A rectangular IC symbol. left/right are lists of (number, name)."""
    short = lib_id.split(":")[1]
    n = max(len(left), len(right))
    half_h = (n * 2.54) / 2 + 2.54
    y0 = half_h - 2.54

    lp, lc = pin_defs(left, "left", -(half_w + 5.08), y0)
    rp, rc = pin_defs(right, "right", half_w + 5.08, y0)
    coords = {**lc, **rc}

    body = f'''
	(symbol "{lib_id}"
		(pin_names (offset 1.016))
		(exclude_from_sim no) (in_bom yes) (on_board yes)
		(property "Reference" "{ref}" (at 0 {half_h + 2.54:g} 0)
			(effects (font (size 1.27 1.27))))
		(property "Value" "{value}" (at 0 {-half_h - 2.54:g} 0)
			(effects (font (size 1.27 1.27))))
		(property "Footprint" "" (at 0 0 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Datasheet" "~" (at 0 0 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(symbol "{short}_0_1"
			(rectangle (start {-half_w:g} {half_h:g}) (end {half_w:g} {-half_h:g})
				(stroke (width 0.254) (type default))
				(fill (type background)))
		)
		(symbol "{short}_1_1"
{chr(10).join(lp + rp)}
		)
	)
'''
    return body, coords


# RP2040: pins 1-28 down the left, 56-29 down the right.
RP_LEFT = [(p, RP2040_PINS[p]) for p in range(1, 29)]
RP_RIGHT = [(p, RP2040_PINS[p]) for p in range(56, 28, -1)]
RP_SYM, RP_COORDS = box_symbol("Taptile:RP2040", RP_LEFT, RP_RIGHT, 19.05,
                               "U", "RP2040")

FLASH_SYM, FLASH_COORDS = box_symbol(
    "Taptile:W25Q128", [(i, FLASH_PINS[i][0]) for i in (1, 2, 3, 4)],
    [(i, FLASH_PINS[i][0]) for i in (8, 7, 6, 5)], 10.16, "U", "W25Q128JVSIQ")

LDO_SYM, LDO_COORDS = box_symbol(
    "Taptile:AP2112K", [(1, "VIN"), (3, "EN"), (2, "GND")],
    [(5, "VOUT"), (4, "NC")], 10.16, "U", "AP2112K-3.3")

_usb_l = [(k, USB_PINS[k][0]) for k in
          ("A1", "A4", "A5", "A6", "A7", "A8", "A9", "A12")]
_usb_r = [(k, USB_PINS[k][0]) for k in
          ("B1", "B4", "B5", "B6", "B7", "B8", "B9", "B12")]
USB_SYM, USB_COORDS = box_symbol("Taptile:USB_C", _usb_l, _usb_r, 12.7,
                                 "J", "USB_C_Receptacle")

XTAL_SYM, XTAL_COORDS = box_symbol(
    "Taptile:Crystal", [(1, "XIN")], [(2, "XOUT")], 5.08, "Y", "12MHz")

SW_SYM, SW_COORDS = box_symbol(
    "Taptile:SW_Push", [(1, "1")], [(2, "2")], 5.08, "SW", "SW_Push")

ENC_SYM, ENC_COORDS = box_symbol(
    "Taptile:Encoder", [(1, "A"), (2, "C"), (3, "B")],
    [(4, "S1"), (5, "S2")], 6.35, "ENC", "EC11")

PASSIVE_SYM, PASSIVE_COORDS = box_symbol(
    "Taptile:Passive", [(1, "1")], [(2, "2")], 2.54, "R", "R")

HOLE_SYM, HOLE_COORDS = box_symbol(
    "Taptile:MountingHole", [(1, "H")], [], 2.54, "H", "MountingHole")

SWD_SYM, SWD_COORDS = box_symbol(
    "Taptile:SWD", [(1, "SWCLK"), (2, "SWDIO"), (3, "GND")], [], 6.35,
    "J", "SWD_Header")

POWER_SYMS = ""
for _name, _dy in (("GND", -1), ("+3V3", 1), ("+5V", 1), ("+1V1", 1)):
    _poly = ("(polyline (pts (xy 0 0) (xy 0 -1.27) (xy 1.27 -1.27) "
             "(xy 0 -2.54) (xy -1.27 -1.27) (xy 0 -1.27))"
             if _name == "GND" else
             "(polyline (pts (xy -1.27 1.27) (xy 0 2.54) (xy 1.27 1.27) "
             "(xy 0 2.54) (xy 0 0))")
    _ang = 270 if _name == "GND" else 90
    POWER_SYMS += f'''
	(symbol "power:{_name}"
		(power) (pin_numbers (hide yes)) (pin_names (offset 0) (hide yes))
		(exclude_from_sim no) (in_bom yes) (on_board yes)
		(property "Reference" "#PWR" (at 0 {-3.81 * _dy:g} 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Value" "{_name}" (at 0 {3.81 * _dy:g} 0)
			(effects (font (size 1.27 1.27))))
		(property "Footprint" "" (at 0 0 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Datasheet" "" (at 0 0 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(symbol "{_name}_0_1"
			{_poly} (stroke (width 0) (type default)) (fill (type none)))
		)
		(symbol "{_name}_1_1"
			(pin power_in line (at 0 0 {_ang}) (length 0) (hide yes)
				(name "{_name}" (effects (font (size 1.27 1.27))))
				(number "1" (effects (font (size 1.27 1.27)))))
		)
	)
'''


# ================================================================= emitters ==

def place(lib_id, ref, value, footprint, x, y):
    return f'''	(symbol (lib_id "{lib_id}") (at {x:g} {y:g} 0) (unit 1)
		(exclude_from_sim no) (in_bom yes) (on_board yes) (dnp no)
		(uuid "{uid()}")
		(property "Reference" "{ref}" (at {x:g} {y:g} 0)
			(effects (font (size 1.27 1.27))))
		(property "Value" "{value}" (at {x:g} {y:g} 0)
			(effects (font (size 1.27 1.27))))
		(property "Footprint" "{footprint}" (at {x:g} {y:g} 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Datasheet" "~" (at {x:g} {y:g} 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(instances (project "{PROJECT}"
			(path "/{ROOT}" (reference "{ref}") (unit 1))))
	)
'''


def power(name, x, y):
    return f'''	(symbol (lib_id "power:{name}") (at {x:g} {y:g} 0) (unit 1)
		(exclude_from_sim no) (in_bom yes) (on_board yes) (dnp no)
		(uuid "{uid()}")
		(property "Reference" "#PWR?" (at {x:g} {y:g} 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Value" "{name}" (at {x:g} {y + 3.81:g} 0)
			(effects (font (size 1.27 1.27))))
		(property "Footprint" "" (at {x:g} {y:g} 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(property "Datasheet" "" (at {x:g} {y:g} 0)
			(effects (font (size 1.27 1.27)) (hide yes)))
		(instances (project "{PROJECT}"
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


POWER_NETS = {"GND", "+3V3", "+5V", "+1V1"}


def connect(out, px, py, net, side):
    """Attach a pin at (px,py) to `net`. Emits a stub plus a label, a power
    symbol, or a no-connect as appropriate."""
    if net is None:
        out.append(nc(px, py))
        return
    d = -10.16 if side == "left" else 10.16
    out.append(wire(px, py, px + d, py))
    if net in POWER_NETS:
        out.append(power(net, px + d, py))
    else:
        out.append(label(net, px + d, py, 180 if side == "left" else 0))


# ==================================================================== build ==

def build():
    out = []

    # --- RP2040 ---------------------------------------------------------
    ux, uy = 300.0, 150.0
    out.append(place("Taptile:RP2040", "U1", "RP2040",
                     "Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm",
                     ux, uy))
    for p in range(1, 57):
        cx, cy = RP_COORDS[p]
        side = "left" if p <= 28 else "right"
        connect(out, ux + cx, uy + cy, RP2040_NETS[p], side)

    # --- QSPI flash -----------------------------------------------------
    fx, fy = 480.0, 80.0
    out.append(place("Taptile:W25Q128", "U2", "W25Q128JVSIQ",
                     "Package_SO:SOIC-8_5.23x5.23mm_P1.27mm", fx, fy))
    for p, (_nm, net) in FLASH_PINS.items():
        cx, cy = FLASH_COORDS[p]
        connect(out, fx + cx, fy + cy, net, "left" if p <= 4 else "right")

    # --- 3V3 regulator --------------------------------------------------
    lx, ly = 100.0, 80.0
    out.append(place("Taptile:AP2112K", "U3", "AP2112K-3.3",
                     "Package_TO_SOT_SMD:SOT-23-5", lx, ly))
    for p, (_nm, net) in LDO_PINS.items():
        cx, cy = LDO_COORDS[p]
        connect(out, lx + cx, ly + cy, net, "left" if p in (1, 2, 3) else "right")

    # --- USB-C ----------------------------------------------------------
    # Footprint deliberately matches the part already on the base PCB, so
    # "Update PCB from Schematic" reuses it instead of swapping it out.
    bx, by = 100.0, 160.0
    out.append(place("Taptile:USB_C", "J1", "USB_C_Receptacle",
                     "Connector_USB:USB_C_Receptacle_GCT_USB4105-xx-A_16P_"
                     "TopMnt_Horizontal",
                     bx, by))
    for k, (_nm, net) in USB_PINS.items():
        if k not in USB_COORDS:
            continue
        cx, cy = USB_COORDS[k]
        connect(out, bx + cx, by + cy, net, "left" if k.startswith("A") else "right")

    # --- crystal --------------------------------------------------------
    yx, yy = 480.0, 150.0
    out.append(place("Taptile:Crystal", "Y1", "12MHz",
                     "Crystal:Crystal_SMD_3225-4Pin_3.2x2.5mm", yx, yy))
    # The crystal sits on the FAR side of R5, not the near side: RP2040 XOUT
    # -> R5 (1k) -> XOUT_R -> crystal. Putting the resistor between the crystal
    # and its load cap instead would make it do nothing at all.
    for p, net in ((1, "XIN"), (2, "XOUT_R")):
        cx, cy = XTAL_COORDS[p]
        connect(out, yx + cx, yy + cy, net, "left" if p == 1 else "right")

    # --- BOOT and RESET buttons ----------------------------------------
    for ref, net, sx, sy in (("SW10", "BOOT_BTN", 480.0, 185.0),
                             ("SW11", "RUN", 480.0, 210.0)):
        out.append(place("Taptile:SW_Push", ref, "SW_Push",
                         "Button_Switch_SMD:SW_SPST_TL3342", sx, sy))
        c1, c2 = SW_COORDS[1], SW_COORDS[2]
        connect(out, sx + c1[0], sy + c1[1], net, "left")
        connect(out, sx + c2[0], sy + c2[1], "GND", "right")

    # --- SWD debug header ----------------------------------------------
    dx, dy = 480.0, 240.0
    out.append(place("Taptile:SWD", "J2", "SWD_Header",
                     "Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical",
                     dx, dy))
    for p, net in ((1, "SWCLK"), (2, "SWDIO"), (3, "GND")):
        cx, cy = SWD_COORDS[p]
        connect(out, dx + cx, dy + cy, net, "left")

    # --- discretes ------------------------------------------------------
    for ref, val, fp, net_a, net_b, x, y, _note in DISCRETES:
        kind = "Capacitor_SMD:C_0402_1005Metric" if ref.startswith("C") \
            else "Resistor_SMD:R_0402_1005Metric"
        if "0603" in fp:
            kind = "Capacitor_SMD:C_0603_1608Metric"
        elif "0805" in fp:
            kind = "Capacitor_SMD:C_0805_2012Metric"
        out.append(place("Taptile:Passive", ref, val, kind, x, y))
        c1, c2 = PASSIVE_COORDS[1], PASSIVE_COORDS[2]
        connect(out, x + c1[0], y + c1[1], net_a, "left")
        connect(out, x + c2[0], y + c2[1], net_b, "right")

    # --- 9 keys ---------------------------------------------------------
    n = 0
    for row in range(3):
        for col in range(3):
            n += 1
            kx = 60.0 + col * 70.0
            ky = 320.0 + row * 30.0
            out.append(place("Taptile:SW_Push", f"SW{n}", "SW_Push",
                             "Button_Switch_Keyboard:SW_Cherry_MX_1.00u_PCB",
                             kx, ky))
            c1, c2 = SW_COORDS[1], SW_COORDS[2]
            connect(out, kx + c1[0], ky + c1[1], KEY_NETS[n - 1], "left")
            connect(out, kx + c2[0], ky + c2[1], "GND", "right")

    # --- 2 encoders -----------------------------------------------------
    for i, (ref, (na, nb, nsw)) in enumerate(ENCODERS.items()):
        ex = 330.0 + i * 90.0
        ey = 330.0
        out.append(place("Taptile:Encoder", ref, "EC11",
                         "Rotary_Encoder:RotaryEncoder_Alps_EC11E-Switch_Vertical_H20mm",
                         ex, ey))
        for p, net in ((1, na), (2, "GND"), (3, nb)):
            cx, cy = ENC_COORDS[p]
            connect(out, ex + cx, ey + cy, net, "left")
        for p, net in ((4, nsw), (5, "GND")):
            cx, cy = ENC_COORDS[p]
            connect(out, ex + cx, ey + cy, net, "right")

    # --- mounting holes -------------------------------------------------
    # These exist on the base PCB. Without matching symbols here, "Update PCB
    # from Schematic" treats them as unknown extras and offers to delete them.
    for i in range(1, 5):
        hx, hy = 560.0, 300.0 + i * 12.0
        out.append(place("Taptile:MountingHole", f"H{i}", "MountingHole",
                         "MountingHole_7.6mm", hx, hy))
        cx, cy = HOLE_COORDS[1]
        out.append(nc(hx + cx, hy + cy))

    libs = (RP_SYM + FLASH_SYM + LDO_SYM + USB_SYM + XTAL_SYM + SW_SYM
            + ENC_SYM + PASSIVE_SYM + SWD_SYM + HOLE_SYM + POWER_SYMS)

    return f'''(kicad_sch
	(version 20231120)
	(generator "eeschema")
	(generator_version "8.0")
	(uuid "{ROOT}")
	(paper "A2")
	(title_block
		(title "Taptile Mini - RP2040")
		(date "2026-08-17")
		(rev "B")
		(comment 1 "9 keys + 2 encoders, direct pin, bare RP2040")
		(comment 2 "Pinout per RP2040 product brief RP-008372-DS-1")
	)
	(lib_symbols
{libs}	)
{"".join(out)}	(sheet_instances
		(path "/" (page "1"))
	)
)
'''


if __name__ == "__main__":
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else "Taptile RP2040.kicad_sch"
    text = build()
    with open(target, "w", encoding="utf-8") as f:
        f.write(text)

    # ---- self-check: every net must appear at least twice -------------
    from collections import Counter
    nets = Counter()
    for p in range(1, 57):
        if RP2040_NETS[p]:
            nets[RP2040_NETS[p]] += 1
    for _n, net in FLASH_PINS.values():
        if net:
            nets[net] += 1
    for _n, net in LDO_PINS.values():
        if net:
            nets[net] += 1
    for _n, net in USB_PINS.values():
        if net:
            nets[net] += 1
    for ref, _v, _f, a, b, *_ in DISCRETES:
        nets[a] += 1
        nets[b] += 1
    nets["XIN"] += 1
    nets["XOUT"] += 1
    for net in KEY_NETS:
        nets[net] += 1
    for a, b, sw in ENCODERS.values():
        nets[a] += 1
        nets[b] += 1
        nets[sw] += 1
    for net in ("SWCLK", "SWDIO", "GND"):
        nets[net] += 1
    nets["BOOT_BTN"] += 1
    nets["RUN"] += 1

    orphans = sorted(n for n, c in nets.items() if c < 2)
    print(f"wrote {target}  ({len(text)} bytes)")
    print(f"  nets: {len(nets)}   pins connected: {sum(nets.values())}")
    if orphans:
        print(f"  !! SINGLE-PIN NETS (would be unconnected): {orphans}")
    else:
        print("  OK - every net has at least two pins on it")
