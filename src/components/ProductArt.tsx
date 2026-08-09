import type { Product } from '../lib/catalog';

/**
 * Stand-in product imagery, drawn to match the hardware rendering in the
 * configurator: a rounded shell with a nameplate band, a well of bezelled
 * keycaps, and rotary dials below.
 *
 * `detailed` renders the configurator's full treatment — key indices, action
 * labels and the ROTARY divider — for the hero. The compact form is used in
 * product cards.
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
  const size = detailed ? 78 : 56;

  return (
    <div
      className={`stage-soft flex items-center justify-center rounded-xl ${detailed ? 'p-8' : 'p-7'} ${className}`}
      role="img"
      aria-label={`${product.name} — placeholder product image`}
    >
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-shell">
        {/* nameplate band */}
        <div className="flex items-center gap-2.5 border-b border-hairline bg-white/[0.02] px-4 py-2.5">
          <span className="h-2 w-4 rounded-sm border border-neutral-900 bg-bezel" />
          <span className="font-heading text-[9px] uppercase tracking-[0.18em] text-neutral-400">
            {product.name}
          </span>
          <span className="ml-auto text-[8.5px] tracking-[0.14em] text-neutral-700">
            {product.model}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#3ec95f]" />
        </div>

        <div className={detailed ? 'px-6 pb-6 pt-5' : 'p-4'}>
          <div
            className="grid gap-2.5"
            style={{
              gridTemplateColumns: `repeat(3, ${size}px)`,
              gridAutoRows: `${size}px`,
            }}
          >
            {keys.map((index) => {
              const selected = detailed && index === 4;
              return (
                <div key={index} className={`cap ${selected ? 'cap-selected' : ''}`}>
                  <span className="cap-face relative flex-col gap-1">
                    {detailed && (
                      <span
                        className={`absolute left-1.5 top-1 font-heading text-[8px] tracking-[0.1em] ${
                          selected ? 'text-keycap/50' : 'text-neutral-700'
                        }`}
                      >
                        K{index + 1}
                      </span>
                    )}
                    {detailed && (
                      <span
                        className={`px-1 text-center text-[9.5px] leading-tight ${
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

          {dials.length > 0 && (
            <>
              {detailed ? (
                <div className="my-4 flex items-center gap-2.5">
                  <span className="text-[9.5px] uppercase tracking-[0.16em] text-neutral-500">
                    Rotary
                  </span>
                  <span className="h-0.5 flex-1 bg-divider" />
                </div>
              ) : (
                <div className="my-4 h-px w-full bg-hairline" />
              )}

              <div className={`flex justify-center ${detailed ? 'gap-8' : 'gap-5'}`}>
                {dials.map((index) => (
                  <span key={index} className="flex flex-col items-center gap-1.5">
                    <span
                      className="grid place-items-center rounded-full border-2 border-bezel bg-bezel p-1 shadow-cap"
                      style={{ width: detailed ? 78 : 44, height: detailed ? 78 : 44 }}
                    >
                      <span className="grid h-full w-full place-items-center rounded-full bg-keycap">
                        {detailed && (
                          <span className="text-[9px] text-neutral-500">
                            {DIAL_LABELS[index] ?? `Dial ${index + 1}`}
                          </span>
                        )}
                      </span>
                    </span>
                    {detailed && (
                      <span className="font-heading text-[8px] tracking-[0.14em] text-neutral-700">
                        D{index + 1}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
