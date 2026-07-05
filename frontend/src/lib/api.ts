import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, TokenPair } from "./types";

const TOKEN_KEY = "ms_access_token";
const REFRESH_KEY = "ms_refresh_token";

export const tokenStore = {
  get access() {
    return localStorage.getItem(TOKEN_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(tokens: TokenPair) {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// When the access token expires (401) -> call /auth/refresh once, then retry the request.
// Multiple concurrent 401s share the same refresh promise to avoid a race condition.
let refreshing: Promise<TokenPair> | null = null;

const doRefresh = async (): Promise<TokenPair> => {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) throw new Error("No refresh token");
  const res = await axios.post<ApiResponse<TokenPair>>(
    "/api/v1/auth/refresh",
    { refreshToken }
  );
  tokenStore.set(res.data.data);
  return res.data.data;
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };

    const isAuthRoute = original?.url?.includes("/auth/");
    if (error.response?.status === 401 && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        refreshing = refreshing ?? doRefresh();
        const tokens = await refreshing;
        refreshing = null;
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        tokenStore.clear();
        window.dispatchEvent(new Event("ms:logout"));
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export const getApiError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiResponse<unknown> | undefined;
    if (data?.errors && Array.isArray(data.errors) && data.errors.length) {
      const first = data.errors[0] as { message?: string };
      if (first?.message) return first.message;
    }
    return data?.message ?? err.message;
  }
  return "An unknown error occurred";
};
