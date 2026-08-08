import type { Product } from '../lib/catalog';

/**
 * Stand-in product imagery.
 *
 * Draws a plausible key grid from the product's key count so the site looks
 * finished before real photography exists. Replace with actual vendor photos
 * before launch — customers do not buy from CSS drawings.
 */
export default function ProductArt({
  product,
  className = '',
}: {
  product: Product;
  className?: string;
}) {
  const cols = product.keyCount <= 3 ? 3 : product.keyCount <= 6 ? 3 : 3;
  const keys = Array.from({ length: product.keyCount }, (_, index) => index);

  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-ink-900 p-8 ${className}`}
      role="img"
      aria-label={`${product.name} — placeholder product image`}
    >
      <div className="w-full max-w-[220px] rounded-xl bg-ink-800 p-4 shadow-2xl shadow-black/40">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {keys.map((index) => (
            <div
              key={index}
              className="aspect-square rounded-md"
              style={{
                backgroundColor: product.swatch,
                opacity: 0.35 + (index % 3) * 0.22,
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between px-0.5">
          <span className="h-1.5 w-8 rounded-full bg-ink-700" />
          <span className="h-3 w-3 rounded-full border-2 border-ink-700" />
        </div>
      </div>
    </div>
  );
}
