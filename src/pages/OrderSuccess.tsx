import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

export default function OrderSuccess() {
  return (
    <section className="mx-auto max-w-xl px-5 py-24 text-center">
      <Seo title="Order confirmed" description="Thanks for your order." path="/order/success" />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
        <svg className="h-7 w-7 text-emerald-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="mt-6 text-2xl font-bold text-neutral-100">Thanks for your order</h1>
      <p className="mt-3 text-neutral-400">
        A confirmation email is on its way. You can track it from your account.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/account" className="btn-secondary">
          View orders
        </Link>
        <Link to="/shop" className="btn-primary">
          Keep shopping
        </Link>
      </div>
    </section>
  );
}
