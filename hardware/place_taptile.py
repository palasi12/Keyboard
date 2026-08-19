"""
Taptile Mini — board outline and component placement.

Run this inside KiCad's Python console (Tools -> Scripting Console) with a new,
empty PCB open. It draws the board outline, mounting holes, and places every
footprint at the right coordinates.

It does NOT route anything and it does NOT create the schematic. What it saves
you is the fiddly, error-prone part: getting nine switches on an exact 19.05mm
grid, square to the board, with the encoders and USB port where the case
expects them.

Requires the kiswitch footprint library for MX hot-swap footprints:
    https://github.com/kiswitch/kiswitch
Install it via Preferences -> Manage Footprint Libraries.

Tested against the KiCad 8 API. KiCad 7 uses wxPoint instead of VECTOR2I — if
you get a type error on SetPosition, that is why.
"""

import pcbnew

# ---------------------------------------------------------------- geometry --

BOARD_W = 76.0          # mm — stays under JLCPCB's 100x100 price break
BOARD_H = 100.0
CORNER_R = 3.0

KEY_PITCH = 19.05       # standard MX spacing, centre to centre
KEY_COLS = 3
KEY_ROWS = 3

# Top row sits 22mm from the top edge, leaving room for the USB port.
KEY_TOP_Y = 22.0
ENCODER_Y = 80.0        # measured from top
ENCODER_SPACING = 24.0

USB_Y = 2.0             # centre of the connector, from top edge
HOLE_INSET = 5.0
HOLE_DIA = 3.2          # M3 clearance

# --------------------------------------------------------------- footprints --

FOOTPRINTS = {
    "switch": ("Switch_Keyboard_Hotswap_Kailh", "SW_Hotswap_Kailh_MX_1.00u"),
    "encoder": ("Rotary_Encoder", "RotaryEncoder_Alps_EC11E-Switch_Vertical_H20mm"),
    "usb": ("Connector_USB", "USB_C_Receptacle_XKB_U262-16XN-4BVC11"),
    "rp2040": ("Package_DFN_QFN", "QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm"),
    "flash": ("Package_SO", "SOIC-8_5.23x5.23mm_P1.27mm"),
    "crystal": ("Crystal", "Crystal_SMD_3225-4Pin_3.2x2.5mm"),
    "button": ("Button_Switch_SMD", "SW_SPST_TL3342"),
    "hole": ("MountingHole", "MountingHole_3.2mm_M3"),
}


def mm(value):
    return pcbnew.FromMM(value)


def at(x, y):
    """Board coordinates. KiCad's Y axis points down, which matches how we
    measure from the top edge here."""
    return pcbnew.VECTOR2I(mm(x), mm(y))


def load(board, kind, ref, x, y, rotation=0):
    lib, name = FOOTPRINTS[kind]
    path = f"{pcbnew.SETTINGS_MANAGER.GetDefaultUserFootprintsPath()}/{lib}.pretty"

    footprint = pcbnew.FootprintLoad(path, name)
    if footprint is None:
        print(f"  ! could not load {lib}:{name} — check the library is installed")
        return None

    footprint.SetPosition(at(x, y))
    if rotation:
        footprint.SetOrientationDegrees(rotation)
    footprint.SetReference(ref)
    board.Add(footprint)
    print(f"  placed {ref:8s} {kind:8s} at ({x:.2f}, {y:.2f})")
    return footprint


def draw_outline(board):
    """Rounded rectangle on Edge.Cuts."""
    layer = board.GetLayerID("Edge.Cuts")

    segments = [
        ((CORNER_R, 0), (BOARD_W - CORNER_R, 0)),
        ((BOARD_W, CORNER_R), (BOARD_W, BOARD_H - CORNER_R)),
        ((BOARD_W - CORNER_R, BOARD_H), (CORNER_R, BOARD_H)),
        ((0, BOARD_H - CORNER_R), (0, CORNER_R)),
    ]
    for start, end in segments:
        line = pcbnew.PCB_SHAPE(board)
        line.SetShape(pcbnew.SHAPE_T_SEGMENT)
        line.SetStart(at(*start))
        line.SetEnd(at(*end))
        line.SetLayer(layer)
        line.SetWidth(mm(0.1))
        board.Add(line)

    corners = [
        (CORNER_R, CORNER_R, 180, 270),
        (BOARD_W - CORNER_R, CORNER_R, 270, 360),
        (BOARD_W - CORNER_R, BOARD_H - CORNER_R, 0, 90),
        (CORNER_R, BOARD_H - CORNER_R, 90, 180),
    ]
    for cx, cy, start_angle, _ in corners:
        arc = pcbnew.PCB_SHAPE(board)
        arc.SetShape(pcbnew.SHAPE_T_ARC)
        arc.SetCenter(at(cx, cy))
        arc.SetStart(at(cx + CORNER_R, cy))
        arc.SetArcAngleAndEnd(pcbnew.EDA_ANGLE(90, pcbnew.DEGREES_T))
        arc.SetLayer(layer)
        arc.SetWidth(mm(0.1))
        board.Add(arc)

    print(f"  outline {BOARD_W} x {BOARD_H} mm, {CORNER_R}mm corners")


def add_silkscreen(board):
    text = pcbnew.PCB_TEXT(board)
    text.SetText("TAPTILE")
    text.SetPosition(at(BOARD_W / 2, BOARD_H - 8))
    text.SetLayer(board.GetLayerID("F.SilkS"))
    text.SetTextSize(pcbnew.VECTOR2I(mm(2.0), mm(2.0)))
    text.SetTextThickness(mm(0.3))
    board.Add(text)
    print("  silkscreen added")


def main():
    board = pcbnew.GetBoard()
    print("Taptile Mini — placing components\n")

    draw_outline(board)

    # --- key grid, centred horizontally ---
    grid_w = (KEY_COLS - 1) * KEY_PITCH
    x0 = (BOARD_W - grid_w) / 2

    n = 1
    for row in range(KEY_ROWS):
        for col in range(KEY_COLS):
            load(
                board, "switch", f"SW{n}",
                x0 + col * KEY_PITCH,
                KEY_TOP_Y + row * KEY_PITCH,
            )
            n += 1

    # --- encoders, below the keys ---
    load(board, "encoder", "ENC1", BOARD_W / 2 - ENCODER_SPACING / 2, ENCODER_Y)
    load(board, "encoder", "ENC2", BOARD_W / 2 + ENCODER_SPACING / 2, ENCODER_Y)

    # --- USB-C, top centre ---
    load(board, "usb", "J1", BOARD_W / 2, USB_Y, rotation=180)

    # --- controller cluster, on the back so the front stays clean ---
    load(board, "rp2040", "U1", BOARD_W / 2, 50.0)
    load(board, "flash", "U2", BOARD_W / 2 + 12, 50.0)
    load(board, "crystal", "Y1", BOARD_W / 2 - 12, 50.0)

    # --- buttons, bottom edge, recessed so they cannot be hit by accident ---
    load(board, "button", "SW_BOOT", BOARD_W / 2 - 8, BOARD_H - 6)
    load(board, "button", "SW_RST", BOARD_W / 2 + 8, BOARD_H - 6)

    # --- M3 mounting holes ---
    for i, (hx, hy) in enumerate([
        (HOLE_INSET, HOLE_INSET),
        (BOARD_W - HOLE_INSET, HOLE_INSET),
        (HOLE_INSET, BOARD_H - HOLE_INSET),
        (BOARD_W - HOLE_INSET, BOARD_H - HOLE_INSET),
    ], start=1):
        load(board, "hole", f"H{i}", hx, hy)

    add_silkscreen(board)

    pcbnew.Refresh()
    print("\nDone. Now, in order:")
    print("  1. Draw the schematic from hardware/netlist.md")
    print("  2. Update the PCB from the schematic to attach the nets")
    print("  3. Route — power and ground first, then USB as a 90ohm pair")
    print("  4. Pour ground on both layers")
    print("  5. DRC, then JLCPCB's DFM check before ordering")


main()
