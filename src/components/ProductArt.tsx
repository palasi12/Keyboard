import type { Product } from '../lib/catalog';

/**
 * Stand-in product imagery, drawn to match the real Rev A9 top plate as the
 * configurator renders it:
 *
 *   ┌──────────────────────────────┐
 *   │ ▬  TAPTILE DIALECT   TP-09D2 ●│  name bar
 *   │ ┌──────────────────────────┐ │
 *   │ │ ◆              ◎     ◎   │ │  rear strip — emblem left, encoders right
 *   │ └──────────────────────────┘ │
 *   │ ┌──────────────────────────┐ │
 *   │ │  ▢  ▢  ▢                 │ │  deck — the key cluster
 *   │ │  ▢  ▢  ▢                 │ │
 *   │ │  ▢  ▢  ▢                 │ │
 *   │ └──────────────────────────┘ │
 *   └──────────────────────────────┘
 *
 * The encoders sit at the REAR of the plate, behind the key cluster — not
 * below it — with the logo emblem to their left. The board has underglow only,
 * so no keycap here carries an RGB tint.
 *
 * `detailed` renders the configurator's full treatment — key indices, action
 * labels, dial detents — for the hero. The compact form is used in product
 * cards and the basket.
 *
 * Replace with real vendor photography before launch — see docs/PRODUCTS.md.
 * Nobody buys hardware from a CSS drawing.
 */

const KEY_LABELS = [
  'Scrub',
  'Cut',
  'Ripple Del',
  'Mark In/Out',
  'Undo',
  'Redo',
  'Save',
  'Zoom In',
  'Play/Pause',
];

const DIAL_LABELS = ['Scrub', 'Volume'];

/** Steps per detent, as the configurator ships them. */
const DIAL_STEPS = [4, 4];

/**
 * The Taptile mark — an isometric hexagonal keycap with an aircraft and swoosh
 * across it. Same paths the configurator uses, so the emblem on the drawn
 * plate matches the emblem in the software.
 */
export function LogoMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <g transform="translate(0.00,0.18) scale(0.120527)">
        <g transform="translate(0.000000,528.000000) scale(0.100000,-0.100000)" fill="currentColor">
          <path d="M2539 5265 c-176 -25 -282 -74 -477 -218 -48 -35 -188 -133 -312 -216 -340 -229 -833 -567 -1203 -824 -173 -120 -272 -246 -291 -370 -3 -17 -17 -111 -31 -207 -15 -96 -40 -254 -55 -350 -16 -96 -33 -215 -39 -265 -10 -87 -66 -451 -96 -625 -64 -364 -41 -492 112 -641 104 -101 137 -125 803 -569 316 -210 601 -403 634 -429 131 -101 703 -469 767 -494 207 -81 426 -77 654 12 74 29 722 453 824 540 59 50 201 148 846 580 467 313 534 368 591 489 60 127 57 168 -82 1062 -34 223 -49 323 -79 540 -65 476 -97 549 -300 699 -97 73 -1660 1123 -1762 1184 -98 60 -142 75 -274 97 -68 11 -128 20 -134 19 -5 -1 -49 -7 -96 -14z m286 -90 c33 -9 94 -33 135 -53 102 -52 1833 -1219 1894 -1278 100 -97 93 -65 240 -1066 19 -128 53 -356 76 -505 68 -454 68 -451 10 -570 -37 -74 -98 -132 -247 -233 -59 -41 -259 -178 -444 -305 -184 -126 -414 -283 -510 -348 -96 -65 -343 -233 -549 -374 -525 -357 -608 -390 -881 -350 -210 31 -119 -24 -1399 845 -333 226 -677 459 -764 518 -278 187 -336 286 -302 511 8 54 33 222 56 373 22 151 56 376 75 500 19 124 46 304 60 400 76 521 81 534 245 654 76 56 1421 980 1680 1154 210 141 412 182 625 127z" />
          <path d="M3274 4022 c-78 -31 -149 -63 -158 -71 -14 -12 -30 -12 -94 -3 -267 40 -507 15 -674 -69 -49 -25 -65 -29 -82 -20 -25 12 -415 91 -450 91 -61 0 -81 -49 -28 -68 426 -154 395 -138 376 -190 -15 -43 -18 -112 -5 -112 5 0 17 24 25 53 18 63 56 106 75 84 6 -8 31 -20 56 -27 101 -28 95 -33 -227 -219 -243 -140 -268 -160 -229 -181 40 -21 85 -7 446 136 210 83 383 146 400 146 17 -1 207 -38 423 -82 463 -94 472 -95 472 -39 0 18 -14 25 -224 100 -163 59 -165 62 -47 116 76 35 169 41 265 17 63 -15 63 23 1 79 -60 55 -60 55 -43 101 32 85 1 96 -125 44 -76 -31 -107 -32 -111 -3 0 5 44 35 99 67 105 61 114 70 95 93 -24 28 -90 16 -236 -43z m-470 -151 c40 -44 -98 -91 -211 -72 -183 30 -97 83 148 90 34 1 50 -4 63 -18z m405 -86 c23 -23 23 -24 7 -71 -14 -43 -14 -49 -1 -64 35 -39 -6 -39 -107 -1 -120 44 -132 55 -98 83 109 88 152 99 199 53z" />
        </g>
      </g>
    </svg>
  );
}

/** Knurled detent ring around an encoder cap. */
function DialTicks() {
  const marks = Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * Math.PI * 2;
    const major = i % 9 === 0;
    const r1 = 25;
    const r2 = major ? 20 : 22.5;
    return {
      key: i,
      x1: 31 + Math.sin(angle) * r1,
      y1: 31 - Math.cos(angle) * r1,
      x2: 31 + Math.sin(angle) * r2,
      y2: 31 - Math.cos(angle) * r2,
      w: major ? 1.2 : 0.7,
    };
  });

  return (
    <svg viewBox="0 0 62 62" className="absolute inset-0 h-full w-full" aria-hidden="true">
      {marks.map((m) => (
        <line
          key={m.key}
          x1={m.x1.toFixed(1)}
          y1={m.y1.toFixed(1)}
          x2={m.x2.toFixed(1)}
          y2={m.y2.toFixed(1)}
          stroke="rgba(255,255,255,.18)"
          strokeWidth={m.w}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

export default function ProductArt({
  product,
  className = '',
  detailed = false,
}: {
  product: Product;
  className?: string;
  detailed?: boolean;
}) {
  const keys = Array.from({ length: product.keyCount }, (_, index) => index);
  const dials = Array.from({ length: product.dialCount }, (_, index) => index);

  const shellWidth = detailed ? 372 : 268;
  const dialFace = detailed ? 56 : 40;

  return (
    <div
      className={`stage-soft flex items-center justify-center rounded-xl ${detailed ? 'p-8' : 'p-7'} ${className}`}
      role="img"
      aria-label={`${product.name} — placeholder product image`}
    >
      {/* the plate */}
      <div
        className="relative rounded-xl border border-hairline bg-surface p-3.5 shadow-shell"
        style={{ width: shellWidth }}
      >
        {/* case screws, top corners */}
        <span className="absolute left-2 top-2 h-[3px] w-[3px] rounded-full bg-white/10" />
        <span className="absolute right-2 top-2 h-[3px] w-[3px] rounded-full bg-white/10" />

        {/* name bar */}
        <div className="flex items-center gap-2.5 px-1 pb-3">
          <span className="h-1 w-5 rounded-sm bg-bezel" />
          <span className="flex-1 font-heading text-[9.5px] uppercase tracking-[0.15em] text-neutral-400">
            {product.name}
          </span>
          <span className="text-[9.5px] tracking-[0.06em] text-neutral-700">{product.model}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#3ec95f]" />
        </div>

        {/* rear strip — emblem left, encoders right */}
        <div className="mb-2.5 flex items-center gap-2.5 rounded-lg border border-hairline bg-keycap/60 px-3 pb-1.5 pt-2">
          <span className="shrink-0 px-0.5 text-neutral-600">
            <LogoMark size={detailed ? 26 : 20} />
          </span>

          <div className="flex flex-1 justify-end gap-2.5">
            {dials.map((index) => (
              <span
                key={index}
                className="flex flex-col items-center gap-1.5 rounded-lg px-1 pb-1 pt-1.5"
                style={{ width: detailed ? 82 : 58 }}
              >
                <span
                  className="relative grid place-items-center rounded-full border border-bezel shadow-cap"
                  style={{
                    width: dialFace,
                    height: dialFace,
                    background: 'radial-gradient(circle at 50% 34%, #2b2826, #131111 72%)',
                  }}
                >
                  <DialTicks />
                </span>
                {detailed && (
                  <>
                    <span className="text-[9.5px] text-neutral-400">
                      {DIAL_LABELS[index] ?? `Dial ${index + 1}`}
                    </span>
                    <span className="text-[8.5px] tracking-[0.05em] text-neutral-700">
                      D{index + 1} · {DIAL_STEPS[index] ?? 4} steps
                    </span>
                  </>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* deck — the key cluster */}
        <div className="rounded-lg border border-hairline bg-ground p-3">
          <div className="grid grid-cols-3 gap-2">
            {keys.map((index) => {
              const selected = detailed && index === 0;
              return (
                <div
                  key={index}
                  className={`cap aspect-[1/0.93] ${selected ? 'cap-selected' : ''}`}
                >
                  <span className="cap-face relative flex-col gap-1.5">
                    {detailed && (
                      <span
                        className={`absolute left-1.5 top-1 font-heading text-[8px] tracking-[0.05em] ${
                          selected ? 'text-keycap/50' : 'text-neutral-700'
                        }`}
                      >
                        K{index + 1}
                      </span>
                    )}
                    {detailed && (
                      <span
                        className={`max-w-full truncate px-1 text-center text-[9.5px] leading-tight ${
                          selected ? 'text-keycap/70' : 'text-neutral-500'
                        }`}
                      >
                        {KEY_LABELS[index] ?? `Key ${index + 1}`}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
