import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { FaTooth } from "react-icons/fa";

/**
 * Validates if the user is authenticated.
 * Used to wrap the private sections of the app (AppShell).
 */
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
         <div className="flex flex-col items-center gap-4">
            <FaTooth className="w-12 h-12 text-primary animate-pulse" />
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-highlight to-transparent animate-pulse rounded-full" />
            <span className="text-text-muted font-medium text-sm">Loading Application...</span>
         </div>
      </div>
    );
  }

  // If there's NO user, redirect to /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If there IS a user, allow them to view the sub-routes (AppShell)
  return <Outlet />;
};

export default ProtectedRoute;
