import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "elaya_token";

export const tokenStore = {
  get: async (): Promise<string | null> => {
    if (Platform.OS === "web") return typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    return SecureStore.getItemAsync(KEY);
  },
  set: async (v: string) => {
    if (Platform.OS === "web") { if (typeof localStorage !== "undefined") localStorage.setItem(KEY, v); return; }
    return SecureStore.setItemAsync(KEY, v);
  },
  del: async () => {
    if (Platform.OS === "web") { if (typeof localStorage !== "undefined") localStorage.removeItem(KEY); return; }
    return SecureStore.deleteItemAsync(KEY);
  },
};

export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";
const API = BACKEND_URL + "/api";

/** Resolve an image/file reference to a full URL.
 * Backend upload paths come back as "/api/files/..." and need the host prefix.
 * Remote http(s) URLs are returned as-is. */
export function mediaUrl(ref?: string | null): string | undefined {
  if (!ref) return undefined;
  if (ref.startsWith("http://") || ref.startsWith("https://")) return ref;
  if (ref.startsWith("/api/")) return BACKEND_URL + ref;
  return ref;
}

export async function api(path: string, opts: RequestInit = {}): Promise<any> {
  const token = await tokenStore.get();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as any),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}
