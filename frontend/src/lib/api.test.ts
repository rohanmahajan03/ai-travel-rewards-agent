import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  apiFetch,
  clearStoredToken,
  getMe,
  getStoredToken,
  login,
  register,
  setStoredToken,
} from "./api";

function mockFetch(response: Partial<Response> & { jsonBody?: unknown }) {
  const { jsonBody, ...rest } = response;
  return vi.fn().mockResolvedValue({
    ok: rest.ok ?? true,
    status: rest.status ?? 200,
    json: async () => jsonBody,
    ...rest,
  } as Response);
}

describe("token storage", () => {
  afterEach(() => localStorage.clear());

  it("stores, reads, and clears the token", () => {
    expect(getStoredToken()).toBeNull();

    setStoredToken("abc123");
    expect(getStoredToken()).toBe("abc123");

    clearStoredToken();
    expect(getStoredToken()).toBeNull();
  });
});

describe("apiFetch", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("attaches the stored token as a Bearer header", async () => {
    setStoredToken("stored-token");
    const fetchMock = mockFetch({ jsonBody: { ok: true } });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/v1/test");

    const [, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer stored-token");
  });

  it("prefers an explicitly passed token over the stored one", async () => {
    setStoredToken("stored-token");
    const fetchMock = mockFetch({ jsonBody: {} });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/v1/test", {}, "explicit-token");

    const [, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer explicit-token");
  });

  it("throws a friendly ApiError on 401", async () => {
    const fetchMock = mockFetch({ ok: false, status: 401, jsonBody: { detail: "nope" } });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/v1/test")).rejects.toMatchObject({
      status: 401,
      message: "Invalid email or password",
    });
  });

  it("throws a friendly ApiError on 409", async () => {
    const fetchMock = mockFetch({ ok: false, status: 409, jsonBody: { detail: "dupe" } });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/v1/test")).rejects.toMatchObject({
      status: 409,
      message: "An account with this email already exists",
    });
  });

  it("joins 422 validation messages", async () => {
    const fetchMock = mockFetch({
      ok: false,
      status: 422,
      jsonBody: { detail: [{ msg: "bad email" }, { msg: "short password" }] },
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/v1/test")).rejects.toMatchObject({
      status: 422,
      message: "bad email. short password",
    });
  });

  it("wraps network failures in an ApiError", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const error = await apiFetch("/api/v1/test").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
  });
});

describe("auth endpoints", () => {
  afterEach(() => vi.restoreAllMocks());

  it("register posts email and password", async () => {
    const fetchMock = mockFetch({ jsonBody: { access_token: "t", token_type: "bearer" } });
    vi.stubGlobal("fetch", fetchMock);

    const result = await register("a@b.com", "password123");

    const [path, options] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/auth/register");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ email: "a@b.com", password: "password123" });
    expect(result.access_token).toBe("t");
  });

  it("login posts email and password", async () => {
    const fetchMock = mockFetch({ jsonBody: { access_token: "t", token_type: "bearer" } });
    vi.stubGlobal("fetch", fetchMock);

    await login("a@b.com", "password123");

    const [path, options] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/auth/login");
    expect(JSON.parse(options.body)).toEqual({ email: "a@b.com", password: "password123" });
  });

  it("getMe sends the provided token", async () => {
    const fetchMock = mockFetch({ jsonBody: { id: "1", email: "a@b.com", created_at: "now" } });
    vi.stubGlobal("fetch", fetchMock);

    const user = await getMe("my-token");

    const [path, options] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/auth/me");
    const headers = options.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer my-token");
    expect(user.email).toBe("a@b.com");
  });
});
