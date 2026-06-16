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

// ─── Profile / Biodata (Phase 3A) ─────────────────────────────────
//
// Endpoint-endpoint ini dulu cuma support session cookie. Setelah web
// commit f11747d (getCurrentUser unified Bearer + session), mobile bisa
// pakai endpoint sama dengan auth Bearer.

export type BiodataPayload = {
  fullName?: string | null;
  schoolName?: string | null;
  schoolGrade?: string | null;
  phoneNumber?: string | null;
  // Field lengkap ada di web BiodataForm. Untuk Phase 3A mobile cuma
  // expose 4 field core supaya UI sederhana. Field lain (alamat,
  // ortu, dll) defer ke web /profil via webview.
};

export async function getBiodata(): Promise<BiodataPayload | null> {
  try {
    return await api<BiodataPayload>("/api/onboarding/biodata");
  } catch {
    return null;
  }
}

export async function updateBiodata(data: BiodataPayload): Promise<void> {
  await api("/api/onboarding/biodata", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Upload avatar dari file URI (expo-image-picker output) ke backend.
 * Backend resize ke 256×256 WebP + simpan ke MinIO. Return URL baru
 * dengan cache-buster (`?v=<timestamp>`).
 */
export async function uploadAvatar(localUri: string): Promise<string> {
  // React Native FormData: name diset manual karena fetch tidak parse
  // filename dari path otomatis di iOS.
  const form = new FormData();
  const filename = localUri.split("/").pop() || "avatar.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  const mime =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  // @ts-expect-error — RN FormData accepts {uri, name, type} object di field file
  form.append("file", { uri: localUri, name: filename, type: mime });

  const res = await api<{ ok: boolean; avatarUrl: string }>(
    "/api/account/avatar",
    {
      method: "POST",
      body: form,
    },
  );
  return res.avatarUrl;
}

export async function deleteAvatar(): Promise<void> {
  await api("/api/account/avatar", { method: "DELETE" });
}

// ─── Live Session (Phase 3A medium) ───────────────────────────────

export type LiveEventListItem = {
  id: string;
  title: string;
  description: string | null;
  format: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  scheduledAt: string;
  durationMinutes: number;
  joinCode: string | null;
  host: { id: string; name: string } | null;
  moduleSlug: string | null;
};

export type LiveEventDetail = LiveEventListItem & {
  meetingUrl: string | null;
  agenda: Array<{
    minute: number;
    block: string;
    activity: string;
    engagement?: string;
  }> | null;
  presentMaterialId: string | null;
  presentSlide: number | null;
  presentingSince: string | null;
};

export async function getLiveEvents(): Promise<LiveEventListItem[]> {
  try {
    const res = await api<{ events: LiveEventListItem[] }>("/api/live-events?upcoming=1");
    return res.events;
  } catch {
    return [];
  }
}

export async function getLiveEvent(id: string): Promise<LiveEventDetail | null> {
  try {
    const res = await api<{ event: LiveEventDetail }>(`/api/live-events/${id}`);
    return res.event;
  } catch {
    return null;
  }
}

export async function sendChatMessage(eventId: string, text: string): Promise<void> {
  await api(`/api/live-events/${eventId}/chat`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

// ─── Lab Gambar AI (forensik) ─────────────────────────────────────

export type ImageForensikSection = {
  n: number;
  key: string;
  title: string;
  subtitle: string;
  status: "ok" | "warn" | "bad";
  findings: string[];
};

export type ImageForensikResult = {
  verdict: string;
  confidence: string;
  ai: number;
  real: number;
  art: number;
  top: string;
  sections: ImageForensikSection[];
};

export async function analyzeImage(localUri: string): Promise<ImageForensikResult> {
  const form = new FormData();
  const filename = localUri.split("/").pop() || "image.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  const mime =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  // @ts-expect-error — RN FormData accepts {uri, name, type} object di field file
  form.append("image", { uri: localUri, name: filename, type: mime });

  const res = await api<{ ok: boolean; result: ImageForensikResult; error?: string }>(
    "/api/lab/image-forensik",
    { method: "POST", body: form },
  );
  if (!res.ok || !res.result) {
    throw new Error(res.error || "Analisis gagal");
  }
  return res.result;
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
