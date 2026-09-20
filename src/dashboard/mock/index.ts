/**
 * Sample data for the pre-launch dashboard (handoff §8).
 *
 * Every figure in here is invented for a 25-unit first run. Nothing reads a
 * backend. Pages that render this set carry the SAMPLE DATA chip; the two
 * pages backed by Supabase (Customers, and the devlog half of Content) carry
 * LIVE DATA instead and never touch this file.
 *
 * Copy rules (§14) are enforced here rather than at each call site: price and
 * ship window are the single `FILL_IN` constant, so the day the price is
 * locked is a one-line edit.
 */

/** Gate 7 and gate 8 are blocked. Until they clear, neither figure exists. */
export const FILL_IN = '[FILL IN]';

/** §17 open question 1 — a placeholder, never an invented person. */
export const CO_FOUNDER = '[CO-FOUNDER NAME]';
export const OWNER = 'Jenil Thakor';

export type Status = 'pre' | 'prod' | 'ship' | 'ref';
export type GateState = 'done' | 'prog' | 'block';
export type Tone = 'lime' | 'blue' | 'rose' | 'grey';

export interface Order {
  id: string;
  name: string;
  email: string;
  country: 'NZ' | 'AU' | 'US' | 'GB';
  units: number;
  total: number;
  status: Status;
  date: string;
  variant: string;
  shipping: string;
}

export interface Gate {
  title: string;
  detail: string;
  owner: string;
  state: GateState;
}

export interface Expense {
  date: string;
  item: string;
  supplier: string;
  category: 'PCB' | 'Marketing' | 'Case' | 'Packaging' | 'Software' | 'Legal';
  amount: number;
  paid: boolean;
}

export interface StockItem {
  name: string;
  spec: string;
  qty: number;
  covers: number;
  pct: number;
  short: boolean;
}

export interface Thread {
  name: string;
  role: string;
  email: string;
  place: string;
  kind: 'customer' | 'supplier' | 'system';
  unread: number;
  time: string;
  preview: string;
  link: { value: string; sub: string; label: string; href: string };
  messages: { text: string; time: string; outgoing: boolean }[];
}

/* ------------------------------------------------------------- headline --- */

export const FIGURES = {
  revenueMonth: 2340,
  revenueAllTime: 4120,
  grossRevenue: 4410,
  refunds: 290,
  refundOrders: 1,
  avgOrderValue: 229,
  margin: 58,
  unitsSold: 18,
  runSize: 25,
  unitCost: 96.4,
  spentToDate: 3860,
  committed: 1240,
  monthlyBurn: 640,
  cashOnHand: 4100,
  waitlistTarget: 50,
  conversion: 44,
  reachWeek: 19_100,
} as const;

export const STATUS_LABEL: Record<Status, string> = {
  pre: 'Pre-order',
  prod: 'In production',
  ship: 'Shipped',
  ref: 'Refunded',
};

export const STATUS_TONE: Record<Status, Tone> = {
  pre: 'lime',
  prod: 'blue',
  ship: 'grey',
  ref: 'rose',
};

/* --------------------------------------------------------------- orders --- */

export const ORDERS: Order[] = [
  { id: 'TD-0018', name: 'M. Reid', email: 'm.reid@example.co.nz', country: 'NZ', units: 1, total: 229, status: 'pre', date: '2025-09-18', variant: 'Slate', shipping: 'NZ Post tracked' },
  { id: 'TD-0017', name: 'S. Beattie', email: 's.beattie@example.com.au', country: 'AU', units: 1, total: 229, status: 'pre', date: '2025-09-17', variant: 'Bone', shipping: 'International tracked' },
  { id: 'TD-0016', name: 'J. Whitcombe', email: 'j.whitcombe@example.co.nz', country: 'NZ', units: 2, total: 458, status: 'prod', date: '2025-09-15', variant: 'Slate', shipping: 'NZ Post tracked' },
  { id: 'TD-0015', name: 'A. Fonoti', email: 'a.fonoti@example.co.nz', country: 'NZ', units: 1, total: 229, status: 'prod', date: '2025-09-14', variant: 'Slate', shipping: 'NZ Post tracked' },
  { id: 'TD-0014', name: 'T. Kahu', email: 't.kahu@example.co.nz', country: 'NZ', units: 3, total: 687, status: 'prod', date: '2025-09-12', variant: 'Bone', shipping: 'NZ Post tracked' },
  { id: 'TD-0013', name: 'D. Muir', email: 'd.muir@example.com.au', country: 'AU', units: 1, total: 229, status: 'pre', date: '2025-09-11', variant: 'Slate', shipping: 'International tracked' },
  { id: 'TD-0012', name: 'K. Aleki', email: 'k.aleki@example.co.nz', country: 'NZ', units: 1, total: 229, status: 'ref', date: '2025-09-09', variant: 'Kit only', shipping: 'NZ Post tracked' },
  { id: 'TD-0011', name: 'R. Ellison', email: 'r.ellison@example.com', country: 'US', units: 2, total: 458, status: 'pre', date: '2025-09-06', variant: 'Slate', shipping: 'International tracked' },
];

export const ORDERS_BY_COUNTRY: { country: string; units: number }[] = [
  { country: 'NZ', units: 12 },
  { country: 'AU', units: 4 },
  { country: 'US', units: 2 },
  { country: 'GB', units: 1 },
];

/* -------------------------------------------------------------- revenue --- */

export interface RangeSet {
  key: '7d' | '30d' | '12m' | 'all';
  label: string;
  series: number[];
  ticks: string[];
  gross: number;
  refunds: number;
  net: number;
  margin: number;
  deltas: { gross: string; refunds: string; net: string; margin: string };
  /** Index of the "pre-orders opened" marker, when the range spans it. */
  marker?: number;
}

export const RANGES: RangeSet[] = [
  {
    key: '7d',
    label: '7d',
    series: [120, 90, 260, 916, 380, 240, 300],
    ticks: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    gross: 2306,
    refunds: 0,
    net: 2306,
    margin: 59,
    deltas: { gross: '18%', refunds: '—', net: '18%', margin: '1 pt' },
  },
  {
    key: '30d',
    label: '30d',
    series: [60, 140, 90, 210, 180, 320, 260, 420, 380, 520, 460, 610],
    ticks: ['', '', '', '', '', '', '', '', '', '', '', ''],
    gross: 3120,
    refunds: 229,
    net: 2891,
    margin: 58,
    deltas: { gross: '64%', refunds: '1 order', net: '59%', margin: '—' },
  },
  {
    key: '12m',
    label: '12m',
    series: [0, 0, 0, 0, 0, 0, 120, 0, 0, 640, 1060, 2340],
    ticks: ['O', 'N', 'D', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S'],
    gross: 4410,
    refunds: 290,
    net: 4120,
    margin: 58,
    deltas: { gross: '112%', refunds: '1 order', net: '109%', margin: '2 pts' },
    marker: 9,
  },
  {
    key: 'all',
    label: 'All',
    series: [0, 0, 120, 640, 1060, 2340, 4120],
    ticks: ['', '', '', '', '', '', ''],
    gross: 4410,
    refunds: 290,
    net: 4120,
    margin: 58,
    deltas: { gross: 'all time', refunds: '1 order', net: 'all time', margin: 'blended' },
  },
];

export const CHANNELS = [
  { label: 'Own site', value: 2554, pct: 62 },
  { label: 'Marketplace', value: 1071, pct: 26 },
  { label: 'Direct', value: 495, pct: 12 },
];

export const VARIANTS = [
  { name: 'Slate', units: 11, revenue: 2519, margin: 59, share: 61 },
  { name: 'Bone', units: 5, revenue: 1145, margin: 56, share: 28 },
  { name: 'Kit only', units: 2, revenue: 298, margin: 41, share: 7 },
  { name: 'Spare knob pair', units: 6, revenue: 158, margin: 52, share: 4 },
];

export const COHORT = [
  { label: 'First-time', value: 15 },
  { label: 'Repeat', value: 3 },
];

/* ----------------------------------------------------------- production --- */

export const STAGES = [
  { name: 'Boards ordered', done: 25, total: 25, note: 'Arrived from JLCPCB on 15 Sep. All 25 passed a visual check.' },
  { name: 'Assembled', done: 25, total: 25, note: 'Switches and encoders seated. Reflow done in two batches.' },
  { name: 'Cases printed', done: 14, total: 25, note: 'One printer, ~4.5 h per case. This is the bottleneck.' },
  { name: 'Units built', done: 9, total: 25, note: 'Board into case, knobs fitted, firmware flashed.' },
  { name: 'Packed', done: 4, total: 25, note: 'Boxed with the cable and the quick-start card.' },
  { name: 'Shipped', done: 0, total: 25, note: `Nothing ships until the ship window is set. Currently ${FILL_IN}.` },
];

export const STOCK: StockItem[] = [
  { name: 'PCBs', spec: 'v1.2 rev B', qty: 25, covers: 25, pct: 100, short: false },
  { name: 'Switches', spec: 'MX-compatible linear', qty: 260, covers: 28, pct: 100, short: false },
  { name: 'Keycaps', spec: 'blank PBT, 9-key', qty: 240, covers: 26, pct: 100, short: false },
  { name: 'Knobs', spec: 'machined aluminium', qty: 44, covers: 22, pct: 88, short: true },
  { name: 'Cases', spec: '3D printed in-house', qty: 14, covers: 14, pct: 56, short: true },
  { name: 'Boxes', spec: 'mailer + foam', qty: 30, covers: 30, pct: 100, short: false },
];

export const REORDER_ALERTS = [
  { stockIndex: 4, name: 'Filament', detail: '5 days of printing left at the current rate' },
  { stockIndex: 3, name: 'Knobs', detail: '18 days lead time from the machinist' },
];

export const UNIT_COST_PARTS = [
  { label: 'Board', value: 38.2 },
  { label: 'Switches', value: 18.0 },
  { label: 'Case', value: 12.6 },
  { label: 'Packaging', value: 9.4 },
  { label: 'Shipping', value: 18.2 },
];

/**
 * Product spec. Wording here is load-bearing: "13 underglow LEDs, underside
 * only" and "MX-compatible" are the §14 phrasings, not stylistic choices.
 */
export const SPEC = [
  { label: 'Keys', value: '9' },
  { label: 'Encoders', value: '2 dials' },
  { label: 'Switches', value: 'MX-compatible' },
  { label: 'LEDs', value: '13, underglow (underside)' },
  { label: 'MCU', value: 'RP2040' },
  { label: 'Assembly', value: 'New Zealand' },
];

/* ---------------------------------------------------------------- costs --- */

export const EXPENSES: Expense[] = [
  { date: '2025-09-18', item: 'PLA filament ×4kg', supplier: 'Filaform', category: 'Case', amount: 156, paid: true },
  { date: '2025-09-15', item: 'PCB run — 25 boards', supplier: 'JLCPCB', category: 'PCB', amount: 842, paid: true },
  { date: '2025-09-12', item: 'MX-compatible switches ×300', supplier: 'Switch Co.', category: 'PCB', amount: 318, paid: true },
  { date: '2025-09-09', item: 'Mailer boxes ×50', supplier: 'NZ Packaging', category: 'Packaging', amount: 212, paid: true },
  { date: '2025-09-04', item: 'Company registration', supplier: 'Companies Office', category: 'Legal', amount: 180, paid: true },
  { date: '2025-09-01', item: 'Knobs — machined ×50', supplier: 'Deposit held', category: 'PCB', amount: 420, paid: false },
  { date: '2025-10-01', item: 'Shopify + domain, 12 mo', supplier: 'Shopify', category: 'Software', amount: 468, paid: false },
];

export const SPEND_BY_CATEGORY: { category: Expense['category']; amount: number }[] = [
  { category: 'PCB', amount: 1580 },
  { category: 'Marketing', amount: 1130 },
  { category: 'Case', amount: 580 },
  { category: 'Software', amount: 468 },
  { category: 'Packaging', amount: 310 },
  { category: 'Legal', amount: 180 },
];

export const RUN_SIZE_COST = [
  { size: 5, cost: 164 },
  { size: 25, cost: 96 },
  { size: 50, cost: 78 },
  { size: 100, cost: 64 },
];

export const FOUNDER_SPLIT = [
  { name: OWNER, amount: 2310 },
  { name: CO_FOUNDER, amount: 1550 },
];

/* --------------------------------------------------------------- launch --- */

export const GATES: Gate[] = [
  { title: 'Firmware confirmed', detail: 'QMK builds and flashes on a real board. Both dials map.', owner: 'Jenil', state: 'done' },
  { title: 'Case fits a real board', detail: 'Printed case closes on an assembled PCB with the knobs on.', owner: 'Jenil', state: 'done' },
  { title: 'Adult on the business', detail: 'Company registered, both founders on the paperwork.', owner: CO_FOUNDER, state: 'done' },
  { title: 'Bank + payment processor', detail: 'Business account open, processor approved for pre-orders.', owner: CO_FOUNDER, state: 'done' },
  { title: 'False claims removed', detail: 'No false lighting claim, no switch brand name, no unearned origin claim.', owner: 'Jenil', state: 'done' },
  { title: '50 on the waitlist', detail: 'The floor for opening pre-orders on a 25-unit run.', owner: 'Jenil', state: 'prog' },
  { title: 'Price locked', detail: 'Unit cost is known. The price is not set, so nothing downstream can be.', owner: CO_FOUNDER, state: 'block' },
  { title: 'Ship window set', detail: 'Blocked on case printing. Do not publish a date until 25 of 25 are printed.', owner: 'Jenil', state: 'block' },
  { title: 'Pre-order live', detail: 'The last gate. Needs the price and the window before it can open.', owner: 'Jenil', state: 'block' },
];

export const WAITLIST_GROWTH = [2, 5, 9, 12, 18, 21, 26, 30, 34, 37, 39, 41];

/* ------------------------------------------------------------- customers --- */

export const SOURCE_STATS = [
  { source: 'TikTok', count: 17, converts: 41 },
  { source: 'Reddit', count: 9, converts: 56 },
  { source: 'Word of mouth', count: 7, converts: 43 },
  { source: 'Instagram', count: 5, converts: 20 },
  { source: 'YouTube', count: 3, converts: 33 },
];

/* --------------------------------------------------------------- content --- */

export const PLATFORMS = [
  { name: 'TikTok', reach: 14_200, followers: 312, best: 'Dial mapping in 20s' },
  { name: 'Instagram', reach: 3_800, followers: 96, best: 'Case print timelapse' },
  { name: 'YouTube', reach: 1_100, followers: 24, best: 'Why nine keys' },
];

export const REACH_SERIES = [1200, 2100, 1800, 3400, 2900, 4200, 3500];

export const WHAT_WORKS = [
  'Showing the dials doing real work beats showing the board.',
  'Under 25 seconds. Anything longer loses half the watch time.',
  'The case print timelapse converts better than any product shot.',
  'Saying what it cannot do earns more trust than the feature list.',
];

/* -------------------------------------------------------------- messages --- */

export const THREADS: Thread[] = [
  {
    name: 'T. Kahu',
    role: 'Customer · 3 units',
    email: 't.kahu@example.co.nz',
    place: 'Wellington, NZ',
    kind: 'customer',
    unread: 2,
    time: '09:42',
    preview: 'Any chance of a second knob colour before you ship?',
    link: { value: 'TD-0014', sub: '3 units · in production', label: 'Order', href: '/admin/orders' },
    messages: [
      { text: 'Just put in for three. One for me, two for the studio.', time: '09:31', outgoing: false },
      { text: 'Thanks — all three are in the build queue now.', time: '09:36', outgoing: true },
      { text: 'Any chance of a second knob colour before you ship?', time: '09:42', outgoing: false },
    ],
  },
  {
    name: 'Filaform',
    role: 'Supplier · filament',
    email: 'orders@filaform.example',
    place: 'Auckland, NZ',
    kind: 'supplier',
    unread: 1,
    time: 'Yesterday',
    preview: 'Restock lands Thursday. Want the 4kg or the 8kg?',
    link: { value: '$156.00', sub: 'PLA filament ×4kg · paid', label: 'Expense', href: '/admin/costs' },
    messages: [
      { text: 'Your last order shipped. Tracking is in your inbox.', time: '14:02', outgoing: false },
      { text: 'Got it, thanks. Printing through it faster than expected.', time: '15:10', outgoing: true },
      { text: 'Restock lands Thursday. Want the 4kg or the 8kg?', time: '16:48', outgoing: false },
    ],
  },
  {
    name: 'JLCPCB',
    role: 'Supplier · boards',
    email: 'support@jlcpcb.example',
    place: 'Shenzhen, CN',
    kind: 'supplier',
    unread: 0,
    time: 'Mon',
    preview: 'Rev B panel passed electrical test. Invoice attached.',
    link: { value: '$842.00', sub: 'PCB run — 25 boards · paid', label: 'Expense', href: '/admin/costs' },
    messages: [
      { text: 'Rev B panel passed electrical test. Invoice attached.', time: '11:20', outgoing: false },
      { text: 'Received, thanks. Any lead time change for a 50-board run?', time: '11:55', outgoing: true },
    ],
  },
  {
    name: 'M. Reid',
    role: 'Customer · 1 unit',
    email: 'm.reid@example.co.nz',
    place: 'Christchurch, NZ',
    kind: 'customer',
    unread: 0,
    time: 'Mon',
    preview: 'No rush on shipping, just glad to be in the first run.',
    link: { value: 'TD-0018', sub: '1 unit · pre-order', label: 'Order', href: '/admin/orders' },
    messages: [
      { text: 'No rush on shipping, just glad to be in the first run.', time: '08:15', outgoing: false },
      { text: 'Appreciated. We will not publish a date until we can hold it.', time: '09:02', outgoing: true },
    ],
  },
  {
    name: 'Switch Co.',
    role: 'Supplier · switches',
    email: 'sales@switchco.example',
    place: 'Taipei, TW',
    kind: 'supplier',
    unread: 0,
    time: '12 Sep',
    preview: '300 linears dispatched. Next price break is at 1,000.',
    link: { value: '$318.00', sub: 'Switches ×300 · paid', label: 'Expense', href: '/admin/costs' },
    messages: [
      { text: '300 linears dispatched. Next price break is at 1,000.', time: '13:40', outgoing: false },
    ],
  },
  {
    name: 'Companies Office',
    role: 'System · filing',
    email: 'no-reply@companies.example',
    place: 'New Zealand',
    kind: 'system',
    unread: 0,
    time: '4 Sep',
    preview: 'Registration confirmed. Annual return is due next September.',
    link: { value: '$180.00', sub: 'Company registration · paid', label: 'Expense', href: '/admin/costs' },
    messages: [
      { text: 'Registration confirmed. Annual return is due next September.', time: '10:05', outgoing: false },
    ],
  },
];

export const REPLY_TEMPLATES = [
  'Thanks for the order — you are in the first run of 25.',
  'We have not locked a ship window yet. When we do, you will hear it here first.',
  'Good question. The board has 13 underglow LEDs on the underside; they light the desk, not the keys.',
];

/* -------------------------------------------------------------- settings --- */

export const INTEGRATIONS = [
  { name: 'Stripe', detail: 'Payments', connected: true },
  { name: 'Shopify', detail: 'Storefront', connected: true },
  { name: 'Xero', detail: 'Accounting', connected: false },
  { name: 'Buffer', detail: 'Scheduling', connected: false },
  { name: 'Google Analytics', detail: 'Traffic', connected: false },
  { name: 'Slack', detail: 'Alerts', connected: false },
];

export const INVOICES = [
  { id: 'INV-003', date: '2025-09-01', amount: 0 },
  { id: 'INV-002', date: '2025-08-01', amount: 0 },
  { id: 'INV-001', date: '2025-07-01', amount: 0 },
];

export const HELP_TOPICS = [
  { title: 'Reading the Launch page', body: 'What the nine gates mean and which one is holding the rest up.' },
  { title: 'Orders and statuses', body: 'Pre-order, in production, shipped and refunded — and when each changes.' },
  { title: 'Production pipeline', body: 'The six stages, and why case printing is the bottleneck.' },
  { title: 'Costs and runway', body: 'How spent, committed and monthly burn produce the runway figure.' },
  { title: 'Waitlist and conversion', body: 'Where signups come from and how the gate at 50 is counted.' },
  { title: 'Publishing an update', body: 'Writing, saving a draft and publishing a devlog post from Content.' },
];

export const HELP_QUESTIONS = [
  {
    q: 'Why does the price show [FILL IN] everywhere?',
    a: 'Because it is not locked. Launch gate 7 is blocked on it, and gates 8 and 9 are blocked behind that. Rendering a placeholder rather than a number means no screenshot of this dashboard can be mistaken for a decision that has not been made.',
  },
  {
    q: 'When can we publish a ship date?',
    a: 'Not until case printing clears 25 of 25. It is at 14 today, on one printer at roughly 4.5 hours per case. A date published before then is a promise the build queue cannot keep.',
  },
  {
    q: 'Which numbers on here are real?',
    a: 'The Customers page and the devlog list on Content read from Supabase and are marked LIVE DATA. Every other page carries a SAMPLE DATA chip and is invented for planning.',
  },
  {
    q: 'Why are there two greens?',
    a: 'Lime is the UI accent and marks one thing per view — the active nav item, the primary action, a positive delta. Emerald is the ambient glow and the chart fill. Using them interchangeably flattens the whole interface.',
  },
  {
    q: 'What does the waitlist gate actually count?',
    a: 'Rows in the waitlist table in Supabase. It is the one gate on the Launch page wired to real data, so it moves on its own as people sign up.',
  },
  {
    q: 'Can I say the keys light up?',
    a: 'No. It has 13 LEDs on its underside that light the desk. It does not light the keys. Saying otherwise is a false product claim, not a wording preference. The full list of phrases to avoid is on this page under Copy rules.',
  },
  {
    q: 'Who can see this dashboard?',
    a: 'Only accounts on the admin allowlist. The list is enforced by row-level security in Postgres, not by this page — editing the page in a browser reveals nothing.',
  },
];
