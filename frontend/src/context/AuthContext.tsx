import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, tokenStore } from "../lib/api";
import type { ApiResponse, AuthUser, TokenPair, User } from "../lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  booting: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<User>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isManagerUp: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const boot = async () => {
      if (!tokenStore.access) {
        setBooting(false);
        return;
      }
      try {
        const res = await api.get<ApiResponse<AuthUser>>("/auth/me");
        setUser(res.data.data);
      } catch {
        tokenStore.clear();
      } finally {
        setBooting(false);
      }
    };
    boot();
  }, []);

  useEffect(() => {
    const onForcedLogout = () => setUser(null);
    window.addEventListener("ms:logout", onForcedLogout);
    return () => window.removeEventListener("ms:logout", onForcedLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<
      ApiResponse<{ user: User; tokens: TokenPair }>
    >("/auth/login", { email, password });
    const { user: u, tokens } = res.data.data;
    tokenStore.set(tokens);
    setUser({ userId: u.id, email: u.email, role: u.role });
  }, []);

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => {
      const res = await api.post<ApiResponse<User>>("/auth/register", payload);
      return res.data.data;
    },
    []
  );

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    await api.post("/auth/verify-otp", { email, otp });
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    await api.post("/auth/resend-otp", { email });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // token may already be expired — still log out on the client side
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        booting,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        isAdmin: user?.role === "admin",
        isManagerUp: user?.role === "admin" || user?.role === "manager",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
