import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

const LINKS = [
  { to: '/configurator', label: 'Configurator' },
  { to: '/updates', label: 'Updates' },
  { to: '/#how', label: 'How it works' },
  { to: '/#faq', label: 'FAQ' },
];

export default function Nav() {
  const { user, signOut } = useAuth();
  const { itemCount, setOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes, otherwise it stays
  // open on top of the page the user just navigated to.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

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
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-full px-3.5 py-1.5 transition hover:bg-white/[0.06] hover:text-neutral-100"
            >
              {link.label}
            </Link>
          ))}
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
              <button
                type="button"
                onClick={handleSignOut}
                className="btn-secondary hidden py-2 sm:inline-flex"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary hidden py-2 sm:inline-flex">
              Sign in
            </Link>
          )}

          {/* Without this the shop, how-it-works and FAQ links are unreachable
              on a phone — the desktop bar is display:none below md. */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="btn-secondary px-3 py-2 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span aria-hidden="true" className="text-base leading-none">
              {menuOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-hairline bg-ground md:hidden">
          <div className="mx-auto flex max-w-shell flex-col px-5 py-3">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-2 py-3 text-neutral-300 transition hover:bg-white/[0.06] hover:text-neutral-100"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 flex gap-2.5 border-t border-hairline pt-3 sm:hidden">
              {user ? (
                <>
                  <Link to="/account" className="btn-secondary flex-1 justify-center py-2.5">
                    Account
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="btn-secondary flex-1 justify-center py-2.5"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn-primary flex-1 justify-center py-2.5">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
