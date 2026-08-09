import { Link } from 'react-router-dom';
import { Logo } from './Nav';

export default function Footer() {
  return (
    <footer className="border-t-2 border-divider py-12">
      <div className="mx-auto max-w-shell px-5">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <Logo size={52} />
            <p className="mt-3 max-w-xs text-sm text-neutral-500">
              Programmable mini keyboards, without the premium price tag.
            </p>
          </div>

          <div className="flex gap-14 text-sm">
            <div>
              <p className="font-semibold text-neutral-100">Shop</p>
              <ul className="mt-3 space-y-2 text-neutral-500">
                <li>
                  <Link to="/shop" className="transition hover:text-neutral-100">
                    All keyboards
                  </Link>
                </li>
                <li>
                  <Link to="/product/taptile-mini" className="transition hover:text-neutral-100">
                    Taptile Mini
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
                  <a href="mailto:hello@taptile.com" className="transition hover:text-neutral-100">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t-2 border-divider pt-6 text-xs text-neutral-600">
          © {new Date().getFullYear()} Taptile. Placeholder site — product details, prices and
          policies are not final.
        </p>
      </div>
    </footer>
  );
}
