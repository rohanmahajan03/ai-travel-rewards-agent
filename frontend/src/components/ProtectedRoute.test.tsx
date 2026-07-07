import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider } from "../context/AuthContext";
import * as api from "../lib/api";

vi.mock("../lib/api", async (importActual) => {
  const actual = await importActual<typeof import("../lib/api")>();
  return { ...actual, getMe: vi.fn(), login: vi.fn(), register: vi.fn() };
});

const mockedApi = vi.mocked(api);

function renderRoutes() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
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
});

describe("ProtectedRoute", () => {
  it("redirects to /login when unauthenticated", async () => {
    renderRoutes();

    await waitFor(() => expect(screen.getByText("Login Page")).toBeInTheDocument());
    expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();
  });

  it("renders the protected content when authenticated", async () => {
    api.setStoredToken("stored-token");
    mockedApi.getMe.mockResolvedValue({
      id: "1",
      email: "user@example.com",
      created_at: "2026-01-01",
    });

    renderRoutes();

    await waitFor(() => expect(screen.getByText("Dashboard Content")).toBeInTheDocument());
  });
});
