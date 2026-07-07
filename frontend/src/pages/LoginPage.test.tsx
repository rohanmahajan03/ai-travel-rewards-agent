import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import LoginPage from "./LoginPage";
import { AuthProvider } from "../context/AuthContext";
import * as api from "../lib/api";

vi.mock("../lib/api", async (importActual) => {
  const actual = await importActual<typeof import("../lib/api")>();
  return { ...actual, getMe: vi.fn(), login: vi.fn(), register: vi.fn() };
});

const mockedApi = vi.mocked(api);

function renderPage() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("LoginPage validation", () => {
  it("requires email and password", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Email and password are required.")).toBeInTheDocument();
    expect(mockedApi.login).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText("Email"), "user@invalid");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();
    expect(mockedApi.login).not.toHaveBeenCalled();
  });

  it("submits valid credentials", async () => {
    mockedApi.login.mockResolvedValue({ access_token: "t", token_type: "bearer" });
    mockedApi.getMe.mockResolvedValue({ id: "1", email: "user@example.com", created_at: "now" });

    renderPage();
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(mockedApi.login).toHaveBeenCalledWith("user@example.com", "password123"),
    );
  });

  it("shows a server error on invalid credentials", async () => {
    mockedApi.login.mockRejectedValue(new api.ApiError("Invalid email or password", 401));

    renderPage();
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpassword");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });
});
