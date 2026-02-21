import React, { createContext, useContext, useEffect, useState } from "react";
import { storeAuth, getStoredAuth, clearAuth, StoredUser } from "./storage";

const API_BASE = "https://kirastreamsv2.vercel.app/api/auth";

interface AuthContextValue {
  user: StoredUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, token: null, loading: true,
  login: async () => {}, signup: async () => {}, logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<StoredUser | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredAuth().then((stored) => {
      if (stored) { setToken(stored.token); setUser(stored.user); }
      setLoading(false);
    });
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Login failed.");
    const storedUser: StoredUser = {
      id: String(data.user.id),
      email: data.user.email,
      name: data.user.name ?? undefined,
      isAdmin: data.user.role === "admin",
    };
    await storeAuth(data.token, storedUser);
    setToken(data.token);
    setUser(storedUser);
  }

  async function signup(email: string, password: string, name?: string) {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        username: name?.trim() || email.split("@")[0],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Sign up failed.");
    const storedUser: StoredUser = {
      id: String(data.user.id),
      email: data.user.email,
      name: data.user.name ?? undefined,
      isAdmin: data.user.role === "admin",
    };
    await storeAuth(data.token, storedUser);
    setToken(data.token);
    setUser(storedUser);
  }

  async function logout() {
    await clearAuth();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
