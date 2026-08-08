# Taptile

Storefront for Taptile — programmable mini keyboards.

> **Status: template.** The site is complete and buildable, but the products are
> placeholders and checkout is not connected. Read
> [docs/PRODUCTS.md](docs/PRODUCTS.md) and [docs/CHECKOUT.md](docs/CHECKOUT.md)
> before this goes anywhere near a real customer.

## Running it

Requires **Node 20+**.

```bash
npm install
npm run dev
```

Opens on http://localhost:5173. It also listens on your local network, so you
can check the mobile layout on your phone.

## What works

- Landing page, shop, product detail pages
- Basket with quantities, persists across refreshes
- Sign in and sign up (needs Supabase keys — see below)
- Account page

## What does not

- **Checkout.** Needs a server endpoint. See [docs/CHECKOUT.md](docs/CHECKOUT.md).
- **Real products.** All placeholder. See [docs/PRODUCTS.md](docs/PRODUCTS.md).
- **Order history.** Arrives once Stripe webhooks write orders to a database.

## Configuration

```bash
cp .env.example .env.local
```

Then fill in your Supabase URL and anon key. Until you do, the sign-in page
shows a setup notice rather than pretending to work.

Never put a Stripe secret key in `.env.local` — everything there is compiled
into the public JavaScript bundle.

## Design system

The look comes from the **Modernist** system in
`Taptile Configuration UI Mockup/_ds/`. Read its `readme.md` before changing any
styling. The rules that matter most:

- **Zero corner radius.** Nothing is rounded, anywhere.
- **2px dividers**, never hairlines. Alignment and rules do the organising.
- **Flush left** — headings, copy, and labels inside wide buttons.
- **Accent used sparingly.** Mostly ink on ground; red carries the primary
  action and the one poster statement per page.
- Type is Archivo throughout, headings at weight 800.

Tokens live in `tailwind.config.js` and `src/index.css`. Take colours, spacing
and type from there rather than hard-coding values.

Note the mockup's own chrome rounds its corners and the design system says not
to. The system's readme wins here — that rounding is specific to rendering the
hardware.

## Project layout

```
src/
  lib/catalog.ts     Product data (placeholder)
  lib/cart.tsx       Basket state, persisted to localStorage
  lib/checkout.ts    Talks to your Stripe endpoint
  lib/auth.tsx       Supabase auth
  pages/             One file per route
  components/        Nav, footer, cart drawer, product art
docs/                What to do before launch
```

## Deploying

Any static host works — Vercel, Netlify, Cloudflare Pages. Build command
`npm run build`, output directory `dist`. Add your environment variables in the
host's dashboard, not in the repo.

## Working together

See [CONTRIBUTING.md](CONTRIBUTING.md).
