import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Logo({ className = '', size = 40 }: { className?: string; size?: number }) {
  return (
    <span className={`flex items-center ${className}`}>
      <img
        src="/logo-cut.png"
        alt=""
        aria-hidden="true"
        style={{ width: size, height: size }}
        className="block shrink-0"
      />
      <span className="ml-2.5 mt-1.5 font-heading text-base uppercase tracking-[0.08em] text-neutral-100">
        Taptile
      </span>
    </span>
  );
}

const LINKS = [
  { to: '/#dialects', label: 'Dialects' },
  { to: '/updates', label: 'Updates' },
  { to: '/#waitlist', label: 'Early access' },
];

/**
 * The V5 nav: a floating pill that stays clear of the page until you scroll,
 * then fills in behind a blur. The gradient hairline along its bottom edge is
 * the scroll position — the only place the brand gradient appears in chrome.
 *
 * Signing in exists for the people who publish updates, not for customers:
 * there is no basket and no account, so the only thing behind the door is
 * /admin.
 */
export default function Nav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      const travel = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(travel > 0 ? Math.min(1, Math.max(0, window.scrollY / travel)) : 0);
      setScrolled(window.scrollY > 12);
    };
    const onScroll = () => {
      if (frame === undefined) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 py-3 sm:px-5">
      <nav
        className="pointer-events-auto relative mx-auto flex h-[62px] max-w-shell items-center
                   gap-5 rounded-full pl-3.5 pr-2 transition-[background-color,border-color,box-shadow] duration-300 sm:pl-4"
        style={{
          background: scrolled ? 'rgba(19,17,17,.72)' : 'rgba(19,17,17,.28)',
          border: `1px solid ${scrolled ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.05)'}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,.45)' : 'none',
        }}
      >
        {/* scroll position */}
        <span
          aria-hidden="true"
          className="absolute bottom-[9px] left-4 right-[9px] overflow-hidden rounded-[2px] transition-opacity duration-300"
          style={{ height: 2, opacity: scrolled ? 1 : 0 }}
        >
          <span
            className="rule-grad block h-full w-full origin-left transition-transform duration-150"
            style={{ transform: `scaleX(${progress})` }}
          />
        </span>

        <Link to="/" aria-label="Taptile home" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-7 text-sm text-neutral-400 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="whitespace-nowrap text-neutral-400 transition hover:text-neutral-100"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          {user ? (
            <>
              <Link to="/admin" className="btn-secondary hidden px-4 py-2 sm:inline-flex">
                Admin
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="btn-secondary hidden px-4 py-2 sm:inline-flex"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary hidden px-5 py-2.5 sm:inline-flex">
              Sign in
            </Link>
          )}

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
        <div
          id="mobile-menu"
          className="pointer-events-auto mx-auto mt-2 max-w-shell rounded-3xl border border-hairline bg-keycap/95 p-2 shadow-nav backdrop-blur md:hidden"
        >
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block rounded-2xl px-4 py-3 text-neutral-300 transition hover:bg-white/[0.06] hover:text-neutral-100"
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-1 flex gap-2 border-t border-hairline p-2 pt-3 sm:hidden">
            {user ? (
              <>
                <Link to="/admin" className="btn-secondary flex-1 justify-center py-2.5">
                  Admin
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
      )}
    </header>
  );
}
