# Building the Taptile Mini schematic in KiCad

Step by step, in the order you should actually do it. KiCad 8.

Work through it in one sitting per section. Don't skip ahead to the PCB — the
schematic is the source of truth, and the PCB is generated from it.

---

## Before you start

**Install the hot-swap footprint library.**

Download https://github.com/kiswitch/kiswitch → Preferences → Manage Footprint
Libraries → Add → point at the `.pretty` folders.

**Start a fresh project.** File → New Project → `TaptileMini`. Don't reuse the
existing files — the placement in there was done before the schematic and will
be replaced anyway.

**Two habits that will save you hours:**

1. **Use net labels, not wires**, for anything that crosses the sheet. Place a
   label (press `L`), type the name, attach it to a pin. Two labels with the
   same name are connected. This is how professionals draw schematics — long
   wires across a page are how you get mistakes you can't see.
2. **Press `A` to place a symbol, `L` for a label, `P` for a power symbol.**
   Learn those three and everything else is slow by comparison.

---

## Step 1 — The RP2040 and its power pins

Place: `A` → search **RP2040** → place it in the middle-left of the sheet.

It's a big symbol with a lot of pins. Work through the power pins first,
because that's where boards die.

**Attach these labels:**

| Pin | Label |
|---|---|
| IOVDD ×6 | `+3V3` |
| USB_VDD | `+3V3` |
| ADC_AVDD | `+3V3` |
| VREG_IN | `+3V3` |
| DVDD ×2 | `+1V1` |
| VREG_VOUT | `+1V1` |
| GND / EP (thermal pad) | `GND` |
| TESTEN | `GND` |

**Decoupling capacitors.** Place `Device:C`, value **100nF**, one per power
pin. One side to the pin's net label, the other to `GND`.

You need **10 × 100nF** total: six for IOVDD, one each for USB_VDD, ADC_AVDD,
and two for DVDD.

Then **1µF** from `+1V1` to GND, and **10µF** from `+3V3` to GND.

> This is the single most-skipped part of an RP2040 design and the most common
> reason a first board doesn't enumerate. Don't economise here.

---

## Step 2 — Crystal

Place `Device:Crystal_GND24` (the 4-pin version).

- Crystal pin 1 → `XIN` on the RP2040
- Crystal pin 3 → `XOUT`
- Crystal pins 2 and 4 → `GND`
- **27pF** capacitor from XIN to GND
- **27pF** capacitor from XOUT to GND
- **1kΩ** resistor in series between XOUT and the crystal

Value: **12MHz**. Not negotiable — the RP2040's USB timing depends on it.

---

## Step 3 — Flash memory

Place `Memory_Flash:W25Q16JVSS` (or search `W25Q`).

**This is the part that was missing from the board your cofounder sent.** The
RP2040 has no internal program memory. Without this chip it will not boot,
at all, ever.

| Flash pin | Label |
|---|---|
| CS | `QSPI_SS` |
| CLK | `QSPI_SCLK` |
| DI (IO0) | `QSPI_SD0` |
| DO (IO1) | `QSPI_SD1` |
| WP (IO2) | `QSPI_SD2` |
| HOLD (IO3) | `QSPI_SD3` |
| VCC | `+3V3` |
| GND | `GND` |

Put the same labels on the matching RP2040 pins. Add **100nF** from the
flash's VCC to GND.

---

## Step 4 — USB-C

Place `Connector:USB_C_Receptacle_USB2.0_16P`.

| Connector | Connection |
|---|---|
| VBUS | `+5V` |
| GND, SHIELD | `GND` |
| CC1 | **5.1kΩ** to GND |
| CC2 | **5.1kΩ** to GND |
| D+ (A6 and B6 joined) | **27Ω** → `USB_DP` |
| D− (A7 and B7 joined) | **27Ω** → `USB_DM` |

Label the RP2040's USB_DP and USB_DM pins to match.

**The two 5.1k resistors are what tell the computer this is a device.** Miss
them and nothing happens when you plug it in — no error, just silence.

**ESD protection:** place `USBLC6-2SC6`, its two I/O pins across D+ and D−,
VBUS to `+5V`, GND to `GND`. Not optional on something people plug in daily.

---

## Step 5 — 3.3V regulator

Place `Regulator_Linear:AP2112K-3.3`.

- VIN → `+5V`
- VOUT → `+3V3`
- GND → `GND`
- EN → `+5V`
- **1µF** on the input, **1µF** on the output

600mA is plenty. If you add per-key RGB later, recheck the current budget.

---

## Step 6 — BOOT and RESET buttons

Place two `Switch:SW_Push`.

**BOOT** — how you get the board into flash mode:
- One side → `QSPI_SS`, through a **1kΩ** resistor
- Other side → `GND`
- Also **10kΩ** pull-up from `QSPI_SS` to `+3V3`

**RESET**:
- One side → `RUN`
- Other side → `GND`
- **1kΩ** pull-up from `RUN` to `+3V3`
- **100nF** from `RUN` to `GND`

---

## Step 7 — The nine key switches

Place `Switch:SW_Push` × 9. Reference them **SW1** to **SW9**.

Each one: pin 1 → its own GPIO label, pin 2 → `GND`.

| Switch | Label |
|---|---|
| SW1 | `GP0` |
| SW2 | `GP1` |
| SW3 | `GP2` |
| SW4 | `GP3` |
| SW5 | `GP4` |
| SW6 | `GP5` |
| SW7 | `GP6` |
| SW8 | `GP7` |
| SW9 | `GP8` |

Put the matching label on each RP2040 GPIO pin.

**No diodes.** Every switch has its own pin, so there's no matrix and nothing
to ghost. QMK enables the internal pull-ups, so no resistors either.

---

## Step 8 — The two encoders

Place `Device:Rotary_Encoder_Switch` × 2. **Not a potentiometer** — that's the
other thing that was wrong in the file you were sent. A pot reports a position;
an encoder reports rotation steps. Different part, different behaviour.

| ENC1 pin | Label |
|---|---|
| A | `GP9` |
| C (common) | `GND` |
| B | `GP10` |
| Switch pin 1 | `GP11` |
| Switch pin 2 | `GND` |

| ENC2 pin | Label |
|---|---|
| A | `GP12` |
| C | `GND` |
| B | `GP13` |
| Switch pin 1 | `GP14` |
| Switch pin 2 | `GND` |

Optional but nice: 100nF from A to GND and B to GND on each. Cheap hardware
debounce, saves fighting jitter in firmware.

---

## Step 9 — Check it

**Tools → Electrical Rules Checker → Run.**

Fix everything it complains about. Common ones:

- *"Input power pin not driven"* — you need `PWR_FLAG` on `+5V` and `+3V3`.
  Place it from the power symbols library and attach one to each.
- *"Pin not connected"* — either connect it or mark it deliberately unused
  with the no-connect tool (`Q`).

**ERC must be clean before you go near the PCB.** Every error here becomes a
missing connection on a physical board you've paid for.

---

## Step 10 — Assign footprints

**Tools → Assign Footprints.**

| Symbol | Footprint |
|---|---|
| SW1–SW9 | `Switch_Keyboard_Hotswap_Kailh:SW_Hotswap_Kailh_MX_1.00u` |
| ENC1, ENC2 | `Rotary_Encoder:RotaryEncoder_Alps_EC11E-Switch_Vertical_H20mm` |
| RP2040 | `Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm` |
| Flash | `Package_SO:SOIC-8_5.23x5.23mm_P1.27mm` |
| Crystal | `Crystal:Crystal_SMD_3225-4Pin_3.2x2.5mm` |
| Regulator | `Package_TO_SOT_SMD:SOT-23-5` |
| BOOT, RESET | `Button_Switch_SMD:SW_SPST_TL3342` |
| USB-C | `Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12` |
| Resistors, caps | `Resistor_SMD:R_0603_1608Metric`, `Capacitor_SMD:C_0603_1608Metric` |

Use **0603** for everything passive. Smaller is cheaper but harder to hand-fix
when something goes wrong, and something will.

---

## Step 11 — Into the PCB

**Tools → Update PCB from Schematic** (`F8`). Everything arrives in a pile.

Place in this order:

1. **USB-C** at the top edge, centred
2. **The nine switches** on a 19.05mm grid, 3×3, centred
3. **The two encoders** below the keys, ~24mm apart
4. **RP2040** on the back, centre of the board
5. **Flash and crystal** as close to the RP2040 as physically possible
6. **Decoupling caps** right against their power pins — this matters more than
   it looks
7. **Regulator** near the USB connector
8. **BOOT and RESET** on the bottom edge
9. **Mounting holes** 5mm in from each corner

Board size: **76 × 100mm**. Stay under 100×100 — that's JLCPCB's cheapest
bracket and crossing it costs real money.

---

## Step 12 — Routing

Order matters:

1. **GND first.** Pour a ground zone on the back layer, whole board.
2. **Power.** `+3V3` and `+5V`, 0.4mm minimum track width.
3. **USB D+/D−.** Route as a pair, same length, kept together, no vias if you
   can manage it. This is the fussiest part of the board.
4. **QSPI** (flash lines). Keep short, keep them together.
5. **Everything else.** 0.25mm is fine for switches.

Then pour a ground zone on the **front** layer too and fill both (`B`).

---

## Step 13 — Before you spend money

1. **DRC** — Inspect → Design Rules Checker. Must be clean.
2. **3D viewer** (`Alt+3`) — look for parts overlapping or hanging off the edge.
3. **Compare against the Raspberry Pi RP2040 Hardware Design Guide**, section by
   section. This is where first spins die.
4. **Export Gerbers** — File → Fabrication Outputs → Gerbers, plus drill files.
5. **JLCPCB's free DFM check** — upload and read every warning.

Then order **5 fabbed, 2 assembled**. The 2 test the electronics; the 3 blanks
let you check the case fits while you wait.

---

## If you get stuck

The RP2040 section is the hard part and it's also the part that's already
solved. Open the **Raspberry Pi Pico schematic** (published, free) or the
**Soldered Electronics macropad KiCad files** side by side with yours and
compare. Copying a proven power section isn't cheating — it's what everyone
does, and it's why their boards boot.
