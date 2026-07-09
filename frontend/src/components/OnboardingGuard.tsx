import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { ApiError, getMyPreferences } from "../lib/api";

type OnboardingStatus = "loading" | "complete" | "incomplete";

export default function OnboardingGuard() {
  const [status, setStatus] = useState<OnboardingStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    getMyPreferences()
      .then((profile) => {
        if (!cancelled) {
          setStatus(profile.is_complete ? "complete" : "incomplete");
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus("incomplete");
          return;
        }
        setStatus("incomplete");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (status === "incomplete") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
