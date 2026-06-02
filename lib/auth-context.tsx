/**
 * Auth context provider — share state user di-cabang seluruh app + bootstrap session
 * dari secure storage saat app start.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { sessionStore } from "./storage";
import { getSession, login as apiLogin, logout as apiLogout } from "./api";

export type AppUser = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
};

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
        // Verify dengan server — kalau token expired, hapus
        const token = await sessionStore.getToken();
        if (token) {
          const sess = await getSession();
          if (cancelled) return;
          if (sess?.user) {
            const next: AppUser = {
              id: sess.user.id ?? stored?.id ?? "",
              email: sess.user.email ?? stored?.email ?? "",
              name: sess.user.name ?? stored?.name ?? null,
              role: sess.user.role ?? stored?.role ?? "student",
            };
            await sessionStore.setUser(next);
            setUser(next);
          } else {
            await sessionStore.clear();
            setUser(null);
          }
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
        await apiLogin(email, password);
        const stored = await sessionStore.getUser();
        setUser(stored);
      },
      async signOut() {
        await apiLogout();
        setUser(null);
      },
      async refresh() {
        const sess = await getSession();
        if (sess?.user) {
          const next: AppUser = {
            id: sess.user.id ?? "",
            email: sess.user.email ?? "",
            name: sess.user.name ?? null,
            role: sess.user.role ?? "student",
          };
          await sessionStore.setUser(next);
          setUser(next);
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
