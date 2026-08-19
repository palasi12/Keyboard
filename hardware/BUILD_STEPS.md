# Taptile Mini — the build, start to finish

KB2040 version. This supersedes SCHEMATIC_GUIDE.md steps 1–6.

Read WHILE_YOU_WORK.md alongside this — it explains *why* each step is what it
is, and what goes wrong when it isn't.

---

# PHASE 1 — Setup (30 min, once)

## 1. Install KiCad 10
kicad.org. Take the defaults.

**Version warning — read this before anything else.** The file your cofounder
sent is KiCad **8** format (`generator_version "8.0"`). If you open it in
KiCad 10 it gets upgraded, and he then cannot open it again on 8.

Agree on one version before either of you does more work. KiCad 10 is the
sensible choice — it's current, and its library ships 1216 new footprints
which may include parts you'd otherwise install by hand.

## 2. Check the official library first
KiCad 10 added 1216 footprints and 952 symbols over KiCad 9. Before installing
anything, search the built-in libraries for:

- `KB2040` or `Pro_Micro`
- `Hotswap` or `Kailh`

If they're already there, skip steps 3 and 4 entirely.

## 3. Install the hot-swap footprints (if not already present)
Download https://github.com/kiswitch/kiswitch → unzip somewhere permanent.
KiCad → Preferences → Manage Footprint Libraries → Global → **+** → browse to
each `.pretty` folder inside it.

## 4. Install Adafruit's KiCad library (if needed)
https://github.com/adafruit/Adafruit-KiCad-Libraries → same process, add both
the symbol and footprint libraries.

## 5. New project
File → New Project → name it `TaptileMini`. Save it somewhere you'll find it.

**Do not open the file your cofounder sent.** Its placement was done before a
schematic existed, so all of it gets regenerated.

## 6. Read the pinout and fill in the table
Open https://learn.adafruit.com/adafruit-kb2040/pinouts

Write down the GPIO number beside each castellated pad. Pick 15. Fill in the
table in KB2040_ADDENDUM.md and send it to me before Phase 2.

**Nothing else in this document works until that table is filled in.**

---

## KiCad 10 conveniences worth knowing

- **Lasso select** — drag a freeform shape instead of a rectangle. Useful when
  picking out scattered parts.
- **Hop-over display** — crossing wires that aren't connected now draw as a
  little arc, so you can see at a glance whether two wires actually join.
- **Graphical DRC editor** — design rules without writing rule syntax.
- **Dark mode** on Windows, if you'd rather not be dazzled at midnight.

---

# PHASE 2 — Schematic (2–3 hours)

Open the `.kicad_sch` file. Everything below happens here.

## 7. Place the KB2040
`A` → search `KB2040` (Adafruit library) → place it left of centre.

No symbol? Use `Connector_Generic:Conn_01x12` twice instead, one per side, and
label the pins from the pinout diagram.

## 8. Place the nine switches
`A` → `Switch:SW_Push` → place one → `Ctrl+C`, `Ctrl+V` eight times.

Arrange them in a 3×3 block, roughly matching the physical layout. Schematic
position doesn't affect the board, but future-you will thank present-you.

References **SW1** to **SW9**. Set them now, not later.

## 9. Wire the switches
For each switch:
- Pin 1 → press `L`, type the GPIO name from your table, attach to the pin
- Pin 2 → press `P`, choose `GND`, attach to the pin

Nine switches, eighteen attachments. Tedious, ten minutes.

**No diodes. No resistors.** Every switch has its own pin — no matrix, nothing
to ghost. QMK turns on the chip's internal pull-ups.

## 10. Place the two encoders
`A` → `Device:Rotary_Encoder_Switch` × 2. References **ENC1**, **ENC2**.

**Not `Potentiometer`.** That was the mistake in the file you were sent. A pot
reports a position; an encoder reports rotation steps. Different part, wrong
behaviour, and the firmware won't work with it.

## 11. Wire the encoders
Per encoder, five pins:
- **A** → net label, your first encoder GPIO
- **B** → net label, your second encoder GPIO
- **C** (common) → `GND` power symbol
- **Switch pin 1** → net label, your third encoder GPIO
- **Switch pin 2** → `GND`

## 12. Optional — encoder debounce caps
Four × `Device:C`, value **100nF**. One from each encoder's A to GND, one from
each B to GND.

Cheap insurance against knob jitter. Skip if you want, add in revision 2 if
the knobs feel unreliable.

## 13. Power flags
`P` → `PWR_FLAG` → attach one to `GND`.

Without it ERC complains that your ground isn't driven by anything. It's a
KiCad formality, not a real circuit element.

## 14. Run ERC
Inspect → Electrical Rules Checker → Run.

**Get to zero errors before continuing.** Warnings about unconnected KB2040
pins are fine — mark the ones you're not using with the no-connect tool (`Q`).

## 15. Assign footprints
Tools → Assign Footprints.

| Symbol | Footprint |
|---|---|
| SW1–SW9 | `Switch_Keyboard_Hotswap_Kailh:SW_Hotswap_Kailh_MX_1.00u` |
| ENC1, ENC2 | `Rotary_Encoder:RotaryEncoder_Alps_EC11E-Switch_Vertical_H20mm` |
| KB2040 | Adafruit library, or any `Arduino_Pro_Micro` footprint |
| Caps (if used) | `Capacitor_SMD:C_0603_1608Metric` |

---

# PHASE 3 — PCB layout (2–3 hours)

## 16. Push the schematic across
Tools → Update PCB from Schematic (`F8`) → Update PCB.

Everything lands in a heap outside the board area. Normal.

## 17. Draw the board outline
Select the **Edge.Cuts** layer. Draw a rectangle **76 × 100mm**.

Round the corners 3mm if you want — nicer to hold, and 3D printed cases handle
rounded edges better than sharp ones.

**Stay under 100 × 100mm.** That's JLCPCB's cheapest bracket; crossing it costs
real money for no benefit.

## 18. Place the keys
Nine switches, 3×3, **19.05mm centre to centre**. Exactly — this is the MX
standard and your keycaps will not fit anything else.

Use Edit → Position Relative, or type coordinates directly. Do not eyeball it.

Centre the block horizontally. Top row about 22mm from the top edge.

## 19. Place the encoders
Below the keys, around **y = 80mm**, **24mm apart**, centred.

Check the knob diameter (25mm) doesn't overlap the bottom keycaps. Keycaps are
18mm square, so you need at least 22mm of clear space between key centre and
knob centre.

## 20. Place the KB2040
Top of the board, centred, **USB port facing the top edge**.

Its USB-C connector must sit at or slightly past the board edge so a cable can
reach it. Measure this twice — it's the single most common mechanical mistake.

## 21. Mounting holes
Four, 5mm in from each corner. 3.2mm drill for M3.

## 22. Route
Order matters:

1. **GND first** — Add Filled Zone on the back copper layer, cover the whole
   board, net `GND`, then `B` to fill
2. **Switch pins** — 0.25mm tracks, front layer, short routes
3. **Encoder pins** — same
4. Fill the ground zone again (`B`) after every change

You have maybe 20 nets. This is an easy board to route — that's the entire
point of using the module.

## 23. Silkscreen
Add `TAPTILE` on the front. Add `TP-09D2 REV A` on the back — you'll be glad
of the revision marking when you have three versions on your desk.

---

# PHASE 4 — Checks (1 hour, do not skip)

## 24. DRC
Inspect → Design Rules Checker → Run. **Zero errors.**

## 25. 3D view
`Alt+3`. Rotate it. Look for parts overlapping, hanging off the edge, or the
USB port buried inside the board.

## 26. Print it at 1:1
File → Print → scale 1.0. Put real keycaps on the paper. Check the spacing
feels right and the knobs aren't crowding the keys.

Costs nothing, catches things the screen hides.

## 27. Export
File → Fabrication Outputs → Gerbers (default settings are fine for JLCPCB) →
then Drill Files. Zip the whole output folder.

## 28. DFM check
Upload the zip to JLCPCB. Read **every** warning. Fix, re-export, re-upload.

---

# PHASE 5 — Order

- **5 boards fabbed, 2 assembled** — or 5 bare if you're hand-soldering the
  sockets, which is realistic at this part count
- ENIG finish, black mask, white silkscreen
- 3D print **2 cases**, not 5 — you'll revise the case after holding one

Then: flash the firmware from `firmware/taptile/mini`, plug it in, open
`/configurator`, and see if it lights up.
