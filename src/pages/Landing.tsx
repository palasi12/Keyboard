import { Link } from 'react-router-dom';
import { PRODUCTS, formatPrice } from '../lib/catalog';
import ProductArt from '../components/ProductArt';

const STEPS = [
  {
    title: 'Plug it in',
    body: 'USB-C into any computer. No drivers, no install, no account needed to use it.',
  },
  {
    title: 'Assign your keys',
    body: 'Open the configurator and tell each key what to do — a shortcut, a macro, a whole sequence.',
  },
  {
    title: 'Stop hunting for shortcuts',
    body: 'The things you do fifty times a day become one press. That is the entire pitch.',
  },
];

const FAQ = [
  {
    q: 'What can I actually program the keys to do?',
    a: 'Keyboard shortcuts, text snippets, media controls, and multi-step macros with timing between steps. Anything your keyboard can already do, on one key.',
  },
  {
    q: 'Does it work with my computer?',
    a: 'Yes — Windows, macOS and Linux. The board stores your layout on itself, so it behaves the same on any machine you plug it into.',
  },
  {
    q: 'Do I need to solder anything?',
    a: 'No. Switches are hot-swappable, so you can pull them out and try different ones by hand.',
  },
  {
    q: 'How long is delivery?',
    a: 'Placeholder — confirm with your vendor before launch and replace this answer.',
  },
  {
    q: 'What is your returns policy?',
    a: 'Placeholder — you need a real returns policy before taking payments. This is a legal requirement in the UK and EU, not a nice-to-have.',
  },
];

export default function Landing() {
  const hero = PRODUCTS[1] ?? PRODUCTS[0];

  return (
    <>
      {/* ---------------------------------- hero ---------------------------------- */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px]
                     -translate-x-1/2 rounded-full bg-accent-500/15 blur-[120px]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-5 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full border border-ink-700
                         bg-ink-900 px-3 py-1 text-xs font-medium text-neutral-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              Free UK delivery over £30
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your shortcuts,
              <br />
              on real keys.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-400">
              A programmable mini keyboard for the things you do a hundred times a
              day. Mute, switch scenes, paste the thing, run the macro. One press.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/shop" className="btn-primary px-6 py-3 text-base">
                Shop keyboards
              </Link>
              <Link to="/#how" className="btn-ghost px-6 py-3 text-base">
                How it works
              </Link>
            </div>

            <p className="mt-5 text-sm text-neutral-500">
              From {formatPrice(Math.min(...PRODUCTS.map((p) => p.price)))} · Works with Windows,
              macOS and Linux
            </p>
          </div>

          {hero && (
            <div className="flex justify-center lg:justify-end">
              <ProductArt product={hero} className="w-full max-w-sm" />
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------- products ---------------------------------- */}
      <section id="shop" className="border-t border-ink-800/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Pick your size
          </h2>
          <p className="mt-4 max-w-lg text-neutral-400">
            Three, six or nine keys. They all do the same thing — you just decide how
            much of it you want.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product) => (
              <Link
                key={product.slug}
                to={`/product/${product.slug}`}
                className="card group overflow-hidden transition hover:border-ink-600"
              >
                <ProductArt product={product} className="rounded-none" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{product.name}</h3>
                      <p className="mt-1 text-sm text-neutral-500">{product.tagline}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatPrice(product.price)}</p>
                      {product.compareAt && (
                        <p className="text-xs text-neutral-600 line-through">
                          {formatPrice(product.compareAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-medium text-accent-400 group-hover:text-accent-500">
                    {product.inStock ? 'View details →' : 'Out of stock'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------- how ---------------------------------- */}
      <section id="how" className="border-t border-ink-800/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title}>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15
                             text-sm font-bold text-accent-400"
                >
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------- faq ---------------------------------- */}
      <section id="faq" className="border-t border-ink-800/60 py-20">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Questions
          </h2>
          <div className="mt-10 divide-y divide-ink-800">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left font-medium text-white marker:content-['']">
                  {item.q}
                  <span className="shrink-0 text-neutral-500 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
