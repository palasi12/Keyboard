import { Link } from 'react-router-dom';
import { Logo } from './Nav';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-hairline py-14">
      <div className="aurora-soft pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative z-[2] mx-auto max-w-shell px-5">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <Logo size={52} />
            <p className="mt-3 max-w-xs text-sm text-neutral-500">
              Programmable mini keyboards, without the premium price tag.
            </p>
            <Link to="/#waitlist" className="btn-primary mt-5 px-5 py-2.5">
              Join the waitlist
            </Link>
          </div>

          <div className="flex gap-14 text-sm">
            <div>
              <p className="font-semibold text-neutral-100">The board</p>
              <ul className="mt-3 space-y-2 text-neutral-500">
                <li>
                  <Link to="/product/taptile-dialect" className="transition hover:text-neutral-100">
                    Taptile Dialect
                  </Link>
                </li>
                <li>
                  <Link to="/configurator" className="transition hover:text-neutral-100">
                    Configurator
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-neutral-100">Help</p>
              <ul className="mt-3 space-y-2 text-neutral-500">
                <li>
                  <Link to="/#faq" className="transition hover:text-neutral-100">
                    FAQ
                  </Link>
                </li>
                <li>
                  <a href="mailto:hello.taptile@gmail.com" className="transition hover:text-neutral-100">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-neutral-100">Legal</p>
              <ul className="mt-3 space-y-2 text-neutral-500">
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

        <p className="mt-12 border-t border-hairline pt-6 text-xs text-neutral-600">
          © {new Date().getFullYear()} Taptile. Pre-launch. Product details, prices and policies are not final and
          nothing is on sale yet.
        </p>
      </div>
    </footer>
  );
}
