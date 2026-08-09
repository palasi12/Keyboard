import { Link } from 'react-router-dom';
import { PRODUCTS, formatPrice } from '../lib/catalog';
import ProductArt from '../components/ProductArt';
import Seo from '../components/Seo';

export default function Shop() {
  return (
    <>
      <Seo
        title="Shop all keyboards"
        description="Every Taptile board: three, six or nine keys, hot-swappable switches, USB-C. From £24."
        path="/shop"
        image="/og.svg"
      />
      <section className="mx-auto max-w-shell px-5 py-16">
      <h1 className="text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">All keyboards</h1>
      <p className="mt-3 text-neutral-400">Every board is fully programmable and hot-swappable.</p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((product) => (
          <Link
            key={product.slug}
            to={`/product/${product.slug}`}
            className="card group overflow-hidden transition hover:border-neutral-500"
          >
            <ProductArt product={product} className="rounded-none" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-neutral-100">{product.name}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{product.keyCount} keys</p>
                </div>
                <p className="font-bold text-neutral-100">{formatPrice(product.price)}</p>
              </div>
              <p className="mt-4 text-sm font-medium text-accent-500 group-hover:text-accent-500">
                {product.inStock ? 'View details →' : 'Out of stock'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
    </>
  );
}
