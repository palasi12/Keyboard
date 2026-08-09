import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';

export function Logo({ className = '', size = 44 }: { className?: string; size?: number }) {
  return (
    <span className={`flex items-center ${className}`}>
      <img
        src="/logo-cut.png"
        alt=""
        aria-hidden="true"
        style={{ width: size, height: size }}
        className="block shrink-0"
      />
      <span className="ml-2.5 mt-1.5 font-heading text-[17px] uppercase tracking-[0.08em] text-neutral-100">
        Taptile
      </span>
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
    <header className="sticky top-0 z-40 border-b-2 border-divider bg-ground/80 backdrop-blur">
      <nav className="mx-auto flex h-[68px] max-w-shell items-center justify-between px-5">
        <Link to="/" aria-label="Taptile home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-hairline bg-white/[0.02] p-1 text-sm text-neutral-400 md:flex">
          <Link to="/shop" className="rounded-full px-3.5 py-1.5 transition hover:bg-white/[0.06] hover:text-neutral-100">
            Shop
          </Link>
          <Link to="/#how" className="rounded-full px-3.5 py-1.5 transition hover:bg-white/[0.06] hover:text-neutral-100">
            How it works
          </Link>
          <Link to="/#faq" className="rounded-full px-3.5 py-1.5 transition hover:bg-white/[0.06] hover:text-neutral-100">
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
