# Taptile Mini HE — routing status

**Do not order this board yet.** The netlist is clean; the routing is not
finished. Detail below.

---

## What is verified correct

`validate_board.py` re-reads the finished file and checks it against the RP2040
datasheet from scratch — it does not import the generator's tables, so a bug in
the generator cannot hide by being self-consistent.

**0 errors, 1 warning.**

| Check | Result |
|---|---|
| All 6 IOVDD pins on +3V3, both DVDD on +1V1 | pass |
| TESTEN grounded, VREG_VIN/VOUT correct | pass |
| Thermal pad (57) on GND | pass |
| XIN/XOUT connected — board can boot | pass |
| CC1 and CC2 each with their **own** 5.1k | pass |
| No single-pad nets anywhere | pass |
| LED chain continuous D1 → D15 | pass |
| 9 Hall sensors, all outputs reach an ADC path | pass |
| No pad-to-pad clearance violations | pass |
| Every pad inside the board outline | pass |
| No courtyard collisions between parts | pass |

The one warning is the LED power budget, which is a firmware constraint, not a
board fault: 15 LEDs × 60 mA = 900 mA at full white against 500 mA from USB.
Cap global brightness at ~30%.

---

## Routing: 4 layers, ~88% done

The board moved from 2 layers to 4 during routing, and that was not a
preference — it was forced by geometry.

**A QFN-56 has 0.4 mm pitch, so the corridor between adjacent pads is 0.2 mm
wide.** A 0.25 mm trace with 0.2 mm clearance needs 0.65 mm. It does not fit,
and no router is clever enough to make it fit. The 2-layer attempt completed
**26 of 58 nets** and every single failure was a connection trying to escape
the RP2040.

Two changes fixed it:

* **0.15 mm track / 0.15 mm clearance.** JLCPCB's standard capability is
  0.127 mm, so this is inside spec with margin, not a stretch.
* **Dedicated GND and +3V3 planes** on the inner layers. Those are the two
  largest nets — 109 pads between them — and giving them planes replaces every
  one of those connections with a single via.

| | Result |
|---|---|
| Stackup | F.Cu / In1.Cu = GND / In2.Cu = +3V3 / B.Cu |
| Signal nets fully routed | **50 of 57** |
| Segments | 722 |
| Vias | 229 (includes a 3×3 array under the RP2040's thermal pad) |
| Copper to board edge | all ≥ 0.3 mm — pass |

Cost of going to 4 layers at JLCPCB is roughly USD$2 more for five boards this
size. You also get an unbroken ground plane directly beneath the USB pair and
all nine analog Hall lines, which matters more here than the money.

---

## What is left — 23 DRC errors and 7 connections

**7 unrouted connections**, left as ratsnest rather than bodged:

`ENC2_B`, `MUX_S1`, `MUX_S2`, `LED_12_13`, `USB_DM_C`, `RUN`, `+1V1`

**23 clearance violations**, concentrated in two places:

* **Around J1 (USB-C).** Its GND and +5V pads interleave at tight pitch, and
  the plane-via escapes crowd each other. Some of these are my checker being
  pessimistic — it approximates elongated pads as circles — but not all.
* **Under U1**, where QSPI and +1V1 escapes compete for the same channel.

### Finish it in KiCad, don't re-run the router

Open the board, and in the interactive router (default `X` to start a trace):

1. Run KiCad's own DRC first — it is authoritative and models pad shapes
   properly, so it will clear some of my 23 as false positives.
2. Fix the real violations by dragging traces; KiCad's push-and-shove will do
   most of the work.
3. Route the 7 remaining connections by hand. They are all short.
4. **Route USB_DP / USB_DM as a matched differential pair** — 90 Ω, tightly
   coupled, no vias, solid ground directly underneath. Do not let an
   autorouter near this; my router treated them as two ordinary signals, which
   is exactly wrong.
5. Refill the zones (`B`) and re-run DRC.

Realistically an hour or two of interactive work. The hard 90% — netlist,
placement, plane strategy, QFN escape — is done.

---

## Analog rules that still need honouring

These are not DRC-checkable and matter for whether the board works, not whether
it manufactures:

* Keep the nine `HALL*` traces away from `LED_DIN` and the USB pair. They are
  low-level analog signals; digital switching noise coupled into them shows up
  as jitter in the actuation point, which feels like a badly built keyboard.
* Give each Hall sensor a 100 nF decoupling cap close to it. Only the mux (C19)
  has one placed so far — add nine more during layout cleanup.
* Keep the 470 µF LED bulk cap (C20) near the USB connector, not near the LEDs.

---

## Files

| File | What it is |
|---|---|
| `Taptile_HE.kicad_pcb` | placed, netted, unrouted |
| `Taptile_HE_routed.kicad_pcb` | 4-layer, planes, 88% routed ← work from this |
| `he_routed_top.png` | render with traces (orange = F.Cu, blue = B.Cu) |
| `NETLIST_HE.md` | every net and what is on it |
| `validate_board.py` | independent netlist audit |
| `drc_check.py` | geometric clearance check |
| `route_board4.py` | the router |
