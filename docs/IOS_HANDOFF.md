# Senopati Academy — Handoff iOS App (untuk Claude Code di MacBook)

Tanggal: 2026-07-05. Ditulis dari sisi backend (repo web `Senopati_Academy`) untuk
melengkapi info yang TIDAK ada di repo mobile.

---

## 0. TL;DR — yang paling penting

- **App iOS-nya SUDAH ADA**, bukan scaffold dari nol. Repo: **`senopati-academy-mobile`**
  (Expo SDK 56 + expo-router + TypeScript). GitHub: `git@github.com:thehushednest/senopati-academy-mobile.git`.
- Di Mac: **clone repo itu**, `npm install`, lalu `npx expo run:ios` (butuh Xcode). Repo
  sudah punya `README.md` + folder `.claude` sendiri — **baca itu dulu** untuk detail app-internal.
- Mobile app adalah **CLIENT** dari backend API di `https://senopatiacademy.id`. Dua repo TERPISAH:
  - `Senopati_Academy` = web + backend API (deploy ke 27 VM via GitHub Actions CI/CD).
  - `senopati-academy-mobile` = Expo app (rilis via **EAS Build → TestFlight → App Store**, BUKAN lewat CI/CD web).
- **Kenapa pindah ke Mac**: build/run iOS butuh macOS + Xcode (tak bisa di Linux/WSL). Backend & Android bisa di mana saja.

---

## 1. Stack app mobile (yang sudah ada)

- Expo SDK **56**, `expo-router` (file-based routing), React Native, TypeScript.
- Bundle ID iOS: **`id.senopatiacademy.app`** · URL scheme: **`senopati`** · slug: `senopati-academy`.
- Sudah ada: auth (login/signup/reset/OTP), tabs (home/modul/profil), detail modul, live-session
  (SSE realtime + chat), Lab Gambar, edit profil, biometric unlock, push notif, storage.
- `lib/` sudah lengkap: `api.ts` (client + Bearer), `auth-context.tsx`, `sse.ts`, `push.ts`,
  `biometric.ts`, `storage.ts`, `query-client.ts` (React Query), `theme.ts`, `markdown.tsx`.
- Screens (`app/`): `(auth)/welcome|login|signup|reset-password`, `(tabs)/index|modul|profil`,
  `modul/[slug]`, `live-session/[id]`, `lab-gambar`, `profile-edit`.

## 2. Kontrak backend (INTEGRATION SURFACE — ini yang wajib dipatuhi mobile)

**Base URL**: `https://senopatiacademy.id` (di `lib/api.ts`; bisa override via `app.json → extra.apiBaseUrl` untuk dev).
Catatan: domain final = **senopatiacademy.id** (bukan asksenopati.com yang lama).

**Auth — JWT Bearer (bukan cookie):**
1. `POST /api/auth/mobile/login` body `{ email, password }` → `{ token, expiresAt, user }`. Token TTL **30 hari**.
2. Simpan token (AsyncStorage/SecureStore). Kirim di **setiap** request: header `Authorization: Bearer <token>`.
3. Startup: `GET /api/auth/mobile/me` untuk validasi token + ambil user.
4. Token di-sign dengan `NEXTAUTH_SECRET` yang sama dengan web (urusan backend; mobile cukup pakai token).
5. **PENTING (CSRF)**: backend punya middleware yang menolak POST/PUT/PATCH/DELETE lintas-origin
   yang TIDAK punya header `Authorization`. Karena mobile SELALU kirim `Authorization: Bearer`,
   request mobile **otomatis lolos** CSRF. Jangan kirim mutasi tanpa Bearer.
6. **Rate limit login**: 5 percobaan / 5 menit / IP (login gagal berlebih → 429). Login gagal
   direkam ke SOC (security log) backend.

**Endpoint auth lain:** `POST /api/auth/signup`, `POST /api/auth/otp/request` + `/api/auth/otp/verify`,
`POST /api/auth/password-reset/confirm`.

**Endpoint fitur (dipakai app, semua butuh Bearer):**
- Onboarding biodata: `GET|PUT /api/onboarding/biodata`
- Avatar: `POST|DELETE /api/account/avatar`
- Modul (mobile-optimized): `GET /api/mobile/modul`, `GET /api/mobile/modul/[slug]`
- Live events: `GET /api/live-events?upcoming=1`, `GET /api/live-events/[id]`,
  realtime **SSE**: `GET /api/live-events/[id]/stream`, chat: `POST /api/live-events/[id]/chat`
- Push token: `POST /api/notifications/register`
- Health check (publik): `GET /api/health` → `{ ok, version, ts }` (version = git SHA yg di-deploy)
- File/media: disajikan via proxy **`GET /api/storage/<objectKey>`** (relative ke base URL). Upload
  file pakai pola presigned (minta presigned URL ke backend → PUT langsung ke storage). Materi/PDF
  ada di bucket internal; jangan hardcode URL storage, selalu lewat `/api/storage/`.

**Modul yang READY dipakai** (untuk konten belajar): Modul **01, 02, 03, 04, 11, 22** + **Cerita Jeda**
(interactive story / psikometri pasif). Modul lain mungkin ada seed-nya tapi belum siap.

## 3. Konvensi mobile yang WAJIB diikuti

- **Orientasi**: default **PORTRAIT lock**. Hanya 3 layar boleh landscape: **Live Session**,
  **Learn as You Go**, **Cerita Jeda**. Jangan buka landscape global.
- **Bahasa**: Indonesia (kasual, istilah teknis Inggris). Audiens pelajar SMA/SMK/MA.
- **Copy**: hindari em-dash (—) di teks UI (biar tak terasa AI-generated); pakai titik/koma.

## 4. Universal Links / Deep Links (perlu aksi Apple)

- Backend menyajikan **AASA** di `https://senopatiacademy.id/.well-known/apple-app-site-association`.
  Isinya saat ini: `appID: "TEAMID.id.senopatiacademy.app"` — **`TEAMID` masih PLACEHOLDER**.
  → Harus diganti dengan **Apple Team ID asli** (10 karakter). Ini perubahan di **repo backend**
  (`public/.well-known/apple-app-site-association`), lalu deploy. Beritahu saya (Claude di laptop
  Linux) Team ID-nya, nanti saya update + deploy.
- Paths yang di-handle Universal Link: `/modul/*`, `/belajar/*`, `/cerita/*`, `/live-session/*`.
- Di app: `app.json` sudah set `ios.associatedDomains = ["applinks:senopatiacademy.id"]`. OK.

## 5. Yang PENDING butuh akun Apple (aksi user di Mac)

Di `eas.json → submit.production.ios` masih ada placeholder yang WAJIB diisi:
- `appleId` (email Apple Developer)
- `ascAppId` (App Store Connect App ID)
- `appleTeamId` (Apple Team ID — sama dgn yg untuk AASA di atas)

Prasyarat akun: **Apple Developer Program** ($99/th), App Store Connect app entry, cert/provisioning
(EAS bisa manage otomatis).

## 6. Setup di MacBook (prerequisite)

- macOS + **Xcode** (dari App Store) + Command Line Tools + **CocoaPods**.
- Node LTS + npm. Install **EAS CLI**: `npm i -g eas-cli` lalu `eas login`.
- Clone: `git clone git@github.com:thehushednest/senopati-academy-mobile.git`
- `cd senopati-academy-mobile && npm install`
- Run dev iOS (simulator): `npx expo run:ios` atau `npx expo start` + Expo Go/dev client.
- Build store: `eas build -p ios --profile production` → `eas submit -p ios`.
- (Repo mobile punya README dgn semua command build/submit + troubleshooting — rujuk itu.)

## 7. Cara "menyambungkan" ke project ini

Tidak ada penyambungan build. Yang menghubungkan hanyalah **API contract** (Bagian 2):
- Mobile memanggil `https://senopatiacademy.id/api/*` dengan Bearer JWT.
- Backend & mobile di-versioning terpisah di GitHub (`thehushednest/Senopati_Academy` &
  `thehushednest/senopati-academy-mobile`). CI/CD web (deploy VM) TIDAK menyentuh mobile.
- Kalau backend mengubah bentuk endpoint, mobile harus menyesuaikan (dan sebaliknya). Kalau perlu
  endpoint baru untuk fitur mobile, minta ke sisi backend (saya) — nanti saya tambah + deploy.

## 8. Instruksi untuk Claude Code di Mac (ringkas)

1. Baca `README.md` + `.claude/` di repo `senopati-academy-mobile` dulu (detail app-internal).
2. Pakai dokumen ini sebagai sumber kebenaran **kontrak backend + konvensi + pending Apple**.
3. Jangan scaffold ulang — app sudah ada (v0.2.0, Phase 1+2). Fokus: iOS build, isi placeholder
   Apple, uji di simulator/TestFlight, lanjut Phase 3 (store release) sesuai README.
4. Semua request mobile WAJIB Bearer JWT; hormati portrait-lock (kecuali 3 layar); base URL senopatiacademy.id.
5. Kalau butuh perubahan backend (endpoint baru, AASA Team ID, dsb) → koordinasi ke sisi backend.
