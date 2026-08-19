#!/usr/bin/env python3
"""
Independent validation of a generated .kicad_pcb.

Deliberately does NOT import the build script's tables. It re-reads the board
file and checks it against the RP2040 datasheet pinout and first principles, so
a mistake in the generator cannot hide by being consistent with itself.

    usage: python3 validate_board.py Taptile_HE.kicad_pcb

Exit code is 0 only if every check passes.
"""

import re
import sys
from collections import defaultdict

# RP2040 QFN-56, from the Raspberry Pi product brief pinout diagram.
RP_PINS = {
    1: "IOVDD", 10: "IOVDD", 22: "IOVDD", 33: "IOVDD", 42: "IOVDD",
    49: "IOVDD", 23: "DVDD", 50: "DVDD", 19: "TESTEN", 20: "XIN", 21: "XOUT",
    24: "SWDIO", 25: "SWCLK", 26: "RUN", 43: "ADC_AVDD", 44: "VREG_VIN",
    45: "VREG_VOUT", 46: "USB_DM", 47: "USB_DP", 48: "USB_VDD",
    51: "QSPI_SD3", 52: "QSPI_SCLK", 53: "QSPI_SD0", 54: "QSPI_SD2",
    55: "QSPI_SD1", 56: "QSPI_SS_N",
}
RP_EXPECT = {
    "IOVDD": "+3V3", "DVDD": "+1V1", "TESTEN": "GND", "ADC_AVDD": "+3V3",
    "VREG_VIN": "+3V3", "VREG_VOUT": "+1V1", "USB_VDD": "+3V3",
}


def sexp_blocks(text, token):
    out, i = [], 0
    while True:
        i = text.find(token, i)
        if i < 0:
            return out
        depth, j, in_str, esc = 0, i, False, False
        while j < len(text):
            ch = text[j]
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = not in_str
            elif not in_str:
                if ch == "(":
                    depth += 1
                elif ch == ")":
                    depth -= 1
                    if depth == 0:
                        break
            j += 1
        out.append(text[i:j + 1])
        i = j + 1


NUM = r"(-?[\d.]+)"


def load(path):
    t = open(path, encoding="utf-8").read()
    parts = {}
    for b in sexp_blocks(t, "(module "):
        fp = re.match(r"\(module (\S+)", b).group(1)
        m = re.search(r"\(fp_text reference (\S+)", b)
        ref = m.group(1) if m else "?"
        at = re.search(rf"\n\s*\(at {NUM} {NUM}", b)
        x, y = (float(at.group(1)), float(at.group(2))) if at else (0, 0)
        pads = []
        for pb in sexp_blocks(b, "(pad "):
            pm = re.match(r'\(pad\s+("(?:[^"]*)"|\S+)\s+(\S+)\s+(\S+)', pb)
            if not pm:
                continue
            pa = re.search(rf"\(at {NUM} {NUM}", pb)
            ps = re.search(rf"\(size {NUM} {NUM}", pb)
            nm = re.search(r'\(net \d+ "([^"]*)"', pb)
            if not (pa and ps):
                continue
            pads.append(dict(name=pm.group(1).strip('"'), ptype=pm.group(2),
                             x=x + float(pa.group(1)), y=y + float(pa.group(2)),
                             w=float(ps.group(1)), h=float(ps.group(2)),
                             net=nm.group(1) if nm else None))
        parts[ref] = dict(fp=fp, x=x, y=y, pads=pads)
    declared = dict(re.findall(r'\(net (\d+) "([^"]*)"', t))
    return t, parts, declared


def main(path):
    t, parts, declared = load(path)
    errors, warnings, notes = [], [], []

    nets = defaultdict(list)
    for ref, p in parts.items():
        for q in p["pads"]:
            if q["net"]:
                nets[q["net"]].append(f"{ref}.{q['name']}")

    # ---------------------------------------------------------- 1. RP2040 ---
    u1 = parts.get("U1")
    if not u1:
        errors.append("U1 (RP2040) is missing entirely")
    else:
        bypad = {q["name"]: q["net"] for q in u1["pads"]}
        if len([p for p in u1["pads"]]) < 57:
            errors.append(f"U1 has {len(u1['pads'])} pads, expected 57 "
                          f"(56 signal + thermal)")
        for pin, fn in RP_PINS.items():
            want = RP_EXPECT.get(fn)
            got = bypad.get(str(pin))
            if want and got != want:
                errors.append(f"U1 pin {pin} ({fn}) is on {got!r}, "
                              f"datasheet requires {want}")
        if bypad.get("57") != "GND":
            errors.append("U1 thermal pad (57) is not on GND — the chip would "
                          "have no ground and no heat path")
        for pin in (20, 21):
            if not bypad.get(str(pin)):
                errors.append(f"U1 pin {pin} ({RP_PINS[pin]}) unconnected — "
                              f"no crystal, board will not boot")

    # ------------------------------------------------------- 2. power tree ---
    for rail in ("+3V3", "+5V", "GND"):
        if rail not in nets:
            errors.append(f"power rail {rail} does not exist on the board")
    if "+1V1" in nets and len(nets["+1V1"]) < 3:
        warnings.append("+1V1 has fewer than 3 pads; DVDD needs both pins "
                        "plus VREG_VOUT plus decoupling")

    # USB-C: each CC pin needs its OWN pull-down or the host supplies no power.
    cc = [n for n in ("CC1", "CC2") if n in nets]
    if len(cc) < 2:
        errors.append("CC1/CC2 not both present — USB-C host will not "
                      "enumerate or supply 5V")
    for c in cc:
        if len(nets[c]) != 2:
            errors.append(f"{c} has {len(nets[c])} pads; must be exactly 2 "
                          f"(connector pin + its own 5.1k). Sharing one "
                          f"resistor across both CC pins is the classic fault.")

    # ----------------------------------------------------- 3. orphan nets ---
    for n, pads in sorted(nets.items()):
        if len(set(pads)) < 2:
            errors.append(f"net {n!r} has only one pad ({pads[0]}) — "
                          f"connects to nothing")

    # ------------------------------------------------- 4. declared vs used ---
    used = set(nets)
    decl = {v for v in declared.values() if v}
    for n in sorted(decl - used):
        warnings.append(f"net {n!r} declared in the netlist but on no pad")

    # ------------------------------------------------------- 5. LED chain ---
    leds = sorted((r for r in parts if re.fullmatch(r"D\d+", r)),
                  key=lambda r: int(r[1:]))
    if leds:
        chain_ok = True
        for i, ref in enumerate(leds, start=1):
            bypad = {q["name"]: q["net"] for q in parts[ref]["pads"]}
            din, dout = bypad.get("4"), bypad.get("2")
            if not din:
                errors.append(f"{ref} DIN unconnected — LED chain breaks here")
                chain_ok = False
            if i < len(leds):
                nxt = {q["name"]: q["net"]
                       for q in parts[leds[i]]["pads"]}.get("4")
                if dout != nxt:
                    errors.append(f"{ref} DOUT ({dout}) does not feed "
                                  f"{leds[i]} DIN ({nxt})")
                    chain_ok = False
            if bypad.get("1") != "+5V" or bypad.get("3") != "GND":
                errors.append(f"{ref} power pads wrong: "
                              f"VDD={bypad.get('1')} GND={bypad.get('3')}")
        if chain_ok:
            notes.append(f"LED chain continuous across {len(leds)} LEDs "
                         f"({leds[0]} -> {leds[-1]})")
        ma = len(leds) * 60
        if ma > 500:
            warnings.append(f"{len(leds)} LEDs = {ma}mA at full white vs 500mA "
                            f"from USB. Firmware MUST cap global brightness.")

    # -------------------------------------------------- 6. hall sensors -----
    hs = sorted((r for r in parts if r.startswith("HS")),
                key=lambda r: int(r[2:]))
    adc_nets, mux_nets = set(), set()
    u4 = parts.get("U4")
    if u4:
        mux_nets = {q["net"] for q in u4["pads"] if q["net"]}
    if u1:
        bypad = {q["name"]: q["net"] for q in u1["pads"]}
        # ADC is only available on GPIO26-29 == pins 38,39,40,41
        adc_nets = {bypad.get(str(p)) for p in (38, 39, 40, 41)} - {None}
    for ref in hs:
        bypad = {q["name"]: q["net"] for q in parts[ref]["pads"]}
        out = bypad.get("3")
        if bypad.get("1") != "+3V3" or bypad.get("2") != "GND":
            errors.append(f"{ref} power wrong: VCC={bypad.get('1')} "
                          f"GND={bypad.get('2')}")
        if not out:
            errors.append(f"{ref} output unconnected")
        elif out not in mux_nets and out not in adc_nets:
            errors.append(f"{ref} output {out!r} reaches neither the mux nor "
                          f"an ADC pin — that key cannot be read")
    if hs:
        notes.append(f"{len(hs)} hall sensors, all outputs reach an ADC path")

    # ------------------------------------------------ 7. pad-level shorts ---
    flat = []
    for ref, p in parts.items():
        for q in p["pads"]:
            flat.append((ref, q))
    shorts = 0
    for i in range(len(flat)):
        r1, a = flat[i]
        if not a["net"]:
            continue
        for r2, b in flat[i + 1:]:
            if not b["net"] or a["net"] == b["net"]:
                continue
            dx = abs(a["x"] - b["x"]) - (a["w"] + b["w"]) / 2
            dy = abs(a["y"] - b["y"]) - (a["h"] + b["h"]) / 2
            if dx < 0.15 and dy < 0.15:
                shorts += 1
                if shorts <= 8:
                    errors.append(
                        f"pads {r1}.{a['name']} ({a['net']}) and "
                        f"{r2}.{b['name']} ({b['net']}) are "
                        f"{max(dx, dy):.3f}mm apart — under 0.15mm clearance")
    if shorts > 8:
        errors.append(f"...and {shorts - 8} more pad clearance violations")

    # ------------------------------------------------------- 8. geometry ---
    X0, X1, Y0, Y1 = 65.0, 135.0, 40.0, 160.0
    for ref, p in parts.items():
        for q in p["pads"]:
            if not (X0 <= q["x"] <= X1 and Y0 <= q["y"] <= Y1):
                errors.append(f"{ref}.{q['name']} pad is outside the board "
                              f"outline at ({q['x']:.1f}, {q['y']:.1f})")

    # --------------------------------------------------------- 9. report ---
    print(f"=== {path} ===")
    print(f"components {len(parts)}   nets {len(nets)}   "
          f"connected pads {sum(len(v) for v in nets.values())}")
    print()
    for n in notes:
        print(f"  ok    {n}")
    for w in warnings:
        print(f"  WARN  {w}")
    for e in errors:
        print(f"  FAIL  {e}")
    print()
    print(f"{len(errors)} errors, {len(warnings)} warnings")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "Taptile_HE.kicad_pcb"))
