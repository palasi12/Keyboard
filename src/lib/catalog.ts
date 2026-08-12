/**
 * Product catalogue.
 *
 * PLACEHOLDER DATA. Every price, spec and model number here is invented so the
 * site has something to render. Replace all of it with the real vendor listing
 * before launch — see docs/PRODUCTS.md.
 *
 * `inStock` is false on every board on purpose: there is no supplier and no
 * stock, so the product pages must not offer an "Add to basket" that implies
 * an order can be placed.
 *
 * Naming and model codes follow the configuration mockup, which shows
 * "Taptile Mini · TP-09D2" as the nine-key board.
 *
 * Prices are in pence. Floating-point money is how you end up charging
 * someone £19.999999.
 */

export interface Product {
  slug: string;
  name: string;
  /** Model code shown on the hardware, e.g. TP-09D2. */
  model: string;
  tagline: string;
  /** Price in pence. 3900 = £39.00 */
  price: number;
  compareAt?: number;
  keyCount: number;
  /** Rotary encoders. Zero on the smallest board. */
  dialCount: number;
  description: string;
  specs: Array<{ label: string; value: string }>;
  features: string[];
  /** Fallback block colour used in the basket rows. */
  swatch: string;
  inStock: boolean;
}

export const CURRENCY = 'GBP';

export function formatPrice(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: CURRENCY,
  }).format(pence / 100);
}

export const PRODUCTS: Product[] = [
  {
    slug: 'taptile-nano',
    name: 'Taptile Nano',
    model: 'TP-03D0',
    tagline: 'Three keys. Start somewhere.',
    price: 2400,
    keyCount: 3,
    dialCount: 0,
    description:
      'The smallest board. Three mechanical keys for the three things you do a hundred times a day — mute, cut, save, whatever you decide they are.',
    specs: [
      { label: 'Keys', value: '3 mechanical' },
      { label: 'Dials', value: 'None' },
      { label: 'Switch', value: 'Blue clicky, hot-swappable' },
      { label: 'Connection', value: 'USB-C' },
      { label: 'Polling', value: '1000 Hz' },
      { label: 'Dimensions', value: '70 × 40 × 30 mm' },
      { label: 'Compatibility', value: 'Windows, macOS, Linux' },
    ],
    features: [
      'Fully programmable — any key, combo, or macro',
      'Hot-swappable switches, no soldering',
      'Layouts stored on the board itself',
      'Braided USB-C cable included',
    ],
    swatch: '#2f2b2a',
    inStock: false,
  },
  {
    slug: 'taptile-mini',
    name: 'Taptile Mini',
    model: 'TP-06D1',
    tagline: 'Six keys and a dial.',
    price: 3900,
    keyCount: 6,
    dialCount: 1,
    description:
      'Six keys plus a rotary encoder for volume, scrubbing, or brush size. The one most people should buy.',
    specs: [
      { label: 'Keys', value: '6 mechanical' },
      { label: 'Dials', value: '1 rotary encoder, push to click' },
      { label: 'Switch', value: 'Red linear, hot-swappable' },
      { label: 'Connection', value: 'USB-C' },
      { label: 'Polling', value: '1000 Hz' },
      { label: 'Dimensions', value: '95 × 65 × 30 mm' },
      { label: 'Compatibility', value: 'Windows, macOS, Linux' },
    ],
    features: [
      'Rotary encoder with push-to-click',
      'Fully programmable — any key, combo, or macro',
      'Multiple profiles, switched per application',
      'Hot-swappable switches, no soldering',
    ],
    swatch: '#3a3634',
    inStock: false,
  },
  {
    slug: 'taptile-pro',
    name: 'Taptile Pro',
    model: 'TP-09D2',
    tagline: 'Nine keys, two dials.',
    price: 5400,
    keyCount: 9,
    dialCount: 2,
    description:
      'For people who already know they need more keys. Nine of them, two encoders, and a stand that sets it at a sensible angle.',
    specs: [
      { label: 'Keys', value: '9 mechanical' },
      { label: 'Dials', value: '2 rotary encoders, push to click' },
      { label: 'Switch', value: 'Brown tactile, hot-swappable' },
      { label: 'Connection', value: 'USB-C' },
      { label: 'Polling', value: '1000 Hz' },
      { label: 'Dimensions', value: '120 × 95 × 32 mm' },
      { label: 'Compatibility', value: 'Windows, macOS, Linux' },
    ],
    features: [
      'Two rotary encoders with independent sensitivity',
      'Adjustable aluminium stand included',
      'Fully programmable — any key, combo, or macro',
      'Hot-swappable switches, no soldering',
    ],
    swatch: '#ec3013',
    inStock: false,
  },
];

export function findProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
