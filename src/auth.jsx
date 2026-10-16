import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState(() => (getToken() ? "loading" : "anonymous"));
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [bootError, setBootError] = useState(null);

  const dropSession = useCallback(() => {
    clearToken();
    setUser(null);
    setUsage(null);
    setBootError(null);
    setStatus("anonymous");
    if (window.location.pathname !== "/login") {
      window.history.pushState({}, "", "/login");
    }
  }, []);

  const restore = useCallback(async () => {
    if (!getToken()) {
      setStatus("anonymous");
      return;
    }
    setStatus("loading");
    setBootError(null);
    try {
      const body = await api("/auth/me");
      setUser(body.user);
      setUsage(body.usage ?? null);
      setStatus("ready");
    } catch (error) {
      if (error?.name === "AbortError") return;
      if (error?.status === 0 && getToken()) {
        setBootError(error);
        setStatus("offline");
        return;
      }
      setUser(null);
      setUsage(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(dropSession);
    return () => setUnauthorizedHandler(() => {});
  }, [dropSession]);

  useEffect(() => {
    if (getToken()) {
      const timer = window.setTimeout(() => {
        void restore();
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [restore]);

  const login = useCallback(async (email, password) => {
    const body = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(body.accessToken);
    const home = body.user.role === "SUPER_ADMIN" ? "/projects" : "/send";
    window.history.pushState({}, "", home);
    setUser(body.user);
    setUsage(body.usage ?? null);
    setBootError(null);
    setStatus("ready");
  }, []);

  const logout = useCallback(() => {
    dropSession();
  }, [dropSession]);

  const value = useMemo(
    () => ({
      status,
      user,
      usage,
      bootError,
      setUser,
      setUsage,
      login,
      logout,
      restore,
    }),
    [status, user, usage, bootError, login, logout, restore],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook shared with the provider in this module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
