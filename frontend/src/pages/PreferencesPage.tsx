import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import PreferencesForm from "../components/PreferencesForm";
import {
  ApiError,
  getMyPreferences,
  getPreferenceOptions,
  updateMyPreferences,
  type Preferences,
  type PreferencesOptions,
  type PreferencesUpdate,
} from "../lib/api";

type PreferencesPageProps = {
  variant: "onboarding" | "edit";
};

export default function PreferencesPage({ variant }: PreferencesPageProps) {
  const navigate = useNavigate();
  const [options, setOptions] = useState<PreferencesOptions | null>(null);
  const [profile, setProfile] = useState<Preferences | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const optionsResponse = await getPreferenceOptions();
        if (cancelled) return;
        setOptions(optionsResponse);

        try {
          const profileResponse = await getMyPreferences();
          if (!cancelled) {
            setProfile(profileResponse);
          }
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            if (!cancelled) {
              setProfile(null);
            }
          } else {
            throw err;
          }
        }
      } catch {
        if (!cancelled) {
          setLoadError("Unable to load preferences. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (successMessage) {
      window.scrollTo?.({ top: 0, behavior: "smooth" });
    }
  }, [successMessage]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading preferences...</p>
      </div>
    );
  }

  if (loadError || !options) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-red-700">{loadError ?? "Something went wrong."}</p>
          {variant === "edit" && (
            <Link
              to="/dashboard"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Back to dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (variant === "onboarding" && profile?.is_complete) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(values: PreferencesUpdate) {
    const saved = await updateMyPreferences(values);
    setProfile(saved);
    setSuccessMessage(null);

    if (variant === "onboarding") {
      navigate("/dashboard", { replace: true });
      return;
    }

    setSuccessMessage("Your preferences have been saved.");
  }

  const title =
    variant === "onboarding" ? "Set up your travel preferences" : "Edit travel preferences";
  const description =
    variant === "onboarding"
      ? "Tell us where you fly from and which cards you hold so we can find the best reward opportunities."
      : "Update your home city, cards, and travel preferences anytime.";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">AI Travel Rewards Agent</h1>
          {variant === "edit" && (
            <Link
              to="/dashboard"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Back to dashboard
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{description}</p>

          {successMessage && (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <div className="mt-6">
            <PreferencesForm
              options={options}
              initialValues={
                profile
                  ? {
                      home_city: profile.home_city,
                      cards: profile.cards,
                      destination_interests: profile.destination_interests,
                      cabin_preference: profile.cabin_preference,
                      date_flexibility: profile.date_flexibility,
                    }
                  : undefined
              }
              submitLabel={variant === "onboarding" ? "Continue to dashboard" : "Save preferences"}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
