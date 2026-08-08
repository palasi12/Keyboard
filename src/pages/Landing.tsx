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
      <section className="border-b-2 border-divider">
        <div className="mx-auto grid max-w-shell gap-14 px-5 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <p className="kicker">Free UK delivery over £30</p>

            <h1 className="mt-4 text-5xl font-heading leading-[1.05] tracking-heading text-neutral-100 sm:text-6xl lg:text-7xl">
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
              <Link to="/#how" className="btn-secondary px-6 py-3 text-base">
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
      <section id="shop" className="border-t-2 border-divider py-20">
        <div className="mx-auto max-w-shell px-5">
          <p className="kicker">01 — Range</p>
          <h2 className="mt-3 text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
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
                className="card group overflow-hidden transition hover:border-neutral-500"
              >
                <ProductArt product={product} className="rounded-none" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-neutral-100">{product.name}</h3>
                      <p className="mt-1 text-sm text-neutral-500">{product.tagline}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-100">{formatPrice(product.price)}</p>
                      {product.compareAt && (
                        <p className="text-xs text-neutral-600 line-through">
                          {formatPrice(product.compareAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-medium text-accent-500 group-hover:text-accent-500">
                    {product.inStock ? 'View details →' : 'Out of stock'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------- how ---------------------------------- */}
      <section id="how" className="border-t-2 border-divider py-20">
        <div className="mx-auto max-w-shell px-5">
          <p className="kicker">02 — Setup</p>
          <h2 className="mt-3 text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title}>
                <span className="flex h-9 w-9 items-center justify-center bg-accent text-sm font-heading text-ground">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold text-neutral-100">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ poster statement ------------------------------ */}
      <section className="border-t-2 border-divider bg-accent">
        <div className="mx-auto max-w-shell px-5 py-16">
          <p className="text-[10px] uppercase tracking-[0.1em] text-accent-200">
            Taptile Mini · TP-09D2
          </p>
          <h2 className="mt-3 max-w-3xl text-4xl font-heading leading-[1.05] tracking-heading text-ground sm:text-5xl">
            Nine keys. Two dials.
            <br />
            Every shortcut you own.
          </h2>
          <Link
            to="/product/taptile-mini"
            className="btn mt-8 bg-ground px-6 py-3 text-base text-neutral-100 hover:bg-neutral-900"
          >
            See the Mini
          </Link>
        </div>
      </section>

      {/* ---------------------------------- faq ---------------------------------- */}
      <section id="faq" className="border-t-2 border-divider py-20">
        <div className="mx-auto max-w-3xl px-5">
          <p className="kicker">03 — Questions</p>
          <h2 className="mt-3 text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
            Questions
          </h2>
          <div className="mt-10 divide-y-2 divide-divider">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left font-medium text-neutral-100 marker:content-['']">
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
