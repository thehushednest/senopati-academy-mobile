/**
 * API client untuk Senopati Academy backend.
 *
 * Auth strategy untuk Phase 1:
 * - NextAuth credentials provider di web pakai HTTP-only cookie `next-auth.session-token`
 * - Mobile fetch tidak ada cookie jar otomatis, jadi:
 *   1. Fetch /api/auth/csrf → simpan csrfToken
 *   2. POST /api/auth/callback/credentials dengan email + password + csrfToken
 *   3. Parse Set-Cookie response untuk ambil session-token
 *   4. Simpan ke SecureStore
 *   5. Tiap request berikutnya: inject Cookie header
 *
 * Phase 2 roadmap: backend tambah /api/auth/mobile/login endpoint yang return
 *   { token: JWT, expiresAt } sehingga mobile bisa pakai Authorization: Bearer
 *   tanpa workaround cookie parsing.
 */
import Constants from "expo-constants";
import { sessionStore } from "./storage";

const BASE = (Constants.expoConfig?.extra as { apiBaseUrl?: string })?.apiBaseUrl ??
  "https://senopatiacademy.id";

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type FetchOptions = RequestInit & { skipAuth?: boolean };

async function buildHeaders(opts: FetchOptions): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "SenopatiAcademyMobile/0.1.0",
  };
  if (opts.body && !(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (!opts.skipAuth) {
    const token = await sessionStore.getToken();
    if (token) headers["Cookie"] = `__Secure-next-auth.session-token=${token}`;
  }
  return { ...headers, ...(opts.headers as Record<string, string> | undefined) };
}

export async function api<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const headers = await buildHeaders(opts);

  const res = await fetch(url, {
    ...opts,
    headers,
    credentials: "include",
  });

  // Set-Cookie parsing — NextAuth set token via cookie. Kalau ada session cookie baru, simpan.
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/__Secure-next-auth\.session-token=([^;]+)/);
    if (match) await sessionStore.setToken(match[1]);
  }

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const msg =
      (isJson && body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : null) ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, msg, body);
  }

  return body as T;
}

// ─── Auth ──────────────────────────────────────────────────────────

type CsrfResponse = { csrfToken: string };

export async function fetchCsrf(): Promise<string> {
  const res = await api<CsrfResponse>("/api/auth/csrf", { skipAuth: true });
  await sessionStore.setCsrf(res.csrfToken);
  return res.csrfToken;
}

export async function login(email: string, password: string): Promise<void> {
  const csrf = await fetchCsrf();
  const body = new URLSearchParams({
    csrfToken: csrf,
    email,
    password,
    callbackUrl: `${BASE}/dashboard`,
    json: "true",
  }).toString();

  const url = `${BASE}/api/auth/callback/credentials`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Cookie: `__Host-next-auth.csrf-token=${encodeURIComponent(csrf)}|hash`,
    },
    body,
    redirect: "manual",
  });

  const setCookie = res.headers.get("set-cookie") ?? "";
  const sessMatch = setCookie.match(/__Secure-next-auth\.session-token=([^;]+)/);
  if (!sessMatch) {
    throw new ApiError(401, "Email atau password salah");
  }
  await sessionStore.setToken(sessMatch[1]);

  // Fetch session profile
  const profile = await getSession();
  if (profile?.user) {
    await sessionStore.setUser({
      id: profile.user.id ?? "",
      email: profile.user.email ?? email,
      name: profile.user.name,
      role: profile.user.role ?? "student",
    });
  }
}

export async function logout(): Promise<void> {
  try {
    const csrf = await sessionStore.getCsrf();
    if (csrf) {
      await api("/api/auth/signout", {
        method: "POST",
        body: JSON.stringify({ csrfToken: csrf, callbackUrl: "/" }),
      }).catch(() => null);
    }
  } finally {
    await sessionStore.clear();
  }
}

type Session = {
  user?: { id?: string; email?: string; name?: string | null; role?: string };
  expires?: string;
} | null;

export async function getSession(): Promise<Session> {
  return api<Session>("/api/auth/session").catch(() => null);
}

// ─── OTP signup ────────────────────────────────────────────────────

export async function requestOtp(email: string, purpose: "signup_verify" | "password_reset") {
  return api<{ ok: boolean; expiresAt: string }>("/api/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ email, purpose }),
    skipAuth: true,
  });
}

export async function signup(params: {
  email: string;
  password: string;
  otp: string;
  name?: string;
}) {
  return api<{ ok: boolean; userId: string }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(params),
    skipAuth: true,
  });
}

export async function resetPassword(params: { email: string; password: string; otp: string }) {
  return api<{ ok: boolean }>("/api/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify(params),
    skipAuth: true,
  });
}

// ─── Content ───────────────────────────────────────────────────────

export type Module = {
  slug: string;
  title: string;
  categorySlug: string;
  level: "Pemula" | "Menengah" | "Lanjutan";
  duration: string;
  topics: number;
  excerpt: string;
  mentorSlug: string;
};

// Daftar modul Paham AI yang siap publik — di-hardcode supaya bisa offline-first
// dan tidak butuh endpoint khusus mobile. Phase 2: switch ke /api/modul.
export const LAUNCH_MODULES: Module[] = [
  {
    slug: "modul-01-introduction-to-ai",
    title: "Modul 01 — Introduction to AI",
    categorySlug: "foundations",
    level: "Pemula",
    duration: "90 menit",
    topics: 6,
    excerpt:
      "Pahami dasar AI dengan bahasa yang dekat dengan kehidupan siswa — bukan jargon.",
    mentorSlug: "arya-pratama",
  },
  {
    slug: "modul-02-ethical-use-of-ai",
    title: "Modul 02 — Ethical Use of AI",
    categorySlug: "ethics-safety",
    level: "Pemula",
    duration: "90 menit",
    topics: 6,
    excerpt:
      "Pakai AI dengan etis, aman, dan bertanggung jawab — di sekolah maupun sehari-hari.",
    mentorSlug: "maya-hendrawan",
  },
  {
    slug: "modul-11-fighting-hoax-with-ai",
    title: "Modul 11 — Fighting Hoax with AI",
    categorySlug: "ethics-safety",
    level: "Pemula",
    duration: "90 menit",
    topics: 7,
    excerpt:
      "Pakai AI dan nalar kritis — jangan sampai tertipu hoaks generasi deepfake.",
    mentorSlug: "maya-hendrawan",
  },
  {
    slug: "modul-22-ai-prompt-101",
    title: "Modul 22 — AI Prompts 101",
    categorySlug: "praktis",
    level: "Pemula",
    duration: "90 menit",
    topics: 7,
    excerpt:
      "Cara dapat hasil 5x lebih baik dari AI — bukan cuma pemakai, jadi prompt engineer.",
    mentorSlug: "reza-adityawan",
  },
];

export function moduleWebUrl(slug: string): string {
  return `${BASE}/belajar/${slug}`;
}
