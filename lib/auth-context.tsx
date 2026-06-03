/**
 * Auth context provider — share state user di-cabang seluruh app + bootstrap
 * session dari secure storage saat app start. Phase 2 — pakai JWT Bearer.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { sessionStore, type StoredUser } from "./storage";
import { getMe, login as apiLogin, logout as apiLogout } from "./api";

export type AppUser = StoredUser;

type AuthContextValue = {
  user: AppUser | null;
  isBootstrapping: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const stored = await sessionStore.getUser();
        if (stored && !cancelled) setUser(stored);

        const token = await sessionStore.getToken();
        if (!token) return;

        // Refresh dari server — kalau token expired/revoked, clear.
        const me = await getMe();
        if (cancelled) return;
        if (me) {
          await sessionStore.setUser(me);
          setUser(me);
        } else {
          await sessionStore.clear();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      async signIn(email, password) {
        const u = await apiLogin(email, password);
        setUser(u);
      },
      async signOut() {
        await apiLogout();
        setUser(null);
      },
      async refresh() {
        const me = await getMe();
        if (me) {
          await sessionStore.setUser(me);
          setUser(me);
        }
      },
    }),
    [user, isBootstrapping],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
