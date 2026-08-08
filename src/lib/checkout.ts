/**
 * Stripe Checkout, client side.
 *
 * WHY THERE IS NO STRIPE CODE HERE YET
 * ------------------------------------
 * A Checkout Session must be created by a server using your Stripe SECRET key.
 * That key can never live in this repo — everything here is compiled into the
 * JavaScript bundle that every visitor downloads, so a secret key placed here
 * is a published secret key.
 *
 * Equally important: the server decides the price. If the browser sent the
 * amount, anyone could open devtools and buy a £54 keyboard for 1p. This file
 * therefore sends only slugs and quantities, and the server looks up what
 * those actually cost.
 *
 * See docs/CHECKOUT.md for the server endpoint you need to build.
 */

import type { CartLine } from './cart';

const endpoint = import.meta.env['VITE_CHECKOUT_ENDPOINT'] as string | undefined;

export const isCheckoutConfigured = typeof endpoint === 'string' && endpoint.length > 0;

export interface CheckoutResult {
  ok: boolean;
  error?: string;
}

/**
 * Ask the server for a Checkout Session and send the customer to Stripe.
 * On success the browser navigates away, so this only returns on failure.
 */
export async function startCheckout(
  lines: Array<Pick<CartLine, 'slug' | 'quantity'>>,
  email?: string,
): Promise<CheckoutResult> {
  if (!isCheckoutConfigured) {
    return {
      ok: false,
      error:
        'Checkout is not connected yet. Set VITE_CHECKOUT_ENDPOINT in .env.local once your server endpoint exists — see docs/CHECKOUT.md.',
    };
  }

  if (lines.length === 0) {
    return { ok: false, error: 'Your basket is empty.' };
  }

  try {
    const response = await fetch(endpoint as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Deliberately no prices. The server is the only source of truth.
        items: lines.map((line) => ({ slug: line.slug, quantity: line.quantity })),
        email,
        successUrl: `${window.location.origin}/order/success`,
        cancelUrl: `${window.location.origin}/cart`,
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `Checkout failed (${response.status}). Please try again.` };
    }

    const data: unknown = await response.json();
    const url = (data as { url?: unknown }).url;

    if (typeof url !== 'string') {
      return { ok: false, error: 'Checkout server did not return a redirect URL.' };
    }

    window.location.assign(url);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the checkout server. Check your connection.' };
  }
}
