import type { Product } from '../lib/catalog';

/**
 * Stand-in product imagery, drawn to match the deck rendering in the
 * configuration mockup: a dark shell, a recessed well, and a grid of keys.
 *
 * Replace with real vendor photography before launch — see docs/PRODUCTS.md.
 * Nobody buys hardware from a CSS drawing.
 */
export default function ProductArt({
  product,
  className = '',
}: {
  product: Product;
  className?: string;
}) {
  const cols = product.keyCount <= 3 ? 3 : 3;
  const keys = Array.from({ length: product.keyCount }, (_, index) => index);

  return (
    <div
      className={`flex items-center justify-center bg-surface p-10 ${className}`}
      role="img"
      aria-label={`${product.name} — placeholder product image`}
    >
      <div className="w-full max-w-[240px] bg-[#171514] p-3">
        <div className="bg-[#0d0c0c] p-2">
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {keys.map((index) => (
              <div
                key={index}
                className="aspect-square bg-[#2f2b2a]"
                style={
                  index === 0
                    ? { backgroundColor: '#ec3013' }
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between px-0.5">
          <span className="text-[9px] uppercase tracking-[0.14em] text-neutral-600">
            {product.model}
          </span>
          {product.dialCount > 0 && (
            <span className="flex gap-1.5" aria-hidden="true">
              {Array.from({ length: product.dialCount }, (_, index) => (
                <span key={index} className="h-3 w-3 rounded-full bg-[#2f2b2a]" />
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
