import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Nav from './components/Nav';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Admin from './pages/Admin';
import AdminUpdates from './pages/AdminUpdates';
import Updates from './pages/Updates';
import Update from './pages/Update';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

/** Jump to the top on navigation, or to the #anchor when there is one. */
function ScrollBehaviour() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

/**
 * There is no shop. One board exists, it is not orderable yet, and every route
 * here ends at the waitlist or the devlog. Sign-in is kept because /admin is
 * how updates get published — not because visitors have accounts.
 */
const routes = (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/updates" element={<Updates />} />
    <Route path="/updates/:slug" element={<Update />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route
      path="/admin"
      element={
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/updates"
      element={
        <ProtectedRoute>
          <AdminUpdates />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-ground">
      <ScrollBehaviour />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50
                   focus:rounded-full focus:bg-neutral-100 focus:px-4 focus:py-2
                   focus:font-heading focus:text-sm focus:text-keycap"
      >
        Skip to content
      </a>

      <Nav />

      {/* The nav floats over the page, so everything except the landing hero
          (which pulls itself back up) starts below it. */}
      <main id="main" className="flex-1 pt-[88px]">
        {routes}
      </main>

      <Footer />
    </div>
  );
}
