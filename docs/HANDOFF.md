# Taptile — handoff

**Written 19 August 2026.** Everything a new conversation needs to pick this up.
Read this first; the other docs in `docs/` and `hardware/` are the detail.

---

## 1. Who and what

**Palasi** (Auckland, NZ) and cofounder **Jenil** are building **Taptile** — a
programmable mini macropad. `trytaptile.com`. Pre-launch: waitlist is live, no
batch ordered, no capital committed. Stated budget **NZ$500**.

**Current product definition:**

> 9 MX switches in a 3×3 grid, 2 rotary encoders with push, 15 RGB LEDs,
> Adafruit KB2040 module, 70 × 120 mm two-layer PCB, 3D-printed case.

**The strategic position, which matters more than the hardware:** you cannot win
on price. Finished 9-key macropads are NZ$25–40 delivered on AliExpress; your
landed cost at 100 units is ~NZ$37. That gap never closes at your scale.

What you own that they don't is a **browser-based VIA configurator** —
`/configurator`, WebHID, no install. Five separate suppliers refused to disclose
what chip was in their boards or support open firmware, and they all ship
Windows-only `.exe` configurators. **Position above the cheap boards on
software, not below them on price.**

---

## 2. Where things stand

| Area | State |
|---|---|
| Website | Live on Vercel, storefront + auth + waitlist + configurator |
| Waitlist | Supabase, RLS-protected, confirmation email working via Resend |
| Updates/devlog | Built this session, Supabase-backed, admin editor at `/admin/updates` |
| Configurator | VIA over WebHID, keymapping only |
| PCB | Placed, netted, ~90% routed. **Not ready to order.** |
| Firmware | `keyboard.json` written, never flashed to hardware |
| Case | Jenil printed v1. Details unknown to me. |
| Suppliers | 6 contacted. KINGSTAR (Nancy Chen) is the live thread. |

**Nothing has been ordered. Nothing has been physically tested.**

---

## 3. The hardware, and why it is what it is

Three boards were built this session. **`Taptile_MX_routed.kicad_pcb` is the
one to use.** The other two are dead ends, kept for reference.

| Design | Layers | Parts | Routed | DRC | Verdict |
|---|---|---|---|---|---|
| Bare RP2040 | 4 | 48 | 50/57 | 23 errors | Premature |
| Hall effect | 4 | 69 | 50/57 | 23 errors | Abandoned |
| **MX + KB2040** | **2** | **39** | **31/35** | **2 errors** | **Current** |

### Why the module and not the bare chip

Costed against the real files: **NZ$80/unit at prototype scale for the bare
chip vs NZ$41 for a module**, because the bare chip carries ~NZ$35/unit of
one-off JLCPCB fees and forces 4 layers plus mandatory machine assembly. At 100
units they are within 1% of each other. **The bare chip only wins well past
100 units.**

### Why 2 layers now and 4 before

A QFN-56 has 0.4 mm pitch, so the corridor between adjacent pads is 0.2 mm. A
0.25 mm trace with 0.2 mm clearance needs 0.65 mm. It does not fit — that is
geometry, not router quality. Dropping the QFN is what makes two layers work.

### Why MX and not Hall effect

Hall effect was built and then reverted on Palasi's instruction. Worth knowing
what it cost: magnetic switches have **no electrical contacts**, so the PCB
needs a linear Hall sensor under every key plus an analog mux (the RP2040 has
only 4 ADC channels for 9 keys). And **rapid trigger is not part of the VIA
protocol** — Keychron ships a QMK fork plus their own Launcher for exactly this
reason. Going HE meant inventing a protocol. Going back to MX means plain QMK
with `VIA_ENABLE` and the existing configurator works unchanged.

If HE is ever revisited, `hardware/HE_DESIGN.md` has the full analysis.

### Pin map — this must match the firmware

| Function | KB2040 GPIO |
|---|---|
| Keys SW1–SW9 | GP0–GP8 |
| ENC1 A / B / push | GP9 / GP10 / GP18 |
| ENC2 A / B / push | GP19 / GP20 / GP26 |
| LED data | GP27 |
| Spare | GP28, GP29 |

`firmware/taptile/mini/keyboard.json` already matches this. **If one changes,
change both** or the configurator maps keys to the wrong buttons.

### Gotchas that cost real time — do not rediscover these

- **The 2020-era MX footprint puts its origin on pad 1, not the switch centre.**
  Centre stem hole is at (−2.54, 5.08). Placing at grid coordinates directly
  sits every key 2.54 mm left and 5.08 mm low — a whole key grid visibly
  off-centre in the case. `build_mx_board.py` compensates via `SW_ORIGIN_OFF`.
- **A web search gave the wrong RP2040 pinout** (QSPI_SD0 on pin 49, QSPI_SCLK
  on 50 — those are actually IOVDD and DVDD). Building from it would have
  shorted the flash bus to power. Pin numbers came from the official product
  brief instead.
- **BOOT is not broken out on a KB2040.** Use QMK's `QK_BOOT` keycode. RESET is
  broken out, and there is a button for it on the board.
- **15 LEDs × 60 mA = 900 mA at full white, against 500 mA from USB.** Firmware
  must cap global brightness. ~30% is safe. Uncapped, the board browns out
  mid-animation and it looks like a firmware bug.

---

## 4. Hardware toolchain — all of it runs in the sandbox

No KiCad needed. `hardware/`:

| Script | Does |
|---|---|
| `build_mx_board.py` | **Current board.** Emits placed + netted `.kicad_pcb` |
| `route_board.py` | 2-layer A* router + GND pour |
| `route_board4.py` | 4-layer variant with GND/+3V3 planes |
| `drc_check.py` | Independent clearance/annular/connectivity check |
| `validate_board.py` | Independent netlist audit against the datasheet |
| `render_board.py` | PCB top view + isometric 3D, to SVG/PNG |

Footprints come from a shallow clone of `github.com/KiCad/kicad-footprints`
into `/tmp/kfp` (GitLab is blocked by the sandbox proxy). That mirror is frozen
at 2020 and uses the legacy `(module ...)` format, which is **why the board
files are in legacy format** — library footprints paste in verbatim rather than
being converted construct-by-construct. KiCad 10 opens them and upgrades on
save.

`drc_check.py` and `validate_board.py` deliberately do **not** import the
builder's tables. They re-read the finished file, so a bug in the generator
cannot hide by being self-consistent. This caught several real errors.

### To finish the board

1. Open `Downloads/Taptile MX Build/Taptile_MX_routed.kicad_pcb`
2. Run **KiCad's own DRC** — it is authoritative and models pad shapes properly
3. Fix the 2 clearance conflicts and route the 5 remaining connections by hand
   (all in the LED/+5V cluster, top-left). ~20 minutes.
4. Refill zones, re-run DRC, export Gerbers, run JLCPCB's DFM check
5. Order **2 boards, not 5.** There will be a revision.

`hardware/ROUTING_STATUS.md` has the specifics.

---

## 5. Money

| | Prototype (2 units) | At 100 units |
|---|---|---|
| Board subtotal | NZ$41 | NZ$15 |
| Keycaps, knobs, printed parts, screws | NZ$22 | NZ$17 |
| **Per unit** | **~NZ$63** | **~NZ$37** |

Two prototypes ≈ NZ$130, comfortably inside the NZ$500.

**The 3D printing does not scale.** Case plus plate is ~2 hours per unit. 100
units is 200+ hours. Fine for the first 20–30, a hard wall after that.
Injection tooling is USD$1,500–5,000 when you get there.

---

## 6. Website

React 18 + TypeScript + Vite + react-router-dom + Tailwind. Supabase for auth
and data. Deployed on Vercel under the **Provio** account (deliberate — one
account, two projects).

Tailwind tokens: `bg-ground` #0b0a0a, `accent` #ec3013, `font-heading` Archivo
800. Reuse `.btn-primary` / `.btn-secondary` / `.card` from `src/index.css`.

### Development updates — built this session

Posts live in the Supabase **`updates`** table, not markdown files. They started
as markdown in git, but a browser cannot commit to a repo, so an editable admin
UI needs a database. `src/content/` was deleted — one source of truth.

- `/updates`, `/updates/:slug` — public, published posts only
- `/admin/updates` — create, edit, delete, publish toggle
- `src/lib/updates.ts` — data layer, both public and admin

**Security is in the database, not the UI.** The public RLS policy only returns
`published = true`; the admin policy calls the same `is_admin()` the waitlist
uses. Verified: anon sees 0 posts, `is_admin()` false, anon INSERT refused.

**A bug worth remembering:** Postgres evaluates *every* applicable policy on a
SELECT, so anonymous visitors were calling `is_admin()` and getting `permission
denied for function` — which would have broken `/updates` for every logged-out
visitor. Fixed by granting EXECUTE to `anon`. The waitlist never exposed this
because anon goes through a SECURITY DEFINER RPC there and never selects the
table directly.

### Admin access

`taptile.admin@gmail.com` **is already on the admin allowlist** in the `admins`
table. But **no auth account exists for it yet** — the only signed-up user is
`siajoe357@gmail.com`. Sign up at `/login` with that address and confirm the
email; admin turns on automatically.

Supabase project: `jjndhbyawnbohobjwzue`.

---

## 7. Open items

**Blocking, do first:**

- [ ] **Commit and push.** Nothing from this session is in git — all of
      `hardware/`, `firmware/`, `docs/SOURCING_HANDOFF.md`, and the four new
      `src/` files are untracked. Last commit is 6 days old.
- [ ] Sign up as `taptile.admin@gmail.com` to activate admin
- [ ] Drop the case photo at `public/updates/case-v1.jpg`
- [ ] Fill in the seeded draft post — it is a skeleton with placeholders, not
      content. **Do not publish the version an AI wrote**; it invented the print
      time, material and which parts failed, and said six switches when there
      are nine.

**Website accuracy — this is a Fair Trading Act exposure:**

- [ ] The site claims **"hot-swappable"** in 8 places (`Landing.tsx` 348, 435,
      108; `catalog.ts` 62/90/118, 70/100/128). The board is **direct-solder by
      choice**. Either change the copy or add ~NZ$5 of Kailh sockets.
- [ ] The site claims **"Windows, macOS, Linux"**. The configurator uses WebHID,
      which **Firefox and Safari do not support**. Needs a browser qualifier,
      not an OS one.

**Infrastructure:**

- [x] Contact address is now `hello.taptile@gmail.com` — a real Gmail inbox, so
      the dead-address problem is gone. `hello@trytaptile.com` stays as the
      Resend **sender** only (a gmail.com From would fail SPF/DKIM and land in
      spam); the edge function sets `reply_to` to the Gmail address.
- [ ] Business cards still print `hello@trytaptile.com` — either reprint or set
      up Cloudflare Email Routing to forward it to the Gmail.
- [ ] Remove `propalasi80-debug` as a repo collaborator
- [ ] Supabase Site URL → `https://www.trytaptile.com`

**Product:**

- [ ] Add VIA RGB Matrix commands to `src/lib/via/protocol.ts` so the
      configurator can drive the 15 LEDs. Currently keymapping only.
- [ ] Decide a vertical. `docs/SOURCING_HANDOFF.md` argues the generic
      positioning describes everyone and therefore no one, and that the waitlist
      is a free demand test for 2–3 landing page variants.
- [ ] KINGSTAR (Nancy Chen) — she answered none of the 8 questions and sent a
      company profile. Likely never saw the message; Alibaba threads inquiries
      separately. Re-send **three** questions: what MCU, does it do VIA/QMK, are
      you the factory.

---

## 8. Working notes

- Palasi is new to KiCad and electronics. Explain in plain language, avoid
  jargon without a gloss, and **do the work rather than handing over
  instructions** — that has been an explicit and repeated request.
- He asks for things to be done "on the cloud" — meaning in the sandbox, not by
  driving his laptop. Driving KiCad's GUI via computer use was slow and
  error-prone; generating files directly worked far better.
- When he says "you choose", choose, and say why in one line.
- Prefer being told a number is wrong over being told a plan sounds good.
  Several real defects this session were found by checking rather than assuming:
  the datasheet pinout, the footprint origin, the RLS policy evaluation.

---

## 9. Map of the files

```
Keyboard APP/
  src/                     the website
    lib/updates.ts         devlog data layer (Supabase)
    lib/via/               WebHID VIA protocol
    pages/AdminUpdates.tsx post editor
  firmware/taptile/mini/   QMK config — keyboard.json is the pin map
  hardware/                board generators, router, DRC, renderer
    ROUTING_STATUS.md      what is left on the PCB
    BOM.md                 parts and prices
    HE_DESIGN.md           Hall effect analysis (not current)
    RP2040_LAYOUT_RULES.md layout rules for a bare-chip design
  docs/
    HANDOFF.md             this file
    SOURCING_HANDOFF.md    suppliers, positioning, NZ legal and compliance
    HANDOVER.md            earlier website handover

Downloads/Taptile MX Build/   ← the current board lives here
```
