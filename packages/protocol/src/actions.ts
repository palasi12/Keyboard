/**
 * Every action a button can perform.
 *
 * Adding a new action type is a three-step change:
 *   1. add the variant here
 *   2. add a handler in packages/core/src/actions/
 *   3. add an editor form in apps/desktop/src/renderer/ActionEditor.tsx
 */

export type Modifier = 'ctrl' | 'alt' | 'shift' | 'meta';

/** Press a key combination, e.g. Ctrl+Shift+M to mute Discord. */
export interface HotkeyAction {
  type: 'hotkey';
  /** Non-modifier key, e.g. "m", "f13", "space". */
  key: string;
  modifiers: Modifier[];
}

/** Type a string of text (fast, non-clipboard). */
export interface TextAction {
  type: 'text';
  text: string;
}

/** Launch an application by absolute path or shell name. */
export interface LaunchAppAction {
  type: 'launchApp';
  path: string;
  args?: string[];
}

/** Open a URL in the default browser. */
export interface OpenUrlAction {
  type: 'openUrl';
  url: string;
}

/**
 * Run a shell command.
 * Disabled by default — the user must opt in per-profile because this is the
 * one action that can do real damage.
 */
export interface RunCommandAction {
  type: 'runCommand';
  command: string;
  cwd?: string;
}

/** System media transport controls. */
export interface MediaAction {
  type: 'media';
  control: 'playPause' | 'next' | 'previous' | 'stop' | 'volumeUp' | 'volumeDown' | 'mute';
}

/** Jump to another profile (page of buttons). */
export interface SwitchProfileAction {
  type: 'switchProfile';
  profileId: string;
}

/** Wait, for use inside a sequence. */
export interface DelayAction {
  type: 'delay';
  ms: number;
}

/** Fire several actions in order. */
export interface MultiAction {
  type: 'multi';
  actions: DeckAction[];
}

/** Do nothing. Useful as a placeholder for an empty key. */
export interface NoopAction {
  type: 'noop';
}

export type DeckAction =
  | HotkeyAction
  | TextAction
  | LaunchAppAction
  | OpenUrlAction
  | RunCommandAction
  | MediaAction
  | SwitchProfileAction
  | DelayAction
  | MultiAction
  | NoopAction;

export type DeckActionType = DeckAction['type'];

export const ACTION_TYPES: readonly DeckActionType[] = [
  'hotkey',
  'text',
  'launchApp',
  'openUrl',
  'runCommand',
  'media',
  'switchProfile',
  'delay',
  'multi',
  'noop',
] as const;

/** Human labels for the editor UI. */
export const ACTION_LABELS: Record<DeckActionType, string> = {
  hotkey: 'Press hotkey',
  text: 'Type text',
  launchApp: 'Launch app',
  openUrl: 'Open URL',
  runCommand: 'Run command',
  media: 'Media control',
  switchProfile: 'Switch profile',
  delay: 'Wait',
  multi: 'Run sequence',
  noop: 'Nothing',
};
