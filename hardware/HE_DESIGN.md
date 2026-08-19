# Taptile Mini HE — design notes

Hall effect build. 9 magnetic switches, 2 encoders, 15 addressable LEDs, bare
RP2040. 70 × 120 mm, 2-layer.

**69 components · 59 nets · 259 connected pads · no orphan nets · no courtyard
collisions.**

---

## The thing that drove every other decision

A magnetic switch has no electrical contacts. It is a magnet in a plastic
housing. The "2 pin" in the listing is two plastic alignment legs, not pins.

All sensing happens on the PCB: a **linear Hall sensor sits under each key** and
reports the magnet's distance as a voltage. Three consequences:

**The board is plate-mount, with no switch holes at all.** An MX footprint puts
a 4 mm stem hole exactly where the sensor has to go. So the PCB is flat under
the keys, and a plate above it holds the switches. This is why the 3D view looks
so bare compared to the MX version — the switches aren't on the board, they're
in the plate above it.

**Hot-swap is free.** Nothing is soldered to the switch. It clips into the
plate and pulls straight out. No Kailh sockets, no cost, no extra solder step.
This is the one place magnetic switches are strictly simpler than MX.

**Nine analog readings, four ADC channels.** The RP2040 has ADC on GPIO26–29
only. A **CD74HC4051** 8-channel analog mux (U4) carries keys 1–8 into ADC0;
key 9 goes straight to ADC1. Cheaper and smaller than a 16-channel part, and it
costs three GPIO for the select lines.

---

## Pin map

| Function | RP2040 |
|---|---|
| Mux select S0 / S1 / S2 | GPIO2 / GPIO3 / GPIO4 |
| Mux common → keys 1–8 | GPIO26 (ADC0) |
| Key 9 sensor, direct | GPIO27 (ADC1) |
| LED data out | GPIO16 |
| ENC1 A / B / push | GPIO6 / GPIO7 / GPIO8 |
| ENC2 A / B / push | GPIO9 / GPIO10 / GPIO11 |

Sensors are **DRV5055A4** (SOT-23): pin 1 VCC, pin 2 GND, pin 3 analog out.
A 49E is the cheap substitute if sourcing is easier — same package, same pinout,
worse linearity.

---

## LEDs and the power budget

15 × **SK6812MINI**: 9 under the keys, 6 around the edge for underglow.

SK6812 rather than WS2812B because its data threshold copes better with 3.3 V
logic. A **74AHCT1G125** (U5) still shifts the line to 5 V — "usually works" is
not something to ship — with R8 (470 Ω) in series to damp reflections.

**The number that matters: 15 LEDs × 60 mA = 900 mA at full white, against
500 mA available from USB.**

Firmware **must** cap global brightness. At 30% you are around 270 mA, which is
comfortable. C20 (470 µF) absorbs the switching transients. This is not
optional — an uncapped animation will brown out the RP2040 and the board will
reset mid-use, which reads as a firmware bug and is very unpleasant to debug.

This is why the count came down from 36. Four LEDs per key would have been
2.16 A, over four times the budget.

---

## Firmware — read this before writing any

**Mainline QMK has no Hall effect support.** Keychron's HE boards run a QMK
*fork*. Their keyboards do ship VIA — but VIA only does keymapping. Actuation
point and rapid trigger go through Keychron's own Launcher, because the VIA
protocol has no concept of an analog key.

So for Taptile:

- **Keymapping** can stay on VIA, which `src/lib/via/protocol.ts` already speaks.
- **Every analog feature is a protocol you invent.** Per-key actuation point,
  rapid trigger sensitivity, dead zone, calibration curves — none of it exists
  in any standard.

That is real work, and it is also the most valuable thing here. Nobody has a
good browser-based rapid-trigger configurator. Everyone ships a Windows `.exe`.
"Set your actuation point in a browser tab, nothing to install" is a far
sharper pitch than "programmable macropad", and it is defensible in a way the
hardware never was.

### Calibration is not optional

Every magnet and every sensor varies. On first boot the firmware must record
each key's rest voltage and fully-pressed voltage, then work in normalised
units. Skipping this gives keys with visibly different actuation points, and it
is the single most common complaint about cheap HE boards.

---

## 3D printing

**Translucent PETG or PCTG is ideal as a diffuser.** Bambu can't print
optically clear, but the layer lines frost the light, which is exactly what you
want over an RGB LED. This is a genuinely good use of the printer.

**Don't print keycaps.** HE switches use standard MX stems, so bought caps fit.
An FDM-printed 1.17 mm stem cross wears out fast and prints inconsistently.

**Do print the plate.** It is the part that holds the switches, and it needs
14 × 14 mm cutouts on a 19.05 mm grid — trivial to print, and it is what makes
hot-swap work. Print it in something stiff; PLA is fine, PETG better.

---

## What is not done

**No copper routing.** Nets are assigned; traces are not drawn. Ground pour
first, then power, then USB as a 90 Ω differential pair, per
`RP2040_LAYOUT_RULES.md`.

**Two analog rules to add to those:** keep the nine `HALL*` traces away from the
LED data line and the USB pair — they are low-level analog signals and will pick
up digital switching noise as jitter in the actuation point. Give each sensor a
100 nF decoupling cap close to it when routing; only the mux's C19 is placed so
far.
