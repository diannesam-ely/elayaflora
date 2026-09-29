import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, tokenStore } from "./api";

export type Role = "customer" | "flower_owner" | "admin";
export type User = { id: string; name: string; email: string; role: Role; status: string; created_at: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; role: Role }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await tokenStore.get();
    if (!token) { setUser(null); return; }
    try { const me = await api("/auth/me"); setUser(me); }
    catch { await tokenStore.del(); setUser(null); }
  }, []);

  useEffect(() => { (async () => { await refresh(); setLoading(false); })(); }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    await tokenStore.set(res.access_token);
    setUser(res.user);
    return res.user as User;
  };

  const register = async (data: any) => {
    const res = await api("/auth/register", { method: "POST", body: JSON.stringify(data) });
    await tokenStore.set(res.access_token);
    setUser(res.user);
    return res.user as User;
  };

  const logout = async () => { await tokenStore.del(); setUser(null); };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}
