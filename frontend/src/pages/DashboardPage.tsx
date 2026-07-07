import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">AI Travel Rewards Agent</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
          <p className="mt-2 text-slate-600">
            Welcome, <span className="font-medium">{user?.email}</span>
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Your personalized travel rewards recommendations will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
