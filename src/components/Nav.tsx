import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="grid h-7 w-7 grid-cols-2 gap-[3px] rounded-md bg-ink-800 p-[5px]">
        <span className="rounded-[2px] bg-accent-500" />
        <span className="rounded-[2px] bg-ink-600" />
        <span className="rounded-[2px] bg-ink-600" />
        <span className="rounded-[2px] bg-accent-500" />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-white">Taptile</span>
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
    <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" aria-label="Taptile home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-7 text-sm text-neutral-400 md:flex">
          <Link to="/shop" className="transition hover:text-white">
            Shop
          </Link>
          <Link to="/#how" className="transition hover:text-white">
            How it works
          </Link>
          <Link to="/#faq" className="transition hover:text-white">
            FAQ
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-ghost relative py-2"
            aria-label={`Basket, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
          >
            Basket
            {itemCount > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center
                           justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold"
              >
                {itemCount}
              </span>
            )}
          </button>

          {user ? (
            <>
              <Link to="/account" className="btn-ghost hidden py-2 sm:inline-flex">
                Account
              </Link>
              <button type="button" onClick={handleSignOut} className="btn-ghost py-2">
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
