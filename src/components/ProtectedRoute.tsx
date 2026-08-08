import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

/**
 * Gate for routes that require a signed-in user.
 *
 * Note this is convenience, not security: anyone can edit client-side state.
 * Real protection comes from Row Level Security on the Supabase side, so that
 * a forged client still cannot read another user's rows.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-divider border-t-accent-500"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!configured || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
