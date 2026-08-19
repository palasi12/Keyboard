# RP2040 layout rules — read before routing

The schematic being correct does not make the board work. On a bare-RP2040
design, most first boards that fail do so because of **layout**, not wiring.
These are the rules that matter, in the order they'll bite you.

Source: Raspberry Pi *Hardware design with RP2040*, and the published Pico
reference layout.

---

## 1. Decoupling capacitors — the single biggest one

Every 100nF capacitor must sit **within 2mm of the pin it serves**, on the same
side of the board, with its own via straight down to the ground plane.

A decoupling cap placed 15mm away is not decoupling anything. It becomes an
antenna, and the symptom is a board that enumerates on USB sometimes, or works
until you type fast.

| Cap | Serves | RP2040 pin |
|---|---|---|
| C1 | IOVDD | 1 |
| C2 | IOVDD | 10 |
| C3 | IOVDD | 22 |
| C4 | IOVDD | 33 |
| C5 | IOVDD | 42 |
| C6 | IOVDD | 49 |
| C7 | DVDD | 23 |
| C8 | DVDD | 50 |
| C9 | USB_VDD | 48 |
| C10 | ADC_AVDD | 43 |
| C11 (1µF) | VREG_VOUT | 45 |

Place these **first**, before routing anything else. If you route first there
will be no room left and you will be tempted to move them. Don't.

---

## 2. USB D+ / D− must be a differential pair

- Route **USB_DP and USB_DM together**, same length, constant spacing
- Target **90Ω differential impedance**. On a standard JLCPCB 2-layer 1.6mm
  board with 1oz copper, that's roughly **0.3mm traces with 0.2mm gap** — but
  use JLCPCB's impedance calculator for your exact stackup rather than trusting
  this number.
- **No vias** on the pair if you can avoid it. One via each, matched, if you
  can't.
- Keep the 27Ω series resistors (R1, R2) close to the RP2040, not close to the
  connector.
- Solid ground directly under the whole pair, unbroken.

Length matching matters less at USB full-speed (12 Mbps) than people claim, but
impedance and an unbroken reference plane genuinely do.

---

## 3. Crystal — the second most common failure

- Y1 goes **hard against pins 20 (XIN) and 21 (XOUT)**. Millimetres, not
  centimetres.
- C16 and C17 (15pF) sit right at the crystal, grounded to the same local via.
- R5 (1kΩ) goes in series on the XOUT side, close to the chip.
- **Guard the crystal**: ground pour around it on the top layer, ground plane
  underneath, and no signal traces routed under or beside it.

A badly placed crystal gives you a board that boots inconsistently or drifts on
USB timing.

---

## 4. Ground

- **Solid ground pour on the bottom layer.** Do not carve it up with signal
  routing — every cut is a detour for return current.
- The RP2040's exposed centre pad **is** its ground connection. It needs a
  **3×3 array of vias** through the pad into the plane. Without them the chip
  has no ground and no heat path.
- Stitch the top pour to the bottom pour with vias around the board edge, every
  ~10mm.

---

## 5. Power

- VBUS from USB → C13 → LDO in → LDO out → C14 → the 3V3 pour
- Keep the 5V section physically small and near the connector
- **CC1 and CC2 each need their own 5.1kΩ resistor** (R3, R4). This is in the
  schematic correctly — just don't "optimise" it to one resistor during layout.
  Share them and the host will not supply 5V, and the board will look completely
  dead.

---

## 6. Before you order

1. **DRC in KiCad** — zero errors, not "zero I care about"
2. **JLCPCB's own DFM check** at upload — it catches clearances their process
   can't hold
3. **Print the board 1:1 on paper** and physically sit a switch, an encoder and
   the USB connector on it. Ten seconds, and it catches footprint mistakes that
   cost three weeks.
4. Order **2 boards, not 5** on the first revision. There will be a revision.

---

## 7. Honest expectation setting

First bare-MCU boards commonly fail. Not because the designer is bad — because
there are ~15 things that must all be right and no way to test until it's
assembled. Budget for **two revisions**, roughly NZ$60 and six weeks total.

If that timeline or that risk isn't acceptable, the module version
(`gen_schematic.py`) works on the first try with near-certainty, because the
hard parts are pre-solved on a board someone else already validated. The module
costs more per unit and less in time.

Both files exist. Pick based on which resource you have less of.
