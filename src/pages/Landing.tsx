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

const MARQUEE = [
  'Premiere Pro',
  'Photoshop',
  'Lightroom',
  'DaVinci Resolve',
  'After Effects',
  'OBS',
  'Figma',
  'Ableton',
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
  const hero = PRODUCTS[2] ?? PRODUCTS[0];

  return (
    <>
      {/* ---------------------------------- hero ---------------------------------- */}
      <section className="stage border-b-2 border-divider">
        <div className="mx-auto grid max-w-shell gap-14 px-5 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white/[0.03] px-3.5 py-1.5 text-[11px] tracking-[0.06em] text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-100" />
              Free UK delivery over £30
            </p>

            <h1 className="mt-6 text-5xl font-heading leading-[1.05] tracking-heading text-neutral-100 sm:text-6xl lg:text-7xl">
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

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500">
              <span>
                From {formatPrice(Math.min(...PRODUCTS.map((p) => p.price)))}
              </span>
              <span className="h-3 w-px bg-divider" />
              <span>Windows, macOS, Linux</span>
              <span className="h-3 w-px bg-divider" />
              <span>Hot-swappable switches</span>
            </div>
          </div>

          {hero && (
            <div className="flex animate-rise justify-center lg:justify-end">
              <ProductArt product={hero} detailed />
            </div>
          )}
        </div>
      </section>

      {/* --------------------------------- marquee --------------------------------- */}
      <section className="border-b-2 border-divider">
        <div className="mx-auto flex max-w-shell flex-wrap items-center gap-x-8 gap-y-3 px-5 py-5">
          <p className="kicker">Profiles for</p>
          {MARQUEE.map((app) => (
            <span key={app} className="text-sm text-neutral-600">
              {app}
            </span>
          ))}
        </div>
      </section>

      {/* ---------------------------------- products ---------------------------------- */}
      <section id="shop" className="py-20">
        <div className="mx-auto max-w-shell px-5">
          <p className="kicker-accent">01 — Range</p>
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
                className="card group flex flex-col overflow-hidden"
              >
                <ProductArt product={product} className="rounded-none" />

                <div className="border-t border-hairline p-5">
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

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-hairline px-2.5 py-1 text-[11px] text-neutral-400">
                      {product.keyCount} keys
                    </span>
                    <span className="rounded-full border border-hairline px-2.5 py-1 text-[11px] text-neutral-400">
                      {product.dialCount === 0
                        ? 'No dial'
                        : `${product.dialCount} dial${product.dialCount > 1 ? 's' : ''}`}
                    </span>
                    <span className="rounded-full border border-hairline px-2.5 py-1 text-[11px] text-neutral-400">
                      USB-C
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-medium text-neutral-100">
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
          <p className="kicker-accent">02 — Setup</p>
          <h2 className="mt-3 text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-xl border border-hairline bg-surface p-6"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 font-heading text-sm text-keycap shadow-glow">
                  {index + 1}
                </span>
                <h3 className="mt-5 font-semibold text-neutral-100">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ poster statement ------------------------------ */}
      <section className="border-t-2 border-divider py-20">
        <div className="mx-auto max-w-shell px-5">
          <div className="overflow-hidden rounded-2xl bg-neutral-100 px-8 py-14 shadow-glow sm:px-12">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-700">
              Taptile Mini · TP-09D2
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-heading leading-[1.05] tracking-heading text-ground sm:text-5xl">
              Nine keys. Two dials.
              <br />
              Every shortcut you own.
            </h2>
            <Link
              to="/product/taptile-mini"
              className="btn mt-9 bg-ground px-6 py-3 text-base text-neutral-100 hover:bg-neutral-900"
            >
              See the Mini
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------- faq ---------------------------------- */}
      <section id="faq" className="border-t-2 border-divider py-20">
        <div className="mx-auto max-w-3xl px-5">
          <p className="kicker-accent">03 — Questions</p>
          <h2 className="mt-3 text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
            Questions
          </h2>
          <div className="mt-10 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-hairline bg-surface px-5 py-4 transition hover:border-white/[0.16]"
              >
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
