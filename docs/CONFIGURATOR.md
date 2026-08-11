# The configurator

A browser-based key remapper at `/configurator`. No download, no install — the
page talks to the keyboard over USB using WebHID.

## Status: untested against hardware

The protocol layer was written from the VIA specification. **Nobody has run it
against a real keyboard yet.** It typechecks and builds, and the interface works
in demo mode, but the parts that touch hardware are unverified.

Do not put "works with your keyboard" on the product page until the checklist
below passes.

## How it works

```
browser  ──WebHID──▶  keyboard
   │                      │
   └── 32-byte VIA ───────┘
       command reports
```

VIA-compatible boards expose a raw HID interface on usage page `0xFF60`,
usage `0x61`. We send a 32-byte report where byte 0 is the command; the board
replies on the same interface. Remaps are written to the keyboard's own memory,
so they persist when it is unplugged and moved to another computer.

Nothing goes to a server. No layouts are uploaded, nothing is stored.

- `src/lib/via/protocol.ts` — connect, read, write, reset
- `src/lib/via/keycodes.ts` — the action catalogue and QMK keycode values
- `src/pages/Configurator.tsx` — the interface

## Browser support

WebHID is Chromium-only: **Chrome, Edge, Opera, Arc**. Not Firefox, not Safari.
The page detects this and explains rather than failing silently.

This matters commercially: Safari is the default browser on every Mac. Mac
customers will need to install Chrome, or you ship a desktop app later.

## Testing checklist — do this when the sample arrives

Work through in order. Stop at the first failure; each step depends on the one
before.

1. **Does it appear at all?** Open `/configurator` in Chrome, click *Connect
   keyboard*. If your board is not in the picker, it does not expose the VIA raw
   HID interface and none of the rest will work. See "If it isn't VIA" below.

2. **Does it report a protocol version?** On connect the status line should show
   something like `VIA protocol 9`. If you get "answered, but not with a VIA
   protocol version", it is a different device on the same usage page.

3. **Does the layout load?** The grid should fill with the board's *current*
   keys, not "empty". If everything reads empty or garbage, the matrix size is
   wrong — try the other layout options in the dropdown.

4. **Does a write stick?** Assign *Volume up* to one key. Press it. Then unplug
   the keyboard, plug it back in, and press it again. It must still work — that
   proves it wrote to the board's memory rather than just the screen.

5. **Does reset work?** *Reset to factory* should restore the original keys.

6. **Check the keycodes.** Assign each item in the Editing group and confirm it
   does what the label says. The values are standard QMK, but boards with
   protocol 9+ sometimes remap them. Anything wrong can be fixed in
   `keycodes.ts`, and the raw-hex box lets you experiment without a code change.

## If it isn't VIA

Most likely outcome for a cheap generic macropad. Your options, worst to best:

- **Ship the vendor's software.** Usually Windows-only and ugly, but zero work.
- **Ask the vendor for QMK/VIA firmware.** Many factories offer it if asked;
  some will flash it for a small per-unit fee. Ask before you order in volume.
- **Flash VIA-compatible firmware yourself.** Only viable if the board uses a
  supported microcontroller.

Ask the vendor this before committing to stock:

> Does this keyboard run QMK firmware with VIA support enabled? If not, can you
> supply it with QMK/VIA firmware?

## Licensing

If you end up shipping QMK-derived firmware, QMK is GPLv2 — you are required to
publish your firmware source. That is normal in this industry and not a problem,
but it is a decision to make deliberately rather than discover later.
