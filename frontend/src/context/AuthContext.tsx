import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ApiError,
  clearStoredToken,
  getMe,
  getStoredToken,
  login as apiLogin,
  register as apiRegister,
  setStoredToken,
  type User,
} from "../lib/api";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function authenticate(
  action: (email: string, password: string) => Promise<{ access_token: string }>,
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  const { access_token } = await action(email, password);
  setStoredToken(access_token);
  const user = await getMe(access_token);
  return { token: access_token, user };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    getMe(storedToken)
      .then((currentUser) => {
        setToken(storedToken);
        setUser(currentUser);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          clearStoredToken();
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authenticate(apiLogin, email, password);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const result = await authenticate(apiRegister, email, password);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
