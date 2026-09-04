/**
 * Product catalogue.
 *
 * One board, because one board exists: the Taptile Dialect, Rev A9. Nine keys,
 * two encoders, RP2040. Everything here is either measured off the Rev A9 board
 * brief or specified by the build — nothing is invented.
 *
 * The footprint below is DERIVED, not measured: the case encases the Rev A9
 * board (64 x 91 mm) with 3 mm walls. Measure the first printed shell and
 * correct it. Height is still absent because nothing about it is known yet.
 *
 * `inStock` is false on purpose: there is no stock and no checkout, so the
 * product page offers the waitlist rather than an "Add to basket" that implies
 * an order can be placed.
 *
 * Prices are in cents. Floating-point money is how you end up charging someone
 * $19.999999.
 */

export interface Product {
  slug: string;
  name: string;
  /** Model code shown on the hardware, e.g. TP-09D2. */
  model: string;
  tagline: string;
  /** Price in cents. 7000 = $70.00 */
  price: number;
  compareAt?: number;
  keyCount: number;
  /** Rotary encoders. */
  dialCount: number;
  description: string;
  specs: Array<{ label: string; value: string }>;
  features: string[];
  /** Product photography. Falls back to the drawn board when absent. */
  image?: string;
  /** Fallback block colour used in the basket rows. */
  swatch: string;
  inStock: boolean;
}

export const CURRENCY = 'NZD';

export function formatPrice(cents: number): string {
  // en-US rather than en-NZ on purpose: it renders NZD as "NZ$70.00" instead of
  // a bare "$70.00", which half the internet would read as US dollars.
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: CURRENCY,
    currencyDisplay: 'symbol',
  }).format(cents / 100);
}

export const PRODUCTS: Product[] = [
  {
    slug: 'taptile-dialect',
    name: 'Taptile Dialect',
    model: 'TP-09D2',
    tagline: 'Nine keys, two dials.',
    price: 7000,
    keyCount: 9,
    dialCount: 2,
    description:
      'Nine mechanical keys and two rotary encoders, designed by a video editor for the shortcuts you hit a hundred times a day. Scrub with one dial, ride levels with the other, and put the nine things you actually use under your left hand.',
    specs: [
      { label: 'Switches', value: 'Gateron tactile, 9 keys' },
      { label: 'Keycaps', value: 'XDA profile' },
      { label: 'Key spacing', value: '19.05 mm — standard MX pitch' },
      { label: 'Dials', value: '2 rotary encoders, push to click' },
      { label: 'Dial caps', value: 'Machined aluminium' },
      { label: 'Lighting', value: '10-LED perimeter underglow' },
      { label: 'Case', value: '3D-printed shell, laser-cut acrylic base plate' },
      { label: 'Controller', value: 'RP2040' },
      { label: 'Connection', value: 'USB-C' },
      { label: 'Polling', value: '1000 Hz' },
      { label: 'Board', value: '64 × 91 mm' },
      { label: 'Footprint', value: '70 × 97 mm' },
      { label: 'Compatibility', value: 'Windows, macOS, Linux' },
      { label: 'Designed in', value: 'Auckland, New Zealand' },
    ],
    features: [
      'Two rotary encoders with independent sensitivity',
      'Gateron tactile switches on a standard 19.05 mm grid',
      'Machined aluminium dial caps',
      'Acrylic base plate that doubles as the underglow diffuser',
      'Fully programmable — any key, combo, or macro',
      'Designed and assembled in New Zealand',
    ],
    image: '/dialect-hero.png',
    swatch: '#8b6bff',
    inStock: false,
  },
];

/**
 * Slugs the site used to publish. Anyone holding an old link — or an old
 * basket in local storage — lands on the Dialect rather than a 404.
 */
const LEGACY_SLUGS: Record<string, string> = {
  'taptile-nano': 'taptile-dialect',
  'taptile-mini': 'taptile-dialect',
  'taptile-pro': 'taptile-dialect',
  'taptile-three': 'taptile-dialect',
  'taptile-six': 'taptile-dialect',
};

export function findProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === (LEGACY_SLUGS[slug] ?? slug));
}
