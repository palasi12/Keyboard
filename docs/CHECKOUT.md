# Connecting Stripe checkout

The storefront is finished. Payments are not, and cannot be done from the
browser alone. This is what is left.

## Why there is no Stripe code in the front end

Two reasons, both non-negotiable:

1. **Secret keys cannot live in this repo.** Everything in `src/` is compiled
   into the JavaScript bundle every visitor downloads. A `sk_live_…` key placed
   here is a published key. Only the publishable `pk_…` key is safe client-side.

2. **The browser must not decide the price.** If the client sent the amount,
   anyone could open devtools and buy a £54 keyboard for 1p. The server looks up
   prices from its own copy of the catalogue.

So `src/lib/checkout.ts` sends only product slugs and quantities to an endpoint
you control. That endpoint does the rest.

## What you need to build

A single HTTPS endpoint that accepts:

```json
{
  "items": [{ "slug": "taptile-6", "quantity": 2 }],
  "email": "customer@example.com",
  "successUrl": "https://taptile.com/order/success",
  "cancelUrl": "https://taptile.com/cart"
}
```

…and returns:

```json
{ "url": "https://checkout.stripe.com/c/pay/cs_test_..." }
```

### Reference implementation

Deploy as a Vercel or Netlify function, or a Supabase Edge Function.

```ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// The server's own price list. Never trust prices from the client.
const PRICES: Record<string, { name: string; amount: number }> = {
  'taptile-3': { name: 'Taptile 3', amount: 2400 },
  'taptile-6': { name: 'Taptile 6', amount: 3900 },
  'taptile-9': { name: 'Taptile 9', amount: 5400 },
};

export async function POST(request: Request) {
  const { items, email, successUrl, cancelUrl } = await request.json();

  const lineItems = items.map((item: { slug: string; quantity: number }) => {
    const price = PRICES[item.slug];
    if (!price) throw new Error(`Unknown product: ${item.slug}`);
    return {
      quantity: Math.min(10, Math.max(1, Math.trunc(item.quantity))),
      price_data: {
        currency: 'gbp',
        unit_amount: price.amount,
        product_data: { name: price.name },
      },
    };
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    shipping_address_collection: { allowed_countries: ['GB', 'IE'] },
    automatic_tax: { enabled: true },
  });

  return Response.json({ url: session.url });
}
```

Then set in `.env.local` (and in your host's environment variables):

```
VITE_CHECKOUT_ENDPOINT=https://your-site.com/api/create-checkout-session
```

`STRIPE_SECRET_KEY` goes in the **server's** environment only. Never in
`.env.local`, never in this repo.

## Before you take a single real payment

Not optional, and not things a developer can decide for you:

- [ ] Stripe account verified, out of test mode
- [ ] A **webhook** on `checkout.session.completed` that records the order —
      without it you will have money and no idea what to ship
- [ ] Returns policy (legally required in the UK and EU — 14-day cooling off)
- [ ] Terms of sale, privacy policy, and delivery timescales published
- [ ] VAT position confirmed with an accountant, and `automatic_tax` configured
- [ ] Vendor confirmed they can actually fulfil at the volume and lead time you
      advertise

Test with Stripe's test card `4242 4242 4242 4242` before going live.
