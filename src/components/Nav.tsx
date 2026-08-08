import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="grid h-7 w-7 grid-cols-2 gap-[3px] bg-surface2 p-[5px]">
        <span className="rounded-none bg-accent" />
        <span className="rounded-none bg-neutral-700" />
        <span className="rounded-none bg-neutral-700" />
        <span className="rounded-none bg-accent" />
      </span>
      <span className="text-[18px] font-heading tracking-heading text-neutral-100">Taptile</span>
    </span>
  );
}

export default function Nav() {
  const { user, signOut } = useAuth();
  const { itemCount, setOpen } = useCart();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b-2 border-divider bg-ground/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-shell items-center justify-between px-5">
        <Link to="/" aria-label="Taptile home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-7 text-sm text-neutral-400 md:flex">
          <Link to="/shop" className="transition hover:text-neutral-100">
            Shop
          </Link>
          <Link to="/#how" className="transition hover:text-neutral-100">
            How it works
          </Link>
          <Link to="/#faq" className="transition hover:text-neutral-100">
            FAQ
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-secondary relative py-2"
            aria-label={`Basket, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
          >
            Basket
            {itemCount > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center
                           justify-center rounded-full bg-accent px-1 text-[11px] font-bold"
              >
                {itemCount}
              </span>
            )}
          </button>

          {user ? (
            <>
              <Link to="/account" className="btn-secondary hidden py-2 sm:inline-flex">
                Account
              </Link>
              <button type="button" onClick={handleSignOut} className="btn-secondary py-2">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary py-2">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
