# Taptile Mini firmware

QMK firmware for the 9-key, 2-encoder board. RP2040, direct-pin wiring, no
diodes.

## The one line that matters

`rules.mk` sets `VIA_ENABLE = yes`. That enables the VIA command set, which is
the protocol `src/lib/via/protocol.ts` speaks. Set it and the configurator
works; leave it out and the configurator connects to silence.

It is not the same as `RAW_ENABLE`. RAW_ENABLE opens the pipe with nothing
listening. VIA_ENABLE opens the pipe *and* answers.

## Pin map

Hand this to whoever draws the schematic.

| Function | RP2040 pin |
|---|---|
| Key 1 | GP0 |
| Key 2 | GP1 |
| Key 3 | GP2 |
| Key 4 | GP3 |
| Key 5 | GP4 |
| Key 6 | GP5 |
| Key 7 | GP6 |
| Key 8 | GP7 |
| Key 9 | GP8 |
| Encoder 1 A | GP9 |
| Encoder 1 B | GP10 |
| Encoder 1 push | GP11 |
| Encoder 2 A | GP12 |
| Encoder 2 B | GP13 |
| Encoder 2 push | GP14 |

Every switch goes to its own pin and to ground. QMK enables the internal
pull-ups, so no external resistors and **no diodes** — 15 pins used of 26
available, so there is no matrix and therefore no ghosting.

Also needed on the board, not in this table: BOOT button (to `QSPI_SS` via
resistor, per the RP2040 hardware design guide), RESET button (to `RUN`),
12MHz crystal, W25Q16 flash, 3.3V regulator, USB-C with the standard 5.1k CC
pulldowns and 27R series resistors on D+/D-.

## Building it

```bash
git clone https://github.com/qmk/qmk_firmware.git
cd qmk_firmware
qmk setup
# copy this folder to keyboards/taptile/mini
qmk compile -kb taptile/mini -km via
```

Produces `taptile_mini_via.uf2`.

## Flashing

Hold BOOT, plug in USB, release. The board appears as a USB drive. Drag the
`.uf2` onto it. It reboots into the firmware.

## First test, in order

1. Board enumerates as "Taptile Mini" in your OS device list
2. Every key registers — test in a text editor
3. Both encoders turn cleanly, one action per detent (if it fires four times,
   `ENCODER_RESOLUTION` in `config.h` is wrong)
4. Both encoder buttons work
5. Open https://usevia.app — the board should be detected
6. Open our own configurator at /configurator — the layout should load
7. Remap a key, unplug, replug, confirm the change survived

Step 7 is the one that proves it. Anything less and the change only lived in
the browser.

## VIA definition

`taptile_mini.json` is the layout definition for the official VIA app. Our own
configurator does not need it — it reads keycodes by row and column directly —
but it is required if you want the board to work in usevia.app, which is a
useful independent check that the firmware is correct.

Submit it to the VIA keyboards repo once the vendor and product IDs are final.

## Before production

The VID/PID in `keyboard.json` is `0xFEED/0x0001` — QMK's placeholder range.
Fine for prototypes. For anything sold, get a real USB vendor ID or use a
recognised community allocation, otherwise you risk colliding with another
device on a customer's machine.
