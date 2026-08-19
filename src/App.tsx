import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Nav from './components/Nav';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Account from './pages/Account';
import OrderSuccess from './pages/OrderSuccess';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Admin from './pages/Admin';
import AdminUpdates from './pages/AdminUpdates';
import Configurator from './pages/Configurator';
import Updates from './pages/Updates';
import Update from './pages/Update';

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

const routes = (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/product/:slug" element={<Product />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/configurator" element={<Configurator />} />
    <Route path="/updates" element={<Updates />} />
    <Route path="/updates/:slug" element={<Update />} />
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/order/success" element={<OrderSuccess />} />
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
    <Route
      path="/account"
      element={
        <ProtectedRoute>
          <Account />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  const { search } = useLocation();
  // `?embed=1` strips the site chrome so a page can be shown inside an iframe
  // (the landing page frames the configurator this way).
  const embedded = new URLSearchParams(search).get('embed') === '1';

  if (embedded) {
    return (
      <div className="min-h-screen bg-ground">
        <ScrollBehaviour />
        {routes}
      </div>
    );
  }

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
      <CartDrawer />

      <main id="main" className="flex-1">
        {routes}
      </main>

      <Footer />
    </div>
  );
}
