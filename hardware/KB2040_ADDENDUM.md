# Building on the Adafruit KB2040

Read this instead of steps 1–6 of SCHEMATIC_GUIDE.md. The module already
contains everything those steps were building.

## What the module replaces

Delete all of this from your parts list:

- RP2040 QFN chip
- W25Q16 flash
- 12MHz crystal + its two 27pF caps + 1k series resistor
- 3.3V regulator + its caps
- All ten 100nF decoupling caps
- USB-C connector, its 5.1k CC resistors, 27R series resistors, ESD diode
- BOOT and RESET buttons

That's roughly 30 parts and the entire high-risk section of the design gone.
The KB2040 has USB-C, BOOT and RESET on the module itself.

## What's left on your board

Genuinely just:

- 1 × KB2040 (mounted on castellated pads or through-hole headers)
- 9 × Kailh MX hot-swap sockets
- 2 × EC11 rotary encoders
- 4 × M3 mounting holes

Optionally 4 × 100nF across the encoder A/B pins for hardware debounce.

## The schematic

**Symbol:** KiCad 8 may not ship a KB2040 symbol. Two options — use
`Connector_Generic:Conn_01x12` twice (one per side) and label the pins
yourself, or install Adafruit's KiCad library from
https://github.com/adafruit/Adafruit-KiCad-Libraries

**Footprint:** the KB2040 is Pro Micro form factor, so any
`ProMicro`/`Arduino_Pro_Micro` footprint fits — 2 rows of 12 castellated pads
on 2.54mm pitch, 17.78mm apart.

Mount it **castellated, flat against the board**. Cheaper, thinner, and your
case stays low. Headers add 8mm of height for no benefit here.

## Pin assignment — do this before drawing anything

**You need 15 pins: 9 for keys, 6 for encoders.**

Open https://learn.adafruit.com/adafruit-kb2040/pinouts and write down the
GPIO number printed beside each castellated pad. They are NOT GP0 through
GP14 in order — the board is Pro Micro shaped, so the numbering jumps.

Then pick 15 of them and record which is which:

| Function | KB2040 pad label | GPIO number |
|---|---|---|
| Key 1 | | |
| Key 2 | | |
| Key 3 | | |
| Key 4 | | |
| Key 5 | | |
| Key 6 | | |
| Key 7 | | |
| Key 8 | | |
| Key 9 | | |
| Encoder 1 A | | |
| Encoder 1 B | | |
| Encoder 1 push | | |
| Encoder 2 A | | |
| Encoder 2 B | | |
| Encoder 2 push | | |

**Two rules when choosing:**

1. **Avoid the STEMMA QT pins** unless you need them — they're on a connector,
   not the edge pads, and are awkward to route to.
2. **Keep each encoder's A and B pins adjacent** where you can. Not electrically
   required, just makes routing tidier.

Fill that table in and send it to me. I'll update `keyboard.json` so the
firmware matches your board exactly.

**Do not draw the schematic before this is settled.** Changing pin assignments
afterwards means redoing every net label.

## What changes in the firmware

Only the `matrix_pins.direct` and `encoder` blocks in
`firmware/taptile/mini/keyboard.json`. Everything else — VIA_ENABLE, the
keymap, the layers — is unaffected, and the configurator doesn't care which
physical pins you used.

## The cost of this choice

KB2040 is about US$10 retail, versus roughly US$1.50 for the bare chip and its
supporting parts. At 5 prototypes that's $50 instead of $8, and worth every
cent for not having a dead board.

At 500 units it's $5,000 instead of $750, so you respin with the chip down
before production. Same pin map, same firmware, same configurator — you're
just moving the parts onto your own board once you know the design works.
