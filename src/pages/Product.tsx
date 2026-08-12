import { Link, useParams } from 'react-router-dom';
import { findProduct, formatPrice } from '../lib/catalog';
import { useCart } from '../lib/cart';
import ProductArt from '../components/ProductArt';
import Seo from '../components/Seo';

export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? findProduct(slug) : undefined;
  const { add } = useCart();

  if (!product) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center">
        <Seo title="Product not found" description="That product does not exist." />
        <h1 className="text-2xl font-heading text-neutral-100">We could not find that product</h1>
        <Link to="/" className="btn-primary mt-6">
          Back to the site
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-shell px-5 py-14">
      <Seo
        title={`${product.name} — ${product.keyCount} programmable keys`}
        description={product.description}
        path={`/product/${product.slug}`}
        image="/og.svg"
      />
      <nav className="mb-8 text-sm text-neutral-500">
        <Link to="/" className="transition hover:text-neutral-100">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-400">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        <ProductArt product={product} />

        <div>
          <h1 className="text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-lg text-neutral-400">{product.tagline}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-heading text-neutral-100">
              {formatPrice(product.price)}
            </span>
            {product.compareAt && (
              <span className="text-lg text-neutral-600 line-through">
                {formatPrice(product.compareAt)}
              </span>
            )}
          </div>

          <p className="mt-6 leading-relaxed text-neutral-400">{product.description}</p>

          <ul className="mt-7 space-y-2.5">
            {product.features.map((feature) => (
              <li key={feature} className="flex gap-2.5 text-sm text-neutral-300">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent-500"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M13 4.5 6.5 11 3 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-9">
            {product.inStock ? (
              <button
                type="button"
                onClick={() => add(product.slug)}
                className="btn-primary w-full py-3 text-base sm:w-auto sm:px-10"
              >
                Add to basket
              </button>
            ) : (
              <Link to="/#waitlist" className="btn-primary w-full justify-center py-3 text-base sm:w-auto sm:px-10">
                Join the waitlist
              </Link>
            )}
            <p className="mt-3 text-sm text-neutral-500">
              Not on sale yet — join the waitlist and you&apos;ll hear about the first batch.
            </p>
          </div>

          <div className="mt-10 border-t-2 border-divider pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
              Specifications
            </h2>
            <dl className="mt-4 divide-y-2 divide-divider">
              {product.specs.map((spec) => (
                <div key={spec.label} className="flex justify-between gap-6 py-3 text-sm">
                  <dt className="text-neutral-500">{spec.label}</dt>
                  <dd className="text-right text-neutral-200">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
