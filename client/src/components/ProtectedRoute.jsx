import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-rose-500/30 bg-rose-950/20 p-6 text-center">
          <h2 className="text-lg font-semibold text-rose-300">Instructor Access Required</h2>
          <p className="mt-2 text-sm text-slate-400">
            Your current role (<span className="font-mono text-slate-200">{user?.role}</span>) does not
            have permission to access this route.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
