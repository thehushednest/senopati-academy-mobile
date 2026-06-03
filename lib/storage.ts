/**
 * Token + session storage via expo-secure-store (Keychain di iOS,
 * EncryptedSharedPreferences di Android). Web fallback ke localStorage.
 *
 * Phase 2 — switch dari NextAuth cookie ke JWT Bearer token (issued by
 * /api/auth/mobile/login). Simpler, no Set-Cookie parsing.
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY_TOKEN = "senopati.jwt";
const KEY_TOKEN_EXP = "senopati.jwt_exp";
const KEY_USER = "senopati.user";
const KEY_BIOMETRIC_ENABLED = "senopati.biometric_enabled";
const KEY_BIOMETRIC_TOKEN_SHADOW = "senopati.biometric_shadow"; // copy untuk quick-unlock

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

export type StoredUser = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  avatarUrl?: string | null;
};

export const sessionStore = {
  async getToken() {
    return get(KEY_TOKEN);
  },
  async setToken(token: string | null, expiresAt?: string | null) {
    await set(KEY_TOKEN, token);
    await set(KEY_TOKEN_EXP, expiresAt ?? null);
  },
  async getTokenExp(): Promise<Date | null> {
    const raw = await get(KEY_TOKEN_EXP);
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  },
  async isTokenExpired(): Promise<boolean> {
    const exp = await this.getTokenExp();
    if (!exp) return false;
    // 5 min buffer
    return exp.getTime() - Date.now() < 5 * 60 * 1000;
  },
  async getUser(): Promise<StoredUser | null> {
    const raw = await get(KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },
  async setUser(u: StoredUser | null) {
    return set(KEY_USER, u ? JSON.stringify(u) : null);
  },
  async clear() {
    await Promise.all([
      set(KEY_TOKEN, null),
      set(KEY_TOKEN_EXP, null),
      set(KEY_USER, null),
      set(KEY_BIOMETRIC_TOKEN_SHADOW, null),
    ]);
    // keep KEY_BIOMETRIC_ENABLED supaya preferensi user tetap
  },
  // ─── Biometric quick unlock ─────────────────────────────────────
  async isBiometricEnabled(): Promise<boolean> {
    return (await get(KEY_BIOMETRIC_ENABLED)) === "1";
  },
  async setBiometricEnabled(enabled: boolean) {
    if (enabled) {
      const t = await get(KEY_TOKEN);
      if (t) await set(KEY_BIOMETRIC_TOKEN_SHADOW, t);
      await set(KEY_BIOMETRIC_ENABLED, "1");
    } else {
      await set(KEY_BIOMETRIC_ENABLED, null);
      await set(KEY_BIOMETRIC_TOKEN_SHADOW, null);
    }
  },
  async getBiometricShadowToken(): Promise<string | null> {
    return get(KEY_BIOMETRIC_TOKEN_SHADOW);
  },
};
