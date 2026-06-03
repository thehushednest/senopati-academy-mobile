# Senopati Academy — Mobile

React Native + Expo client untuk Senopati Academy. Berbagi backend dengan web app di [https://senopatiacademy.id](https://senopatiacademy.id).

**Versi:** 0.2.0 (Phase 2 — Feature-complete foundation)
**Status:** Development. Belum di-publish ke App Store / Play Store (butuh user action: Apple Dev $99/yr + Play Console $25).

---

## Yang Sudah Ada (Phase 1 + 2)

### Phase 1 — Foundation
| Area | Status |
|---|---|
| App scaffold (Expo 56 + Expo Router 56) | ✅ |
| Auth: Login + Signup OTP + Reset password OTP | ✅ |
| Secure storage token (Keychain / EncryptedSharedPrefs) | ✅ |
| Tab navigation: Beranda, Modul, Profil | ✅ |
| Profile screen + logout | ✅ |
| TypeScript strict | ✅ |

### Phase 2 — Native experience
| Area | Status |
|---|---|
| Backend `/api/auth/mobile/login` JWT Bearer (30d TTL) | ✅ |
| Backend `/api/auth/mobile/me` token validate | ✅ |
| Backend `/api/mobile/modul` + `/[slug]` content endpoints | ✅ |
| Mobile JWT auth (replace cookie hack) | ✅ |
| TanStack Query + AsyncStorage persistence (offline cache 24h) | ✅ |
| Native lesson player (markdown render via markdown-it) | ✅ |
| Biometric quick unlock (Face ID / Touch ID / fingerprint) | ✅ |
| Deep link `senopati://modul/<slug>` + universal link `https://senopatiacademy.id/modul/*` | ✅ |
| Push notification scaffold (expo-notifications + tap handler) | ✅ |
| EAS Build config (development / preview APK / production AAB+IPA) | ✅ |
| Branding asset generator (`scripts/generate-icons.mjs`) | ✅ |
| Branding placeholder asset (1024 icon, splash, favicon) | ✅ |

## Yang Belum (Phase 3 Roadmap)

- [ ] **Live session join** — SSE listener via `event-source-polyfill`
- [ ] **Push notif backend** — `POST /api/notifications/register` simpan Expo Push Token
- [ ] **Image upload** — `expo-image-picker` ke Lab Gambar AI
- [ ] **Profile editor native** — replace link ke web
- [ ] **Cerita Jeda native** — port narrative engine ke RN
- [ ] **Branding asset proper** — replace placeholder dengan asset dari designer
- [ ] **Apple Developer account ($99/yr)** — pending registrasi
- [ ] **Google Play Console ($25 one-time)** — pending registrasi
- [ ] **EAS account login** + project linking
- [ ] **App Store + Play Store listing** — screenshots, privacy URL, terms
- [ ] **Apple App Site Association (AASA)** di web `/.well-known/apple-app-site-association` untuk universal link
- [ ] **Android Asset Links** di web `/.well-known/assetlinks.json`

---

## Stack

| Komponen | Pilihan |
|---|---|
| Runtime | Expo SDK 56 (React Native 0.85) |
| Bahasa | TypeScript strict |
| Routing | Expo Router (file-based, mirror Next.js App Router) |
| State | React Context (auth) + hooks |
| Networking | `fetch` + custom client di `lib/api.ts` |
| Storage | `expo-secure-store` (Keychain / EncryptedSharedPrefs) |
| Web view | `react-native-webview` (untuk lesson player Phase 1) |
| Theming | Design tokens di `lib/theme.ts` (sync dengan web) |
| Bundle ID | `id.senopatiacademy.app` (iOS + Android) |

---

## Project Structure

```
senopati-academy-mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root layout + AuthProvider gate
│   ├── index.tsx                 # Splash → redirect ke (tabs) atau (auth)/login
│   ├── +not-found.tsx            # 404 fallback
│   ├── (auth)/                   # Auth group (no tab bar)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx            # 2-step: email → OTP+password
│   │   └── reset-password.tsx    # 2-step: email → OTP+newpass
│   ├── (tabs)/                   # Tab navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Beranda — greeting + 4 modul card
│   │   ├── modul.tsx             # Katalog (siap + segera hadir)
│   │   └── profil.tsx            # Avatar + akun + logout
│   └── modul/
│       └── [slug].tsx            # WebView ke /belajar/<slug>
├── lib/
│   ├── api.ts                    # API client + login/signup/getSession
│   ├── auth-context.tsx          # AuthProvider + useAuth
│   ├── storage.ts                # SecureStore wrapper (web fallback ke localStorage)
│   └── theme.ts                  # colors, radius, spacing, font tokens
├── assets/                       # Splash, icon, fonts (Expo defaults — replace untuk launch)
├── app.json                      # Expo config: name, slug, scheme, bundleId
└── tsconfig.json                 # strict + path alias @/*
```

---

## Development Setup

### Prereq
- Node 18+ (test di Node 22)
- npm 10+
- Expo Go app di HP kamu — [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) / [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Install + run

```bash
git clone git@github.com:thehushednest/senopati-academy-mobile.git
cd senopati-academy-mobile
npm install
npx expo start
```

Akan muncul QR code di terminal:
- **Android:** Buka Expo Go → tab "Scan" → scan QR
- **iOS:** Buka Camera app native → arahkan ke QR → tap notif

App akan hot-reload tiap kamu save file.

### Test API auth ke production

Default `apiBaseUrl` di `app.json` extra = `https://senopatiacademy.id`.

Test login pakai akun dummy:
- Email: `siswa.demo@asksenopati.com`
- Password: lihat memory project / vault

Untuk test signup OTP, pakai email kamu sendiri — kode 6 digit dikirim dari `noreply@senopatiacademy.id`. Rate limit: max 3 request per 15 menit per email.

### Switch ke dev backend (opsional)

Kalau backend dev di `localhost:3003` (lewat tunnel atau Wi-Fi yang sama):

```bash
# Edit app.json → extra.apiBaseUrl
# Atau set via env (perlu kode tweak)
```

⚠️ Cookie `__Secure-next-auth.session-token` butuh HTTPS — kalau backend HTTP, ganti cookie name `next-auth.session-token` di `lib/api.ts`.

---

## Build untuk Store (Phase 3 — pending user action)

EAS config sudah tersedia di [`eas.json`](./eas.json). 3 profile:
- `development` — dev client untuk Expo Dev Tools
- `preview` — APK Android untuk internal testing
- `production` — AAB Android + IPA iOS untuk store submission

### Persiapan user action

1. **Daftar Apple Developer account ($99/tahun)** — verifikasi 24-48 jam, pakai Apple ID + payment method internasional
2. **Daftar Google Play Console ($25 one-time)** — instant approval
3. **Daftar Expo account** + install CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```
4. **Link project ke EAS**:
   ```bash
   eas init --id <project-id-dari-expo-dashboard>
   ```
5. **Replace placeholder di `eas.json`** dengan Apple ID + Team ID + ASC App ID
6. **Replace branding asset** di `assets/images/` dengan asset dari designer (saat ini placeholder generated)

### Build commands

```bash
# Android APK untuk internal testing (install langsung di HP)
eas build --platform android --profile preview

# Android AAB untuk Play Store
eas build --platform android --profile production

# iOS untuk TestFlight + App Store
eas build --platform ios --profile production

# Build keduanya sekaligus
eas build --platform all --profile production
```

### Submit ke store

```bash
eas submit --platform android --latest    # ke Play Store internal track
eas submit --platform ios --latest        # ke TestFlight → App Store
```

### Review time
- **Apple App Store:** 1-3 hari kerja (lebih lama kalau ada reject)
- **Google Play:** 1 hari (review otomatis + manual)

### Setelah submit
1. Test via TestFlight (iOS) / Internal Testing (Android) dengan tim kecil dulu
2. Promote ke open beta setelah stable
3. Production release

---

## Universal Link Setup (Phase 3)

Supaya `https://senopatiacademy.id/modul/<slug>` buka app langsung kalau install (bukan browser), butuh setup di sisi WEB:

### iOS Apple App Site Association (AASA)

Web app harus serve `https://senopatiacademy.id/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.id.senopatiacademy.app",
        "paths": ["/modul/*", "/profil"]
      }
    ]
  }
}
```

`TEAM_ID` dari Apple Developer Console. File harus served `Content-Type: application/json`, tanpa redirect.

### Android Asset Links

Web app harus serve `https://senopatiacademy.id/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "id.senopatiacademy.app",
    "sha256_cert_fingerprints": ["SHA256_FROM_KEYSTORE"]
  }
}]
```

SHA256 dapat dari EAS:
```bash
eas credentials --platform android
```

---

## Auth Flow Detail

NextAuth credentials provider di web pakai HTTP-only cookie `__Secure-next-auth.session-token`. Untuk mobile, fetch tidak ada cookie jar otomatis. Workaround di `lib/api.ts`:

1. Fetch `GET /api/auth/csrf` → simpan `csrfToken` ke SecureStore
2. `POST /api/auth/callback/credentials` dengan body `csrfToken + email + password`
3. Parse response `Set-Cookie` header → extract `__Secure-next-auth.session-token=<jwt>`
4. Simpan token ke SecureStore (Keychain iOS / EncryptedSharedPrefs Android)
5. Tiap request ke `/api/*`: inject `Cookie: __Secure-next-auth.session-token=<token>` header
6. Kalau response punya `Set-Cookie` baru (token rotation), update SecureStore

**Bukan optimal**, tapi works tanpa perubahan backend. Phase 2 — backend tambah `/api/auth/mobile/login` yang return `{ token: JWT }` di body langsung, mobile pakai standar `Authorization: Bearer <token>`.

---

## Branding Assets — Pending Replace

Saat ini pakai Expo defaults. Untuk launch perlu generate:

| Asset | Spec |
|---|---|
| `assets/images/icon.png` | 1024×1024, no transparency, no rounded corners (iOS auto-rounds) |
| `assets/images/adaptive-icon.png` | 1024×1024, foreground only (Android adaptive) |
| `assets/images/splash-icon.png` | ~200×200 transparent center logo |
| `assets/images/favicon.png` | 48×48 (web favicon) |

Brand color: **`#18c29c`** (brand-strong: `#0e8b70`).

Suggested vendor: Figma export atau pakai tool seperti [Expo Asset Generator](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/).

---

## Troubleshooting

### Login fail "Email atau password salah"
- Cek backend up: `curl https://senopatiacademy.id/api/auth/csrf`
- Cek cookie name di backend (production = `__Secure-next-auth.session-token`, dev HTTP = `next-auth.session-token`)
- Hapus app data + login ulang

### Expo Go crash di Android
- Pastikan Expo Go version match SDK 56 (kalau Expo Go versi lama, update di Play Store)

### WebView modul muncul tapi tidak logged-in
- Token tidak terkirim ke WebView. Cek SecureStore — `await sessionStore.getToken()` di console
- Cookie name di backend bisa beda — `__Host-` prefix untuk strict mode

### TypeScript error di IDE tapi tsc pass
- Restart TS server di VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

---

## License

MIT. Lihat [LICENSE](./LICENSE).

---

*Mobile app foundation di-set up 2026-06-02. Phase 2 development setelah soft launch web app (target 2026-06-03).*
