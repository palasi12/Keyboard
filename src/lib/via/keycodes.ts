/**
 * Keycodes the configurator can assign.
 *
 * Values are QMK keycodes. For plain keys QMK reuses the USB HID usage IDs
 * (KC_A = 0x04 and so on), so these are stable across boards.
 *
 * Modified keys use QMK's modifier range: OR the base keycode with the
 * modifier bit. QK_LCTL is 0x0100, LSFT 0x0200, LALT 0x0400, LGUI 0x0800.
 * So Ctrl+C is 0x0100 | 0x06 = 0x0106.
 *
 * VERIFY ON HARDWARE before shipping. If a board reports VIA protocol 9+ it
 * may use a remapped keycode table; the raw-hex escape hatch in the UI exists
 * for exactly that case.
 */

export interface KeycodeOption {
  /** QMK keycode. */
  code: number;
  /** What the user sees. */
  label: string;
  /** What it does, shown as help text. */
  hint?: string;
}

export interface KeycodeGroup {
  name: string;
  options: KeycodeOption[];
}

export const KC_NO = 0x0000;
export const KC_TRNS = 0x0001;

const MOD_LCTL = 0x0100;
const MOD_LSFT = 0x0200;
const MOD_LALT = 0x0400;
const MOD_LGUI = 0x0800;

/** Combine a base keycode with modifier bits. */
export function withModifiers(
  code: number,
  mods: { ctrl?: boolean; shift?: boolean; alt?: boolean; gui?: boolean },
): number {
  let result = code & 0x00ff;
  if (mods.ctrl) result |= MOD_LCTL;
  if (mods.shift) result |= MOD_LSFT;
  if (mods.alt) result |= MOD_LALT;
  if (mods.gui) result |= MOD_LGUI;
  return result;
}

export function splitModifiers(code: number): {
  base: number;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  gui: boolean;
} {
  return {
    base: code & 0x00ff,
    ctrl: (code & MOD_LCTL) !== 0,
    shift: (code & MOD_LSFT) !== 0,
    alt: (code & MOD_LALT) !== 0,
    gui: (code & MOD_LGUI) !== 0,
  };
}

const letters: KeycodeOption[] = Array.from({ length: 26 }, (_, index) => ({
  code: 0x04 + index,
  label: String.fromCharCode(65 + index),
}));

const digits: KeycodeOption[] = [
  { code: 0x1e, label: '1' },
  { code: 0x1f, label: '2' },
  { code: 0x20, label: '3' },
  { code: 0x21, label: '4' },
  { code: 0x22, label: '5' },
  { code: 0x23, label: '6' },
  { code: 0x24, label: '7' },
  { code: 0x25, label: '8' },
  { code: 0x26, label: '9' },
  { code: 0x27, label: '0' },
];

const functionKeys: KeycodeOption[] = Array.from({ length: 12 }, (_, index) => ({
  code: 0x3a + index,
  label: `F${index + 1}`,
}));

export const KEYCODE_GROUPS: KeycodeGroup[] = [
  {
    name: 'Common',
    options: [
      { code: KC_NO, label: 'Nothing', hint: 'Key does nothing' },
      { code: 0x28, label: 'Enter' },
      { code: 0x29, label: 'Escape' },
      { code: 0x2a, label: 'Backspace' },
      { code: 0x2b, label: 'Tab' },
      { code: 0x2c, label: 'Space' },
      { code: 0x4c, label: 'Delete' },
    ],
  },
  {
    name: 'Editing',
    options: [
      { code: withModifiers(0x06, { ctrl: true }), label: 'Copy', hint: 'Ctrl + C' },
      { code: withModifiers(0x19, { ctrl: true }), label: 'Paste', hint: 'Ctrl + V' },
      { code: withModifiers(0x1b, { ctrl: true }), label: 'Cut', hint: 'Ctrl + X' },
      { code: withModifiers(0x1d, { ctrl: true }), label: 'Undo', hint: 'Ctrl + Z' },
      { code: withModifiers(0x1c, { ctrl: true }), label: 'Redo', hint: 'Ctrl + Y' },
      { code: withModifiers(0x16, { ctrl: true }), label: 'Save', hint: 'Ctrl + S' },
      { code: withModifiers(0x04, { ctrl: true }), label: 'Select all', hint: 'Ctrl + A' },
      { code: withModifiers(0x09, { ctrl: true }), label: 'Find', hint: 'Ctrl + F' },
    ],
  },
  {
    name: 'Media',
    options: [
      { code: 0x00a5, label: 'Mute' },
      { code: 0x00a6, label: 'Volume up' },
      { code: 0x00a7, label: 'Volume down' },
      { code: 0x00a8, label: 'Next track' },
      { code: 0x00a9, label: 'Previous track' },
      { code: 0x00aa, label: 'Stop' },
      { code: 0x00ac, label: 'Play / pause' },
    ],
  },
  {
    name: 'Modifiers',
    options: [
      { code: 0xe0, label: 'Left Ctrl' },
      { code: 0xe1, label: 'Left Shift' },
      { code: 0xe2, label: 'Left Alt' },
      { code: 0xe3, label: 'Left Win / Cmd' },
      { code: 0xe4, label: 'Right Ctrl' },
      { code: 0xe5, label: 'Right Shift' },
    ],
  },
  {
    name: 'Navigation',
    options: [
      { code: 0x4a, label: 'Home' },
      { code: 0x4b, label: 'Page up' },
      { code: 0x4d, label: 'End' },
      { code: 0x4e, label: 'Page down' },
      { code: 0x4f, label: 'Right arrow' },
      { code: 0x50, label: 'Left arrow' },
      { code: 0x51, label: 'Down arrow' },
      { code: 0x52, label: 'Up arrow' },
    ],
  },
  { name: 'Letters', options: letters },
  { name: 'Numbers', options: digits },
  { name: 'Function keys', options: functionKeys },
];

const LOOKUP = new Map<number, KeycodeOption>();
for (const group of KEYCODE_GROUPS) {
  for (const option of group.options) {
    if (!LOOKUP.has(option.code)) LOOKUP.set(option.code, option);
  }
}

/** Best-effort human label for a keycode read off the board. */
export function describeKeycode(code: number): string {
  const known = LOOKUP.get(code);
  if (known) return known.label;
  if (code === KC_TRNS) return 'Pass through';

  // Unknown but recognisably a modified key — describe it generically.
  const parts = splitModifiers(code);
  const base = LOOKUP.get(parts.base);
  if (base && (parts.ctrl || parts.shift || parts.alt || parts.gui)) {
    const mods = [
      parts.ctrl && 'Ctrl',
      parts.shift && 'Shift',
      parts.alt && 'Alt',
      parts.gui && 'Win',
    ].filter(Boolean);
    return `${mods.join(' + ')} + ${base.label}`;
  }

  return `0x${code.toString(16).padStart(4, '0')}`;
}
