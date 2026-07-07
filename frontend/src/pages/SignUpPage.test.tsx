import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import SignUpPage from "./SignUpPage";
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
        <SignUpPage />
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("SignUpPage validation", () => {
  it("requires all fields", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByText("All fields are required.")).toBeInTheDocument();
    expect(mockedApi.register).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText("Email"), "user@invalid");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();
    expect(mockedApi.register).not.toHaveBeenCalled();
  });

  it("rejects a short password", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "short");
    await userEvent.type(screen.getByLabelText("Confirm password"), "short");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(mockedApi.register).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "different123");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(mockedApi.register).not.toHaveBeenCalled();
  });

  it("submits when the form is valid", async () => {
    mockedApi.register.mockResolvedValue({ access_token: "t", token_type: "bearer" });
    mockedApi.getMe.mockResolvedValue({ id: "1", email: "user@example.com", created_at: "now" });

    renderPage();
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() =>
      expect(mockedApi.register).toHaveBeenCalledWith("user@example.com", "password123"),
    );
  });

  it("shows a server error when registration fails", async () => {
    mockedApi.register.mockRejectedValue(
      new api.ApiError("An account with this email already exists", 409),
    );

    renderPage();
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      await screen.findByText("An account with this email already exists"),
    ).toBeInTheDocument();
  });
});
