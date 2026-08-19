# Taptile — Sourcing, Manufacturing & Legal Handoff

**Date:** 15 August 2026
**Owner:** Palasi (Auckland, NZ)
**Product:** Taptile — programmable mini keyboards · trytaptile.com
**Stage:** Pre-launch. Waitlist live, first batch not ordered. No capital committed.

> Supersedes `macropad-sourcing-handoff.md` (15 Aug 2026), which assumed personal
> use. Commercial intent changes the platform choice, the legal position, and the
> compliance burden.

---

## 1. Situation

Taptile currently plans to sell a **6-key + rotary knob programmable macro
keypad**, USB-C, wired.

The unit under evaluation came from an Alibaba listing (product ID
1601809454705) at NZ$18.96–27.86, MOQ 1, seller **Shenzhen Yesen Electronic
Technology Co., Ltd.**

**Yesen is a reseller, not a manufacturer.** Evidence:

| Signal | Value |
|---|---|
| Time on Alibaba | 1 year |
| Ratings | 4.1/5 from 6 reviews |
| Units sold | 10 |
| MOQ | 1 piece (dropship pattern) |
| Verified Manufacturer badge | Absent |

Decisive tell: the main product image is branded **"Lingxi Huijin" (灵犀汇金)**
with keycaps reading Buy / Sell / Withdraw / 买 / 卖 — a stock-trading hotkey pad
built for a Chinese fintech brand. Yesen is reselling another company's product
with that company's marketing image still attached.

**The pad is an open-tooling ("公版") generic design.** Dozens of
Shenzhen/Dongguan assemblers build it from the same reference PCB and case.
Identical units appear on AliExpress, eBay, Temu and Amazon at NZ$15–35 under a
dozen brand names. There is no single manufacturer to find, and **no hardware
defensibility in reselling it.**

---

## 2. The core problem — positioning

Current site meta description:

> "Programmable mini keyboards for the shortcuts you use every day.
> Hot-swappable, USB-C, Windows and macOS. Join the waitlist for the first batch."

**"The shortcuts you use every day" describes everyone, which means it describes
no one.** Elgato, DOIO, SayoDevice, Work Louder and forty AliExpress sellers
could run the same sentence. Nothing tells a specific buyer this was built for
them.

Competitors already holding the obvious positions:

- **Elgato Stream Deck** (Corsair) — owns the streamer/creator market
- **Logitech MX Creative Console** — recent entrant, creative pro
- **Keychron, DOIO, SayoDevice, Work Louder** — enthusiast / premium builds

### The fix, and it's cheap

You're pre-batch with a waitlist. **The waitlist is your test rig.** Run 2–3
landing page variants at specific verticals — same product, different headline
and key legends:

- Video editors (Premiere / DaVinci Resolve)
- Day traders
- CAD / engineering
- Sonographers / clinical note-taking
- Whatever vertical you have direct access to

Whichever fills fastest defines the first batch. Cost: one weekend. Zero
inventory risk.

### ⚠️ Two claims to verify before shipping

- **"Hot-swappable"** — many generic 6-key pads have *soldered* switches, not
  sockets. A false spec on your own site is your liability under the **Fair
  Trading Act**, not the supplier's. This is exactly the kind of line that gets
  copy-pasted from an Alibaba listing unchecked.
- **"Windows and macOS"** — verify the config software actually runs on macOS.
  Many stock Chinese configurators are Windows-only.

---

## 3. Platform decision: move to RP2040

| | CH552 (current generic) | RP2040 (recommended) |
|---|---|---|
| Flash | ~16 KB | 2 MB |
| Core | 8051 | Dual Cortex-M0+ |
| QMK / VIA | ❌ Impossible | ✅ Native |
| Firmware burden | Write and maintain everything yourself | Open-source, community-maintained |
| Unit cost @ volume | ~$0.30 | ~$1 |
| Config app | You build and support it | VIA — you build nothing |

**"Works with VIA out of the box, no sketchy Chinese driver"** is a genuine
reason to buy Taptile over a NZ$25 generic. It's also a large chunk of
engineering you don't have to own or support.

⚠️ Sellers silently swap MCUs between production runs. Same case, same photos,
different chip inside. Always confirm per batch.

---

## 4. Manufacturers

### Tier A — Turnkey macropad ODMs (assemble the whole unit)

⚠️ **Leads to qualify, not verified factories.** Chinese B2B directories are
SEO-driven and every listing self-declares "Manufacturer."

| # | Company | Location | Why shortlisted |
|---|---|---|---|
| 1 | **Keyceo** | Shenzhen (Bao'an) office + Dongguan (Qingxi Town) factory | Strongest. Dedicated keyboard/mouse ODM, own website, published factory address separate from office, explicit OEM/ODM offering. **Start here.** |
| 2 | **Dongguan Jinruixin Technology Co., Ltd.** | Dongguan | Recurs across OEM mechanical + gaming keyboard categories |
| 3 | **Shenzhen Sinph U-Life Technology Co., Ltd.** | Shenzhen | Appears across three separate keyboard categories |
| 4 | **Shenzhen Kudiyou Electronic Technology Co., Ltd.** | Shenzhen | Recurring in mechanical gaming keyboard listings |
| 5 | **Dongguan Win-Hsin Electronic Co., Ltd.** | Dongguan | Recurring in computer keyboard listings; Dongguan is the real cluster |

Also worth a look: Guangdong Sohoo Technology, Shenzhen DJS Tech.

**Qualification script — cut five to one:**

1. Request the business licence
2. Request a **live video walkthrough** of the production line (anyone who
   refuses is a trader)
3. Ask what MCU their macropad boards use
4. Ask whether they'll **flash your firmware at the factory**, and at what MOQ
5. Cross-check the Chinese company name on **gsxt.gov.cn** — registered business
   scope must include 生产/制造, not just 销售/贸易

### Tier B — PCB/PCBA houses (board only) ← recommended route

Verifiable, unlike Tier A.

| # | Service | Location | Notes |
|---|---|---|---|
| 1 | **JLCPCB** | Shenzhen | Cheapest. EasyEDA integration, SMT assembly with in-stock parts. ~5 bare boards under US$10. Documents keyboard PCBA explicitly — supply BOM + CPL with Gerbers and their line places the 1N4148W diodes and Kailh hot-swap sockets. Pair with **JLC3DP** for enclosure (same roof = consistent fit tolerances). |
| 2 | **PCBWay** | Shenzhen | Higher quality, faster turnaround, more cost. Active keyboards project community with open RP2040 macropad references. |
| 3 | **Seeed Fusion** | Shenzhen | Turnkey small-batch including enclosure and final assembly |
| 4 | **Elecrow** | Shenzhen | Small-batch PCBA + acrylic/case fabrication — good if keeping the sandwich-case format |
| 5 | **MacroFab** | Houston, US | Western, meaningfully pricier, no import friction, cleaner provenance for regulated channels |

**Why Tier B wins:** your own RP2040 board costs *less per unit* than a finished
pad from Yesen, ships with VIA support, and gives you something a competitor
cannot buy off Alibaba next week.

**Shortcut — don't design from zero:** `BenGreenberg07/custom-micropad` on GitHub
is an **MIT-licensed** 9-key RP2040 macropad with KiCad files, KMK firmware, and
a `PCB/production/` folder containing everything a fab house needs. MIT permits
commercial use with attribution.

**Classic first-board mistake:** on USB-C, **each CC pin (CC1 and CC2) needs its
own 5.1 kΩ pull-down to GND** or the host won't detect the device or supply 5V.
Add a TVS diode array on D+/D− and VBUS for ESD.

---

## 5. Legal position (NZ)

**Not legal advice.** Verified against the Copyright Act 1994, current as at
13 November 2025.

### Clear — no permission needed

| Activity | Why it's fine |
|---|---|
| Flashing your own firmware onto boards you bought, then reselling | You own the physical goods. Erasing their firmware isn't copying it. Firmware you write is your own work. |
| Reverse engineering the **hardware** | Circuit topology isn't a literary work. A commodity 6-key matrix isn't patentable subject matter anyone will assert. |
| Writing your own firmware from scratch | No copyright question arises at all |

### Needs a licence — get it in writing

**Reselling units with their firmware still on them, under the Taptile brand.**
That is commercial distribution of their copyrighted software. OEM suppliers
grant this routinely, but "routinely" is not a defence.

### ⚠️ The carve-out — do NOT decompile their firmware

- **s80A** permits decompilation for *interoperability* — building something that
  works **with** their program. You'd be **replacing** it. Weak fit.
- **s80C** protects *lawful users* observing/testing for personal interop.
  Doesn't cover shipping a commercial product.
- **s226A** prohibits circumventing technological protection measures. If the MCU
  is read-protected, actively defeating that to *dump* firmware is a separate
  exposure. **Overwriting = clean. Extracting = risk.**

**You don't need to decompile anything.** Write your own firmware → you define
the protocol → nothing to reverse engineer. The riskiest step is also the
unnecessary one.

*(For reference, s80D means contractual terms purporting to override s80A–80C
have no effect in NZ. Relevant to personal use; doesn't rescue commercial
distribution.)*

### As the brand, you become the responsible supplier

- **Consumer Guarantees Act** — returns, repairs, "acceptable quality" land on
  you, not on Yesen
- **Fair Trading Act** — every spec claim on trytaptile.com is your liability
- Budget for failure rate: generic Chinese macropads run ~3–5% DOA

---

## 6. Compliance sequence (NZ, then export markets)

**New Zealand** — EMC obligations under the Radiocommunications (EMC Standards)
Notice 2019. A wired USB device is an unintentional radiator, Level 1–2 →
**self-declaration**, not certification. Manageable, but budget for an EMC test
report.

Required:

- [ ] Register with **ERAC** for a supplier number (prerequisite for using the
      RCM mark)
- [ ] Obtain valid EMC test evidence (conducted + radiated emissions; overseas
      reports acceptable if valid)
- [ ] Sign a **Supplier Declaration of Conformity (SDoC)**
- [ ] Label product with the **RCM** mark
- [ ] Maintain a **compliance folder** (electronic or hard copy)

Note: R-NZ labelling applies to *radio transmitters*. A wired pad isn't one — but
it would be if you ever add wireless.

**Export markets, when you get there:**

- Australia — RCM (harmonised with NZ, low marginal effort)
- USA — FCC Part 15 Class B, SDoC self-declaration
- EU — CE marking, EMC Directive (immunity testing mandatory, unlike NZ), RoHS,
  WEEE, packaging regs

---

## 7. Scale problem to solve early

**Reflashing retail units one at a time does not scale.** Open case → bridge P1.5
to GND → flash → reassemble ≈ 5 min/unit = **8+ hours per 100 units**, done by
you, in your evenings.

Options, in order of preference:

1. **Factory-flash** — supplier loads your firmware at MOQ 100–500. Cheapest, no
   hardware labour.
2. **Bare PCBs + pogo-pin jig** — batch flash before assembly
3. **Own RP2040 board** — flash as part of PCBA. Full control, real
   differentiation.

---

## 8. Next actions

**This week (no capital required):**

- [ ] Choose 2–3 candidate verticals for Taptile
- [ ] Build landing page variants; run the waitlist as a demand test
- [ ] Audit current site copy: verify "hot-swappable" and "macOS" claims or
      remove them

**Once a vertical is proven:**

- [ ] Contact Keyceo first; run the Tier A qualification script on all five
- [ ] In parallel, get a JLCPCB quote for an RP2040 board at 100 / 500 units
- [ ] Compare: factory-flashed generic vs own RP2040 design (expect own design to
      win on both cost and defensibility)

**Before first batch ships:**

- [ ] Secure written firmware licence if shipping supplier firmware
- [ ] Start ERAC registration + EMC test report
- [ ] 20 min with an NZ IP solicitor on the firmware licensing point
- [ ] Order and test samples from top 2 shortlisted suppliers

---

## 9. Open items

- Which vertical? — **blocks everything downstream**
- What does the rest of trytaptile.com say beyond the hero? (site is
  client-rendered; only meta tags were readable)
- Confirmed MCU in the current production run — unverified
- Target first-batch quantity and budget — unknown

---

---

# Addendum — reconciliation with the current build (15 Aug 2026)

Added when this document was filed. The doc above is preserved verbatim; this
section records where the in-progress prototype agrees and disagrees with it.

## Agreements

**Section 4 Tier B is the route already taken.** The prototype is an own-design
RP2040 board headed for JLCPCB, not a rebadged Yesen unit. Section 3's platform
recommendation is already implemented — see `firmware/taptile/mini/rules.mk`,
which sets `VIA_ENABLE = yes`.

**Section 5's safe path is the one being followed.** No supplier firmware is
being flashed, dumped, decompiled or redistributed. Firmware is QMK (GPL-2.0)
with an original keymap. The s80A/s80C/s226A exposure described in section 5
does not arise.

## Discrepancies to resolve

**Key count.** This doc specifies 6 keys + 1 knob. The prototype is **9 keys +
2 encoders** with push switches. Pick one before the site copy is rewritten —
they are different products with different BOMs and different prices.

**The USB-C CC pull-down warning in section 4 does not apply to the current
board.** There is no USB-C connector on it; the controller module carries USB.
The warning becomes live only when moving to a bare-RP2040 production design,
at which point it is correct and important. Filed for later.

**`BenGreenberg07/custom-micropad` was not used.** The schematic is generated by
`hardware/gen_schematic.py`. No MIT attribution obligation has been incurred. If
that repo's files are pulled in later, the attribution requirement applies.

## ⚠️ Section 2's "hot-swappable" warning is now confirmed live

Section 2 flagged this as a Fair Trading Act risk on the assumption the claim
came from an Alibaba listing. It is worse than that: **the prototype was
deliberately specified as direct-solder on 15 Aug**, on cost grounds (Kailh
sockets add ~NZ$4–6). The claim is not merely unverified — it is contradicted by
the board currently being designed.

Live on the site right now:

| File | Line | Text |
|---|---|---|
| `src/pages/Landing.tsx` | 348 | meta description — "Hot-swappable, USB-C, Windows and macOS" |
| `src/pages/Landing.tsx` | 435 | feature bullet — "Hot-swappable switches" |
| `src/pages/Landing.tsx` | 108 | FAQ — "No. Switches are hot-swappable, so you can pull them out and try different ones by hand." |
| `src/lib/catalog.ts` | 62, 90, 118 | spec rows — "hot-swappable" on all three products |
| `src/lib/catalog.ts` | 70, 100, 128 | feature bullets — "Hot-swappable switches, no soldering" |

**"Windows, macOS, Linux"** (`Landing.tsx` 104, 433; `catalog.ts` 66, 94, 122) is
a second exposure, and a different one from the doc's concern. The configurator
is browser-based and uses **WebHID**, which Chrome and Edge support but **Firefox
and Safari do not**. The OS claim is defensible; a Safari user on macOS will find
it doesn't work. Needs a browser qualifier, not an OS one.

Two ways to close the hot-swap gap:

1. **Change the copy** — free, and honest for the board as designed.
2. **Change the board** — add Kailh MX hot-swap sockets, ~NZ$4–6 for the
   prototype. Cheap to do now while nothing is routed; expensive after boards are
   ordered.

Decision needed before either the boards are ordered or the waitlist is emailed,
whichever comes first.
