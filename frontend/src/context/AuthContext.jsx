import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Only show the loading screen when there is a saved session to restore.
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

  const loadProfile = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (!localStorage.getItem("token")) return undefined;
    api
      .get("/auth/profile")
      .then((res) => !ignore && setUser(res.data))
      .catch(() => {
        localStorage.removeItem("token");
        if (!ignore) setUser(null);
      })
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  const login = async (credentials) => {
    const res = await api.post("/auth/login", credentials);
    localStorage.setItem("token", res.data.token);
    await loadProfile();
    return res.data.user;
  };

  // Students are logged in straight away. Faculty get no token until an admin approves them.
  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      await loadProfile();
    }
    return { user: res.data.user, pendingApproval: !res.data.token, message: res.message };
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Logging out locally is what matters.
    }
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile: loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook lives beside its provider
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
