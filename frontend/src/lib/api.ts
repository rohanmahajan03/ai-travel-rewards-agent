const TOKEN_KEY = "access_token";

export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function parseError(response: Response): Promise<ApiError> {
  let detail: unknown = null;
  try {
    const body = await response.json();
    detail = body.detail;
  } catch {
    detail = null;
  }

  if (response.status === 401) {
    return new ApiError("Invalid email or password", response.status, detail);
  }
  if (response.status === 409) {
    return new ApiError("An account with this email already exists", response.status, detail);
  }
  if (response.status === 422 && Array.isArray(detail)) {
    const messages = detail
      .map((item: { msg?: string }) => item.msg)
      .filter(Boolean)
      .join(". ");
    return new ApiError(messages || "Validation failed", response.status, detail);
  }

  return new ApiError("Something went wrong. Please try again.", response.status, detail);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const authToken = token ?? getStoredToken();
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  let response: Response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    throw new ApiError("Something went wrong. Please try again.", 0);
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function register(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(token?: string): Promise<User> {
  return apiFetch<User>("/api/v1/auth/me", {}, token);
}
