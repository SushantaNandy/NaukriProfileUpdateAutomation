import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute — Guards dashboard routes.
 * Checks for JWT in localStorage. Redirects to /login if not found.
 *
 * NOTE: In production, this should also validate token expiry.
 * For MVP, a simple existence check is sufficient.
 */
function ProtectedRoute() {
  const token = localStorage.getItem('naukriboost_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
