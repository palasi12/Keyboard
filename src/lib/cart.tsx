import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { PRODUCTS, type Product } from './catalog';

export interface CartLine {
  slug: string;
  quantity: number;
}

export interface ResolvedLine extends CartLine {
  product: Product;
  /** quantity × unit price, in pence. */
  lineTotal: number;
}

interface CartContextValue {
  lines: ResolvedLine[];
  itemCount: number;
  /** Sum of all lines in pence. Shipping and tax are added by Stripe at checkout. */
  subtotal: number;
  add(slug: string, quantity?: number): void;
  setQuantity(slug: string, quantity: number): void;
  remove(slug: string): void;
  clear(): void;
  isOpen: boolean;
  setOpen(open: boolean): void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'taptile.cart.v1';
const MAX_PER_LINE = 10;

function readStoredCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop anything that no longer matches a real product — the catalogue
    // changes and a stale cart should not break the page.
    return parsed
      .filter((line): line is CartLine => {
        if (typeof line !== 'object' || line === null) return false;
        const candidate = line as Partial<CartLine>;
        return (
          typeof candidate.slug === 'string' &&
          typeof candidate.quantity === 'number' &&
          PRODUCTS.some((p) => p.slug === candidate.slug)
        );
      })
      .map((line) => ({
        slug: line.slug,
        quantity: Math.min(MAX_PER_LINE, Math.max(1, Math.trunc(line.quantity))),
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readStoredCart);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const add = useCallback((slug: string, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.slug === slug);
      if (!existing) return [...current, { slug, quantity: Math.min(MAX_PER_LINE, quantity) }];
      return current.map((line) =>
        line.slug === slug
          ? { ...line, quantity: Math.min(MAX_PER_LINE, line.quantity + quantity) }
          : line,
      );
    });
    setOpen(true);
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.slug !== slug)
        : current.map((line) =>
            line.slug === slug
              ? { ...line, quantity: Math.min(MAX_PER_LINE, Math.trunc(quantity)) }
              : line,
          ),
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setLines((current) => current.filter((line) => line.slug !== slug));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const resolved = useMemo<ResolvedLine[]>(
    () =>
      lines.flatMap((line) => {
        const product = PRODUCTS.find((p) => p.slug === line.slug);
        if (!product) return [];
        return [{ ...line, product, lineTotal: product.price * line.quantity }];
      }),
    [lines],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines: resolved,
      itemCount: resolved.reduce((total, line) => total + line.quantity, 0),
      subtotal: resolved.reduce((total, line) => total + line.lineTotal, 0),
      add,
      setQuantity,
      remove,
      clear,
      isOpen,
      setOpen,
    }),
    [resolved, add, setQuantity, remove, clear, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
