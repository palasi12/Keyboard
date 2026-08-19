# Taptile Mini — component placement

Coordinates for `TaptileMini_Base_PCB`, read from your actual board file.

**Board outline:** X 65.00 → 135.00, Y 40.00 → 160.00 (70 × 120 mm)
**Board centre X:** 100.00

In KiCad: select a footprint, press **E**, and type the X/Y directly. Do not
drag by eye — the key grid has to be exact or your keycaps will foul.

---

## Two things wrong in the current file

**1. Your key spacing is 21.5mm. It should be 19.05mm.**

Current columns sit at X = 82.00, 103.46, 125.04 — that's 21.46 and 21.58
apart. MX keycaps are made for a 19.05mm grid. At 21.5 you get a 3.5mm gap
between caps instead of 1mm, and the board reads as sparse rather than
deliberate. Corrected values below.

**2. Three parts need swapping.**

| Currently on the board | Replace with | Why |
|---|---|---|
| `QFN-56` (bare RP2040) | KB2040 module | The module has the chip, flash, crystal, regulator and USB already |
| `USB_C_Receptacle` | — delete — | The KB2040 has its own USB-C |
| `Potentiometer_ACP_CA14` ×2 | `RotaryEncoder_Alps_EC11E-Switch_Vertical_H20mm` | A pot reports position; you need rotation steps |

The `D_01005` diode and `LED_01005` can also go — nothing in the schematic
uses them.

---

## Placement table

### Controller

| Ref | Part | X | Y | Rot |
|---|---|---|---|---|
| J1/J2 | KB2040 (2× PinHeader_1x12) | 100.00 | 57.00 | 0 |

Module is 17.78mm between pin rows, ~33mm long. Centred at Y 57 it spans
Y 40.5 → 73.5, putting the **USB-C at the top edge** where a cable can reach.

Check this in the 3D viewer before ordering. USB placement is the most common
mechanical mistake on a first board.

### The nine keys — 19.05mm grid, centred

| Ref | X | Y |
|---|---|---|
| SW1 | 80.95 | 84.00 |
| SW2 | 100.00 | 84.00 |
| SW3 | 119.05 | 84.00 |
| SW4 | 80.95 | 103.05 |
| SW5 | 100.00 | 103.05 |
| SW6 | 119.05 | 103.05 |
| SW7 | 80.95 | 122.10 |
| SW8 | 100.00 | 122.10 |
| SW9 | 119.05 | 122.10 |

Rotation 0 on all nine.

### Encoders

| Ref | X | Y | Rot |
|---|---|---|---|
| ENC1 | 88.00 | 145.00 | 0 |
| ENC2 | 112.00 | 145.00 | 0 |

24mm apart, centred on the board.

### Mounting holes — already correct

| Ref | X | Y |
|---|---|---|
| H1 | 129.00 | 46.00 |
| H2 | 71.00 | 46.00 |
| H3 | 71.00 | 154.00 |
| H4 | 129.00 | 154.00 |

Note these are **7.6mm** holes — that's M4 or a standoff, not M3. Fine, just
make sure the case matches.

---

## Vertical fit — this is tight

Running down the board:

| Feature | Y range |
|---|---|
| Board top | 40.0 |
| KB2040 | 40.5 – 73.5 |
| Key row 1 cap | 75.0 – 93.0 |
| Key row 2 cap | 94.05 – 112.05 |
| Key row 3 cap | 113.1 – 131.1 |
| Encoder knob (25mm) | 132.5 – 157.5 |
| Board bottom | 160.0 |

**Only 1.4mm between the bottom keycaps and the knobs.** It will fit, but it
will look cramped and your fingers will catch.

Three ways to fix it, pick one:

1. **20mm knobs instead of 25mm** — knobs then span 135 → 155, giving 3.9mm
   clearance. Easiest fix.
2. **Move encoders to Y 148** — 4.4mm clearance, but only 2.5mm to the board
   edge below.
3. **Lengthen the board to 130mm** (Y 40 → 170). Still under the 100×100
   price break? No — you are already over it at 70×120, so the cheap bracket
   is gone either way and 10mm more costs almost nothing.

I'd do (1) — smaller knobs, no other changes.

---

## Order of work

1. Delete the QFN, USB-C, diode and LED
2. Swap both potentiometers for EC11 encoder footprints
3. Add the two 1x12 headers for the KB2040
4. Set every position from the tables above using **E**
5. `F8` from the schematic to pull in the nets
6. Route, pour ground, DRC
