import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import OnboardingGuard from "./OnboardingGuard";
import { AuthProvider } from "../context/AuthContext";
import * as api from "../lib/api";

vi.mock("../lib/api", async (importActual) => {
  const actual = await importActual<typeof import("../lib/api")>();
  return {
    ...actual,
    getMe: vi.fn(),
    getMyPreferences: vi.fn(),
  };
});

const mockedApi = vi.mocked(api);

function renderRoutes(initialEntry = "/dashboard") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
          <Route element={<OnboardingGuard />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  api.setStoredToken("stored-token");
  mockedApi.getMe.mockResolvedValue({
    id: "1",
    email: "user@example.com",
    created_at: "2026-01-01",
  });
});

describe("OnboardingGuard", () => {
  it("redirects to onboarding when the profile is missing", async () => {
    mockedApi.getMyPreferences.mockRejectedValue(new api.ApiError("not found", 404));

    renderRoutes();

    await waitFor(() => expect(screen.getByText("Onboarding Page")).toBeInTheDocument());
  });

  it("renders protected content when the profile is complete", async () => {
    mockedApi.getMyPreferences.mockResolvedValue({
      id: "1",
      user_id: "1",
      home_city: "new_york",
      home_airports: ["JFK"],
      cards: ["gold"],
      destination_interests: null,
      cabin_preference: null,
      date_flexibility: null,
      is_complete: true,
      created_at: "now",
      updated_at: "now",
    });

    renderRoutes();

    await waitFor(() => expect(screen.getByText("Dashboard Content")).toBeInTheDocument());
  });
});
