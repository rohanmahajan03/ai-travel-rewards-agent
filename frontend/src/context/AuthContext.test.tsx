import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider, useAuth } from "./AuthContext";
import * as api from "../lib/api";

vi.mock("../lib/api", async (importActual) => {
  const actual = await importActual<typeof import("../lib/api")>();
  return {
    ...actual,
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  };
});

const mockedApi = vi.mocked(api);

const TEST_USER = { id: "1", email: "user@example.com", created_at: "2026-01-01" };

function Harness() {
  const { user, isLoading, login, register, logout } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user ? user.email : "none"}</span>
      <button onClick={() => login("user@example.com", "password123")}>login</button>
      <button onClick={() => register("user@example.com", "password123")}>register</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function renderHarness() {
  return render(
    <AuthProvider>
      <Harness />
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuthProvider", () => {
  it("starts logged out when there is no stored token", async () => {
    renderHarness();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(mockedApi.getMe).not.toHaveBeenCalled();
  });

  it("restores the session from a stored token on load", async () => {
    api.setStoredToken("stored-token");
    mockedApi.getMe.mockResolvedValue(TEST_USER);

    renderHarness();

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(TEST_USER.email));
    expect(mockedApi.getMe).toHaveBeenCalledWith("stored-token");
  });

  it("clears an invalid stored token on load", async () => {
    api.setStoredToken("bad-token");
    mockedApi.getMe.mockRejectedValue(new api.ApiError("unauthorized", 401));

    renderHarness();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(api.getStoredToken()).toBeNull();
  });

  it("logs in, stores the token, and loads the user", async () => {
    mockedApi.login.mockResolvedValue({ access_token: "new-token", token_type: "bearer" });
    mockedApi.getMe.mockResolvedValue(TEST_USER);

    renderHarness();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    await userEvent.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(TEST_USER.email));
    expect(api.getStoredToken()).toBe("new-token");
  });

  it("registers, stores the token, and loads the user", async () => {
    mockedApi.register.mockResolvedValue({ access_token: "reg-token", token_type: "bearer" });
    mockedApi.getMe.mockResolvedValue(TEST_USER);

    renderHarness();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    await userEvent.click(screen.getByText("register"));

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(TEST_USER.email));
    expect(api.getStoredToken()).toBe("reg-token");
  });

  it("logs out and clears the token", async () => {
    api.setStoredToken("stored-token");
    mockedApi.getMe.mockResolvedValue(TEST_USER);

    renderHarness();
    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(TEST_USER.email));

    await userEvent.click(screen.getByText("logout"));

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("none"));
    expect(api.getStoredToken()).toBeNull();
  });
});
