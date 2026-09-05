import { Link } from 'react-router-dom';
import { Logo } from './Nav';

// Solid ground. The section above now fades itself out, so a second fade here
// only stacked two ramps on top of each other.
export default function Footer() {
  return (
    <footer className="relative bg-ground py-14">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, rgba(248,244,244,0), rgba(248,244,244,.16) 50%, rgba(248,244,244,0))',
        }}
      />
      <div className="relative z-[2] mx-auto max-w-shell px-5">
        <div className="flex flex-col gap-12 sm:flex-row sm:justify-between">
          <div>
            <Logo size={52} />
            <p className="mt-3.5 max-w-xs text-sm text-neutral-500">
              Programmable mini keyboards, without the premium price tag.
            </p>
            <Link to="/#waitlist" className="btn-secondary mt-[18px] px-[18px] py-2.5 text-[13px]">
              Join the waitlist
            </Link>
          </div>

          <div className="flex flex-wrap gap-x-14 gap-y-8 text-sm">
            <div>
              <p className="font-semibold text-neutral-100">The board</p>
              <ul className="mt-3.5 space-y-2.5 text-neutral-500">
                <li>
                  <Link to="/#dialects" className="transition hover:text-neutral-100">
                    Dialects
                  </Link>
                </li>
                <li>
                  <Link to="/updates" className="transition hover:text-neutral-100">
                    Updates
                  </Link>
                </li>
                <li>
                  <Link to="/#waitlist" className="transition hover:text-neutral-100">
                    Early access
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-neutral-100">Help</p>
              <ul className="mt-3.5 space-y-2.5 text-neutral-500">
                <li>
                  <a
                    href="mailto:hello.taptile@gmail.com"
                    className="transition hover:text-neutral-100"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <Link to="/login" className="transition hover:text-neutral-100">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-neutral-100">Legal</p>
              <ul className="mt-3.5 space-y-2.5 text-neutral-500">
                <li>
                  <Link to="/privacy" className="transition hover:text-neutral-100">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="transition hover:text-neutral-100">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-11 border-t-2 border-neutral-100/[0.14] pt-6 text-xs text-neutral-600">
          © {new Date().getFullYear()} Taptile. Pre-launch. Product details, prices and policies are
          not final and nothing is on sale yet.
        </p>
      </div>
    </footer>
  );
}
