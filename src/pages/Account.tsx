import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Account() {
  const { user } = useAuth();

  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-3xl font-bold tracking-tight text-white">Your account</h1>
      <p className="mt-2 text-neutral-400">{user?.email}</p>

      <div className="mt-10 space-y-5">
        <div className="card p-6">
          <h2 className="font-semibold text-white">Orders</h2>
          <p className="mt-2 text-sm text-neutral-400">
            You have not placed any orders yet.
          </p>
          <p className="mt-3 text-xs text-neutral-600">
            Order history appears here once checkout is connected and Stripe webhooks are
            writing orders to the database.
          </p>
          <Link to="/shop" className="btn-ghost mt-5">
            Start shopping
          </Link>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-white">Delivery address</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Collected at checkout by Stripe — nothing to fill in here.
          </p>
        </div>
      </div>
    </section>
  );
}
