/**
 * More (handoff §6) — the phone menu behind the fifth tab.
 *
 * A real route rather than a sheet, because it is a screen with its own back
 * behaviour. On desktop the sidebar already reaches all of these, so this
 * route redirects there rather than showing a menu nobody needs.
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../layout/AppShell';
import { Avatar, Card } from '../ui';
import { useAuth } from '../../lib/auth';
import { MORE_ITEMS, ROOT } from '../layout/nav';
import { ArrowRight } from '../icons';

export default function More() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const email = user?.email ?? 'Signed in';

  // The menu only exists below the sidebar breakpoint.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    if (desktop.matches) navigate(ROOT, { replace: true });

    function onChange(event: MediaQueryListEvent) {
      if (event.matches) navigate(ROOT, { replace: true });
    }
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, [navigate]);

  return (
    <>
      <PageHeader title="More" description="The rest of the dashboard." />

      <div className="flex flex-col gap-[14px]">
        <Card pad={14}>
          <div className="flex flex-col">
            {MORE_ITEMS.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-h-[52px] items-center gap-[12px] px-[4px] ${
                  index < MORE_ITEMS.length - 1 ? 'border-b border-line-row' : ''
                }`}
              >
                <span className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-tile bg-tile text-ink-2">
                  <item.icon size={16} />
                </span>
                <span className="flex-1 text-[13px] font-semibold text-ink-1">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    aria-label={`${item.badge} unread messages`}
                    className="rounded-pill bg-lime/[0.16] px-[7px] py-[2px] text-[10px] font-bold text-lime"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
                <span className="text-ink-5" aria-hidden="true">
                  <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card pad={14}>
          <div className="flex items-center gap-[10px]">
            <Avatar name={email} size={34} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-bold text-ink-1">{email}</span>
              <span className="block text-[10.5px] text-ink-4">Owner · 2 seats</span>
            </span>
          </div>
          <div className="mt-[12px] flex flex-col gap-[7px]">
            <Link
              to="/"
              className="flex min-h-[44px] items-center justify-center rounded-chip border border-line-strong bg-tile-grad text-[12px] font-semibold text-ink-2"
            >
              Back to the site
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex min-h-[44px] items-center justify-center rounded-chip border border-alert-line bg-alert-grad text-[12px] font-semibold text-alert-text"
            >
              Sign out
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
