import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
