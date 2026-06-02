/**
 * Token + session storage via expo-secure-store (Keychain di iOS, EncryptedSharedPreferences di Android).
 * Untuk dev di web, fallback ke localStorage supaya bisa test di Expo web.
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY_SESSION = "senopati.session_token";
const KEY_CSRF = "senopati.csrf_token";
const KEY_USER = "senopati.user";

async function set(key: string, value: string | null) {
  if (Platform.OS === "web") {
    if (value === null) globalThis.localStorage?.removeItem(key);
    else globalThis.localStorage?.setItem(key, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}

async function get(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

export const sessionStore = {
  async getToken() {
    return get(KEY_SESSION);
  },
  async setToken(t: string | null) {
    return set(KEY_SESSION, t);
  },
  async getCsrf() {
    return get(KEY_CSRF);
  },
  async setCsrf(t: string | null) {
    return set(KEY_CSRF, t);
  },
  async getUser() {
    const raw = await get(KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { id: string; email: string; name?: string | null; role: string };
    } catch {
      return null;
    }
  },
  async setUser(u: { id: string; email: string; name?: string | null; role: string } | null) {
    return set(KEY_USER, u ? JSON.stringify(u) : null);
  },
  async clear() {
    await Promise.all([set(KEY_SESSION, null), set(KEY_CSRF, null), set(KEY_USER, null)]);
  },
};
