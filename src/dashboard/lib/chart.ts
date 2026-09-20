/**
 * One chart config for the whole dashboard. Per-chart theming is how a set of
 * charts stops looking like one system.
 *
 * These are the only hex literals outside tailwind.config.js, and they exist
 * because SVG gradient stops and stroke attributes cannot read Tailwind
 * classes. They mirror `colors.chart` in the config — change both together.
 */
export const CHART = {
  series: ['#b6ff56', '#4ade80', '#16a34a', '#d9f99d', '#03d16d', '#86efac'],
  track: '#282f35',
  grid: 'rgba(255,255,255,0.045)',
  axis: '#858d97',
  lime: '#b6ff56',
  limeLight: '#d3ff8d',
  limeMid: '#8ade33',
  emerald: '#03d16d',
  emeraldMid: '#4ade80',
} as const;

/** Avatar palette — [background, foreground]. §2.5. */
export const AVATAR_TONES: readonly (readonly [string, string])[] = [
  ['#2c3a1c', '#d8f8ae'],
  ['#343a20', '#e6f7b8'],
  ['#22343a', '#a8dbe8'],
  ['#38303c', '#e8c2dd'],
  ['#2f3320', '#e6f7b8'],
  ['#233a2a', '#b8f0cc'],
];
