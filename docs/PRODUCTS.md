# Replacing the placeholder products

Everything in `src/lib/catalog.ts` is invented. Names, prices, specs, dimensions
and stock status are all made up so the site had something to render.

## Before launch

Replace each entry with the real vendor listing:

| Field       | Where it comes from                                        |
|-------------|------------------------------------------------------------|
| `name`      | Your branding, not the vendor's                             |
| `price`     | **In pence.** £39.00 is `3900`                              |
| `keyCount`  | Vendor spec sheet                                           |
| `specs`     | Vendor spec sheet — switch type, dimensions, connection     |
| `features`  | Only claims the product actually delivers                   |
| `inStock`   | Vendor availability                                         |

## Product photos

`src/components/ProductArt.tsx` draws a placeholder from CSS. It looks fine, but
nobody buys hardware from a drawing. Get real photos — either the vendor's
(check you have permission to use them) or your own once samples arrive.

To swap it: add an `image` field to `Product`, put files in `public/products/`,
and render an `<img>` instead of the generated grid.

## Copy you must not ship as-is

These are placeholders that create real liability if published unchanged:

- **Delivery times** in the FAQ — confirm with the vendor first
- **Returns policy** in the FAQ — you need a real one, it is legally required
- **"Free UK delivery over £30"** — only true if you have decided it is
- **"30-day returns"** on the product page — same
- **Compatibility claims** — confirm the vendor's board really does support
  Windows, macOS and Linux before saying so

Advertising a delivery time or returns policy you cannot honour is a consumer
protection problem, not a marketing one.
