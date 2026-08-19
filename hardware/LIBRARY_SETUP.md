# Installing the libraries KiCad doesn't ship

You need two things that aren't in the stock install:

1. **KB2040** symbol and footprint (Adafruit)
2. **Kailh hot-swap socket** footprints (kiswitch)

Do this once. Windows paths shown; Mac/Linux is the same idea.

---

## Understand this first, or nothing will make sense

KiCad splits libraries in two, and they install differently:

| | What it is | File type |
|---|---|---|
| **Symbol** | The schematic drawing — a box with named pins | A single `.kicad_sym` file |
| **Footprint** | The physical pads on the board | A `.pretty` **folder** |

You add symbols and footprints in **two separate dialogs**. Doing only one is
the most common reason a part "still doesn't show up".

---

## Route A — try the Plugin and Content Manager first

KiCad 10: **Tools → Plugin and Content Manager → Libraries tab**.

Search there for `keyswitch`, `kiswitch`, `Adafruit`. If either appears, click
Install and you're done — it handles paths for you.

If they're not listed, use Route B.

---

## Route B — manual install

### Step 1: make a home for them

Create a folder you won't accidentally delete:

```
C:\Users\Admin\Documents\KiCad\libraries\
```

**Not Downloads.** KiCad links to these files by path forever — if you clear
Downloads later, every part on your board breaks.

### Step 2: download both

**Adafruit** — https://github.com/adafruit/Adafruit-KiCad-Libraries
Green **Code** button → **Download ZIP**

**kiswitch** — https://github.com/kiswitch/kiswitch
Same. Green **Code** → **Download ZIP**

Extract both into the folder from step 1. You should end up with something like:

```
C:\Users\Admin\Documents\KiCad\libraries\Adafruit-KiCad-Libraries-master\
C:\Users\Admin\Documents\KiCad\libraries\kiswitch-main\
```

### Step 3: add the symbols

KiCad → **Preferences → Manage Symbol Libraries** → **Global Libraries** tab

Click the **folder+ icon** (Add existing library to table), then browse to and
select the `.kicad_sym` files:

- In the Adafruit folder, look for something like `Adafruit.kicad_sym` or a
  `symbols` subfolder containing it
- Add every `.kicad_sym` you find

Click **OK**.

### Step 4: add the footprints

KiCad → **Preferences → Manage Footprint Libraries** → **Global Libraries**

Same icon, but this time you're selecting **folders ending in `.pretty`**, not
files.

In kiswitch, look for folders like:

```
Switch_Keyboard_Hotswap_Kailh.pretty
Switch_Keyboard_Cherry_MX.pretty
```

Add at minimum `Switch_Keyboard_Hotswap_Kailh.pretty`. Add the others too —
they cost nothing and you may want them later.

In the Adafruit folder, add any `.pretty` folders you find.

Click **OK**.

### Step 5: restart KiCad

Fully close it and reopen. Library tables are read at startup — this catches
a lot of people out.

### Step 6: check

Open the schematic editor, press `A`, search `KB2040`. It should appear.

Open the PCB editor, press `A` (add footprint), search `Hotswap`. You should
see the Kailh sockets.

---

## If KB2040 still isn't there

It genuinely might not be. Adafruit's library coverage is patchy and the
KB2040 is a relatively niche board.

**This does not block you.** The KB2040 is electrically just a row of pads —
you don't need a fancy symbol.

### The fallback that always works

**Symbol:** place two `Connector_Generic:Conn_01x12`. One represents the left
row of pads, one the right. Label each pin with the GPIO from your pinout
table. Functionally identical to a "real" KB2040 symbol.

**Footprint:** the KB2040 is Pro Micro form factor. Search the footprint
browser for:

- `Pro_Micro`
- `ProMicro`
- `Arduino_Pro_Micro`
- `2x12` (two rows of twelve, 2.54mm pitch, 17.78mm apart)

Any of those fit. If nothing turns up, `Connector_PinHeader_2.54mm:PinHeader_2x12_P2.54mm_Vertical`
is dimensionally correct — 2 rows, 12 pins, 2.54mm spacing.

**Measure your actual module against the footprint in the 3D viewer before
ordering.** Ten seconds, and it's the difference between a board that fits and
one that doesn't.

---

## Sanity check before you move on

- [ ] `KB2040` (or your fallback connector) findable in the symbol browser
- [ ] `SW_Hotswap_Kailh_MX_1.00u` findable in the footprint browser
- [ ] `RotaryEncoder_Alps_EC11E` findable — this one ships with KiCad
- [ ] KiCad restarted since adding them

All four ticked and you're ready for Phase 2.
