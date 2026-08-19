# What to know while you're building it

Read this alongside BUILD_STEPS.md. That document tells you what to click.
This one tells you why, and what it looks like when it's going wrong.

---

## The one idea that makes KiCad make sense

**The schematic is the truth. The PCB is a consequence.**

You never connect things on the PCB. You connect them in the schematic, press
`F8`, and the PCB learns about it. The thin lines you see on the board
(ratsnest) are KiCad saying "the schematic says these should be joined, and
they aren't yet."

If two things aren't connected on the board, the fix is almost always in the
schematic, not the board.

**This is why the file your cofounder sent had no copper.** The schematic was
empty, so the PCB had nothing to connect. Not a mistake in the layout — a
missing source.

---

## Net labels: the thing that makes this easy

Beginners draw wires everywhere and end up with spaghetti.

Instead: press `L`, type a name, stick it on a pin. **Any two pins with the
same label are connected.** No wire needed. They can be on opposite sides of
the sheet.

So a switch is: label `GP4` on one pin, `GND` symbol on the other. Done. Two
clicks, no wires, and you can read it in six months.

**Watch for:** typos. `GP4` and `GP04` are two different nets, and KiCad won't
warn you — it'll just quietly not connect them. Copy-paste your labels rather
than retyping.

---

## Reference designators — do them as you go

`SW1`, `ENC2`, `C4`. Set them when you place the part.

If you leave them as `REF**` you'll end up with a board where you can't tell
which switch is which, and when JLCPCB asks which component goes where, you
won't be able to answer. (The file you were sent had 14 parts still on
`REF**`.)

---

## 19.05mm is not approximately 19mm

MX keycaps are made to a 19.05mm grid. Not 19. Not 19.1.

Over a 3-key row, a 0.05mm error is invisible. Over a full keyboard it's
1.5mm and the caps foul each other. Get in the habit now: **type coordinates,
never drag by eye.**

Edit → Position Relative is your friend. Place the first switch, then place
each subsequent one exactly 19.05mm from the last.

---

## The USB port is where mechanical designs die

The KB2040's USB-C connector must be reachable by a cable. That means it sits
at, or slightly proud of, the board edge — and the case needs a hole in
exactly the right place.

Measure it in the 3D viewer. Then print the board at 1:1 on paper, hold the
module against it, and check a real cable reaches.

**People discover this after the boards arrive.** It's the most expensive
five minutes you can skip.

---

## Ground pour, and why you fill it twice

A ground zone is a sheet of copper covering the empty space, connected to GND.
It gives every ground connection a short path back, which is most of what
"good layout" means at this scale.

Draw it on the back layer covering the whole board. Press `B` to fill.

**Then press `B` again every time you move something.** The zone doesn't
update itself. A board that looks poured but wasn't refilled has gaps you
can't see until it's manufactured.

---

## Track widths

- **0.25mm** — switches, encoders, anything carrying almost no current
- **0.4mm** — power and ground
- **Default via** — fine, don't think about it

You're carrying milliamps. This board is electrically trivial. Don't
over-engineer it.

---

## What ERC and DRC actually catch

**ERC** (schematic) finds: pins connected to nothing, two outputs fighting
each other, power nets with no source. Run it before you touch the PCB.

**DRC** (board) finds: tracks too close, unrouted connections, parts
overlapping, things outside the board edge.

**Both must be zero errors.** Warnings you can judge. Errors you fix.

The "input power pin not driven" error is KiCad being pedantic — attach a
`PWR_FLAG` to GND and it stops.

---

## Print it on paper before you order

File → Print → scale **1.0**. Put actual keycaps on the printout.

You'll immediately see whether the spacing feels right, whether the knobs
crowd the bottom row, whether the whole thing is the size you imagined. A
screen lies about scale; paper doesn't.

Free, two minutes, and it has saved more prototype runs than any other habit.

---

## Expect revision A to be wrong

It will be. Everyone's first spin has something — a footprint mirrored, a
connector 2mm off, a pin swapped.

This is why you order 5 and assemble 2, and why you print 2 cases instead of
5. Finding the mistake is the *purpose* of the first run, not a failure of it.

Mark the silkscreen `REV A` so that when you have three boards on the desk you
know which is which.

---

## A KiCad 10 detail that will help you

Crossing wires now draw with a small arc where they *don't* connect
("hop-over"). So a plain crossing means joined, an arc means passing over.

Previously you had to hunt for junction dots. Now you can see it. Use it —
glance over your schematic before ERC and check every crossing looks how you
intended.

---

## When you get stuck

**Compare against something that works.** Open the Adafruit KB2040 files, or
any published macropad on GitHub, side by side with yours.

Copying a proven layout isn't cheating. It's why professional boards boot
first time — nobody reinvents the power section.

---

## The order of operations, memorised

1. Schematic
2. ERC clean
3. Footprints assigned
4. `F8` to push to PCB
5. Outline
6. Place
7. Route
8. Pour and fill
9. DRC clean
10. 3D view
11. Paper print
12. Gerbers
13. DFM check
14. Order

Skipping steps doesn't save time. It moves the time to after you've spent
money, where it costs six weeks instead of an hour.
