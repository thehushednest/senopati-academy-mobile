# Senopati Backend — Connect & API Guide (untuk Claude Code di MacBook)

Tujuan: bikin Claude Code di Mac TIDAK buta — bisa **connect ke backend live**,
lihat data & bentuk respons nyata, lalu develop mobile app dengan benar.
Pelengkap `senopati-mobile-ios-handoff.md`. Tanggal: 2026-07-06.

---

## 0. Kunci utama: API backend itu PUBLIK

Backend `https://senopatiacademy.id/api/*` **reachable dari internet mana pun**
(via Cloudflare + load balancer). **TIDAK butuh VPN.** Jadi Claude di Mac bisa
langsung `curl`/`fetch` endpoint-nya untuk melihat data nyata. (Yang butuh VPN
hanya SSH ke server internal — itu urusan ops backend, bukan mobile dev.)

## 1. Akun test (QA) — silakan dipakai bebas

Sudah dibuatkan akun **student** khusus testing (aman, data dummy, boleh dikotori):

```
Email    : mobiletest@senopatiacademy.id
Password : mobtest-8422bace
Role     : student
User ID  : 06e57103-ad19-42f0-8c90-eb24a14c8bfa
```

(Ada juga akun tutor untuk uji fitur tutor: `wahyu2003@gmail.com`. Untuk mobile
app yang learner-facing, pakai akun student di atas.)

## 2. Cara connect (auth flow) — sudah diverifikasi jalan

```bash
BASE=https://senopatiacademy.id

# 1) Login → dapat JWT Bearer (TTL 30 hari)
TOKEN=$(curl -s -X POST $BASE/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mobiletest@senopatiacademy.id","password":"mobtest-8422bace"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 2) Pakai token di SETIAP request
curl -s $BASE/api/auth/mobile/me -H "Authorization: Bearer $TOKEN"
# → {"user":{"id","email","name","role","avatarUrl"}}

curl -s $BASE/api/mobile/modul -H "Authorization: Bearer $TOKEN"
# → {"items":[{"id","slug","title","excerpt",...}, ...]}

curl -s "$BASE/api/live-events?upcoming=1" -H "Authorization: Bearer $TOKEN"
# → {"events":[...]}
```

**Aturan wajib:**
- Semua request (kecuali yang public) butuh header `Authorization: Bearer <token>`.
- Request mobile otomatis LOLOS CSRF karena bawa header Authorization (jangan kirim mutasi tanpa Bearer).
- Login gagal berlebih → 429 (rate-limit 5/5menit/IP).

## 3. Cara "melihat" fitur = PROBE LANGSUNG

Claude di Mac tak perlu nebak bentuk data — **hit endpoint-nya live** dengan token
di atas, lihat JSON aslinya. Ini selalu akurat & tak pernah basi. Contoh alur eksplorasi:
`login → me → mobile/modul → mobile/modul/<slug> → progress → live-events → lab/*`.
Untuk endpoint mutasi (POST), coba dengan body minimal & baca error validasi (Zod)
yang dikembalikan — itu memberi tahu field yang dibutuhkan.

## 4. Sumber kebenaran bentuk request/response

1. **Probe live** (Bagian 3) — paling akurat.
2. **Repo mobile** `senopati-academy-mobile/lib/api.ts` — sudah punya tipe TS +
   wrapper untuk endpoint yang dipakai app (baca ini dulu untuk pola client).
3. **Repo backend** `Senopati_Academy` (kalau di-clone di Mac): tiap endpoint ada di
   `src/app/api/<path>/route.ts`, input tervalidasi **Zod** (`const schema = z.object({...})`),
   output = `NextResponse.json({...})`. Ini definisi paling resmi.

## 5. Peta endpoint (mobile-relevant, dikelompokkan)

Auth: `B`=butuh Bearer, `P`=publik.

**Auth & akun**
- `P POST /api/auth/mobile/login` {email,password} → {token,expiresAt,user}
- `B GET  /api/auth/mobile/me` → {user}
- `P POST /api/auth/register` {name,email,password,school?,grade?} → buat student (tanpa OTP)
- `P POST /api/auth/otp/request` + `POST /api/auth/otp/verify` (verifikasi email)
- `P POST /api/auth/signup` {email,code,password,name} (signup via OTP)
- `P POST /api/auth/password-reset/confirm`
- `B GET|PUT /api/account/profile` · `B POST /api/account/change-password`
- `B POST|DELETE /api/account/avatar`
- `B GET|PUT /api/onboarding/biodata` (lengkapi biodata; wajib agar student akses penuh)
- `P GET /api/wilayah/provinces|regencies|districts|villages|search` (untuk form biodata)

**Belajar (modul & progress)**
- `B GET /api/mobile/modul` → {items:[...]}  ·  `B GET /api/mobile/modul/[slug]` (detail + sesi)
- `B GET|POST /api/progress` (progres belajar)
- `B POST|GET /api/lessons/[lessonId]/video-progress`
- `B GET /api/quiz/attempts` · `B POST /api/quiz/submit` (nilai server-side)

**Cerita Jeda (interactive story / psikometri pasif)**
- `B POST /api/cerita/[slug]/start | advance | choice | finalize`

**Lab AI** (semua `B POST`, body JSON, respons JSON hasil analisis)
- `/api/lab/hoax-check` (Detektor Hoaks 5C, terima teks/gambar/video) · `/api/lab/hoax-check/history`
- `/api/lab/prompt-coach` {prompt,tujuan?} · `/api/lab/privacy-check` {text}
- `/api/lab/zona-ai` {deskripsi,jenisTugas?} · `/api/lab/audit-karier` {pekerjaan}
- `/api/lab/image-forensik` (analisa gambar AI) · `/api/writing/grade` (nilai writing)
- `/api/asksenopati` (chat AI) · `/api/asksenopati/[id]`

**Live Session** (realtime)
- `B GET|POST /api/live-events` · `B GET /api/live-events/[id]`
- Realtime **SSE**: `B GET /api/live-events/[id]/stream` (pakai `lib/sse.ts` di repo mobile)
- `B POST|DELETE /api/live-events/[id]/rsvp` · `B POST /api/live-events/[id]/chat`
- `B .../qna` (tanya-jawab) · `.../quiz-push/*` (kuis live + leaderboard) · `.../survey` (NPS)
- `B POST /api/live-events/[id]/heartbeat` (presence) · `.../activity` · `.../insight`
- Join by code: `B POST /api/student/join-session` {code} · `B POST /api/student/join-class` {code}

**Diskusi / tugas / sertifikat**
- `B GET|POST /api/discussion` · `B GET /api/discussion/[id]` · `.../reply` · `.../like`
- `B GET /api/assignment` · `B POST /api/assignment/submit` · `B POST /api/assignment/presigned-upload`
- `B POST /api/certificate/issue` · `P GET /api/certificate/verify/[code]`
- `B GET|POST /api/review`  ·  `B GET|PUT /api/notes` · `B GET /api/notes/all`

**Karir & keuangan (fitur student)**
- `B /api/student/career/applications|cv|submit` (tracker lamaran + CV builder)
- `B /api/student/keuangan` · `/api/student/shared-expense` · `POST /api/keuangan/ocr-struk`

**Program**
- `B GET /api/programs/[slug]` · `POST /api/programs/[slug]/enroll` · `GET .../activities`

**Notifikasi / push**
- `B GET /api/notifications` · `.../[id]/read` · `.../read-all`
- `P POST|DELETE /api/notifications/register` (daftar device token push)
- `P GET /api/notifications/vapid-public-key` (web push)

**Pesan / storage / health**
- `B GET|POST /api/pesan` · `/api/pesan/[id]` · `POST /api/pesan/contact-support`
- `B GET /api/storage/[...key]` (proxy file/media; jangan hardcode URL storage, selalu lewat sini)
- `P GET /api/health` → {ok,version,ts}

## 6. Konvensi wajib (recap)

- **Orientasi**: PORTRAIT lock default; landscape hanya di **Live Session, Learn as You Go, Cerita Jeda**.
- Bahasa Indonesia (istilah teknis Inggris), audiens SMA/SMK/MA. Hindari em-dash di copy UI.
- **Modul yang READY dipakai**: 01, 02, 03, 04, 11, 22 + Cerita Jeda.
- Bundle ID iOS `id.senopatiacademy.app`, scheme `senopati`, Universal Links `applinks:senopatiacademy.id`.

## 7. Alur latihan fitur pakai akun test (biar Claude "paham" fiturnya)

1. Login (Bagian 2) → simpan token.
2. `PUT /api/onboarding/biodata` untuk melengkapi biodata (agar akses penuh; ambil kode
   wilayah dari `/api/wilayah/*`).
3. `GET /api/mobile/modul` → pilih slug → `GET /api/mobile/modul/[slug]` (lihat struktur sesi).
4. Coba `POST /api/quiz/submit`, `POST /api/cerita/[slug]/start`, dan endpoint `POST /api/lab/*`
   untuk melihat bentuk request/response fitur AI.
5. `GET /api/live-events?upcoming=1` untuk live session.

## 8. Kalau butuh perubahan backend

Endpoint baru / perubahan kontrak / Apple Team ID untuk AASA → koordinasi ke sisi backend
(Claude di laptop Linux + operator). Repo backend & mobile terpisah; tak ada shared build pipeline.
