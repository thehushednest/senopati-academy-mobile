/**
 * API client untuk Senopati Academy backend — Phase 2 JWT Bearer.
 *
 * Auth flow:
 * 1. POST /api/auth/mobile/login { email, password } → { token, expiresAt, user }
 * 2. Simpan token + user di SecureStore
 * 3. Tiap request: Authorization: Bearer <token>
 * 4. Tiap startup: GET /api/auth/mobile/me untuk validate token
 */
import Constants from "expo-constants";
import { sessionStore, type StoredUser } from "./storage";

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
    "User-Agent": "SenopatiAcademyMobile/0.2.0",
  };
  if (opts.body && !(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (!opts.skipAuth) {
    const token = await sessionStore.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return { ...headers, ...(opts.headers as Record<string, string> | undefined) };
}

export async function api<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const headers = await buildHeaders(opts);

  let res: Response;
  try {
    res = await fetch(url, { ...opts, headers });
  } catch (err) {
    // Network-level fail (DNS, TLS, no connectivity). Sebelumnya thrown as
    // TypeError "Network request failed" dengan no detail — user lihat
    // "Tidak bisa masuk. Coba lagi." generic. Wrap jadi ApiError supaya
    // error message lebih informatif.
    const detail = err instanceof Error ? err.message : String(err);
    throw new ApiError(
      0,
      `Tidak bisa terhubung ke server. Cek koneksi internet kamu. (${detail})`,
      { url, error: detail },
    );
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

type LoginResponse = {
  token: string;
  expiresAt: string;
  user: StoredUser;
};

export async function login(email: string, password: string): Promise<StoredUser> {
  const res = await api<LoginResponse>("/api/auth/mobile/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  await sessionStore.setToken(res.token, res.expiresAt);
  await sessionStore.setUser(res.user);
  return res.user;
}

export async function getMe(): Promise<StoredUser | null> {
  try {
    const res = await api<{ user: StoredUser }>("/api/auth/mobile/me");
    return res.user;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await sessionStore.clear();
}

// ─── OTP signup (re-use existing endpoint, return JSON) ───────────

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

// ─── Modul (Phase 2: API-backed) ──────────────────────────────────

export type ModulListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  level: string;
  coverImageUrl: string | null;
  durationMinutes: number | null;
  lessonCount: number;
  comingSoon: boolean;
};

export type ModulDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  coverImageUrl: string | null;
  durationMinutes: number | null;
  format: string;
  objectivesJson: unknown;
  highlightsJson: unknown;
  previewBody: string | null;
  tutor: { id: string; name: string; avatarUrl: string | null };
  lessons: Array<{
    id: string;
    title: string;
    orderIndex: number;
    durationMinutes: number | null;
    notes: string | null;
    videoProvider: string | null;
    videoUrl: string | null;
  }>;
};

export async function fetchModulList() {
  return api<{ items: ModulListItem[] }>("/api/mobile/modul");
}

export async function fetchModul(slug: string) {
  return api<{ course: ModulDetail }>(`/api/mobile/modul/${slug}`);
}

// Fallback hard-coded (kalau API gagal, e.g. offline saat first run)
export const LAUNCH_MODULES: ModulListItem[] = [
  {
    id: "fallback-01",
    slug: "modul-01-introduction-to-ai",
    title: "Modul 01 — Introduction to AI",
    excerpt: "Pahami dasar AI dengan bahasa yang dekat dengan kehidupan siswa.",
    category: "foundations",
    level: "Pemula",
    coverImageUrl: null,
    durationMinutes: 90,
    lessonCount: 6,
    comingSoon: false,
  },
  {
    id: "fallback-02",
    slug: "modul-02-ethical-use-of-ai",
    title: "Modul 02 — Ethical Use of AI",
    excerpt: "Pakai AI dengan etis, aman, dan bertanggung jawab.",
    category: "ethics-safety",
    level: "Pemula",
    coverImageUrl: null,
    durationMinutes: 90,
    lessonCount: 6,
    comingSoon: false,
  },
  {
    id: "fallback-11",
    slug: "modul-11-fighting-hoax-with-ai",
    title: "Modul 11 — Fighting Hoax with AI",
    excerpt: "Pakai AI dan nalar kritis — jangan sampai tertipu hoaks deepfake.",
    category: "ethics-safety",
    level: "Pemula",
    coverImageUrl: null,
    durationMinutes: 90,
    lessonCount: 7,
    comingSoon: false,
  },
  {
    id: "fallback-22",
    slug: "modul-22-ai-prompt-101",
    title: "Modul 22 — AI Prompts 101",
    excerpt: "Cara dapat hasil 5x lebih baik dari AI.",
    category: "praktis",
    level: "Pemula",
    coverImageUrl: null,
    durationMinutes: 90,
    lessonCount: 7,
    comingSoon: false,
  },
];

export function moduleWebUrl(slug: string): string {
  return `${BASE}/belajar/${slug}`;
}
