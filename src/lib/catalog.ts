/**
 * Product catalogue.
 *
 * PLACEHOLDER DATA. Every price, spec and image here is invented so the site
 * has something to render. Before this goes live you must replace all of it
 * with the real vendor listing — see docs/PRODUCTS.md.
 *
 * Prices are stored in minor units (pence) because floating-point money is
 * how you end up charging someone £19.999999.
 */

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  /** Price in pence. 3900 = £39.00 */
  price: number;
  /** Optional was-price for showing a discount. Also in pence. */
  compareAt?: number;
  keyCount: number;
  description: string;
  specs: Array<{ label: string; value: string }>;
  features: string[];
  /** Placeholder art is generated from these until real photos exist. */
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
    slug: 'taptile-3',
    name: 'Taptile 3',
    tagline: 'Three keys. Start somewhere.',
    price: 2400,
    keyCount: 3,
    description:
      'The smallest one. Three mechanical keys for the three things you do a hundred times a day — mute, copy, paste, whatever you decide.',
    specs: [
      { label: 'Keys', value: '3 mechanical' },
      { label: 'Switch', value: 'Blue clicky (hot-swappable)' },
      { label: 'Connection', value: 'USB-C' },
      { label: 'Lighting', value: 'Per-key RGB' },
      { label: 'Dimensions', value: '70 × 40 × 30 mm' },
      { label: 'Compatibility', value: 'Windows, macOS, Linux' },
    ],
    features: [
      'Fully programmable — any key, combo, or macro',
      'Hot-swappable switches, no soldering',
      'Plug and play, no drivers',
      'Braided USB-C cable included',
    ],
    swatch: '#5b6dff',
    inStock: true,
  },
  {
    slug: 'taptile-6',
    name: 'Taptile 6',
    tagline: 'Six keys and a knob.',
    price: 3900,
    compareAt: 4900,
    keyCount: 6,
    description:
      'Six keys plus a rotary encoder for volume, scrubbing, or brush size. The one most people should buy.',
    specs: [
      { label: 'Keys', value: '6 mechanical + 1 rotary encoder' },
      { label: 'Switch', value: 'Red linear (hot-swappable)' },
      { label: 'Connection', value: 'USB-C' },
      { label: 'Lighting', value: 'Per-key RGB' },
      { label: 'Dimensions', value: '95 × 65 × 30 mm' },
      { label: 'Compatibility', value: 'Windows, macOS, Linux' },
    ],
    features: [
      'Rotary encoder with push-to-click',
      'Fully programmable — any key, combo, or macro',
      'Hot-swappable switches, no soldering',
      'Multiple layers for different apps',
    ],
    swatch: '#10b981',
    inStock: true,
  },
  {
    slug: 'taptile-9',
    name: 'Taptile 9',
    tagline: 'Nine keys, two knobs.',
    price: 5400,
    keyCount: 9,
    description:
      'For people who already know they need more keys. Nine of them, two encoders, and a stand that sets it at a sensible angle.',
    specs: [
      { label: 'Keys', value: '9 mechanical + 2 rotary encoders' },
      { label: 'Switch', value: 'Brown tactile (hot-swappable)' },
      { label: 'Connection', value: 'USB-C' },
      { label: 'Lighting', value: 'Per-key RGB' },
      { label: 'Dimensions', value: '120 × 95 × 32 mm' },
      { label: 'Compatibility', value: 'Windows, macOS, Linux' },
    ],
    features: [
      'Two rotary encoders',
      'Adjustable aluminium stand included',
      'Fully programmable — any key, combo, or macro',
      'Hot-swappable switches, no soldering',
    ],
    swatch: '#f59e0b',
    inStock: false,
  },
];

export function findProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
