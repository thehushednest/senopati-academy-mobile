# Senopati Academy — Peta Fitur Lengkap per Role

Penjelasan semua isi & fitur platform, dibagi per role user. Sumber: navigasi
resmi (`DashboardSidebar`) + rute halaman backend. Untuk kontrak API tiap fitur
lihat `BACKEND_API_CONTRACTS.md`. Tanggal: 2026-07-06.

Platform = **LMS literasi AI** untuk pelajar Indonesia (SMA/SMK/MA). 3 role:
**student** (default), **tutor**, **admin**. Login menentukan menu (Learning Space /
Tutor Space / Admin Panel). Bahasa Indonesia. Domain: senopatiacademy.id.

---

## Konsep lintas-fitur (wajib paham dulu)

- **Modul**: unit belajar. Yang READY dipakai: **Modul 01** (Paham AI/Intro),
  **02** (Ethical Use of AI), **03** (Data Privacy & AI Safety), **04** (Masa Depan AI),
  **11** (Fighting Hoax with AI), **22** (AI Prompt 101), plus **Cerita Jeda**
  (cerita interaktif). Tiap modul punya beberapa **sesi**.
- **Program**: kumpulan modul. Contoh **"Paham AI"** = Cerita Jeda + Modul 01, 02, 11, 22.
- **Mentor track**: tutor di-map ke track (saat ini `senopati-master-mentor` yang
  mencakup semua modul). Menentukan modul apa yang bisa tutor ampu/upload materi.
- **Biodata / onboarding**: student baru wajib lengkapi biodata (nama, wilayah BPS,
  sekolah, dll) sebelum akses penuh. Wilayah dari endpoint `/api/wilayah/*`.
- **Scorecard & Tier**: performa student dihitung jadi tier: **unggulan / aktif /
  berkembang / memulai / insufficient**. Dipakai di Papan Skor & Skor Belajarku.
- **Psikometri pasif (Big5)**: skor kepribadian diperoleh diam-diam dari pilihan di
  **Cerita Jeda** (bukan kuis eksplisit). Hanya completion pertama yang dihitung.
- **Live Session**: kelas realtime (SSE). Fitur: chat, Q&A, quiz-push (kuis live +
  leaderboard), NPS/survey, presence/heartbeat, insight, rekaman.
- **Wali kelas (homeroom tutor)**: tutor bisa jadi wali kelas siswa; ada alur reset.

---

# ROLE: STUDENT (Learning Space)

## Belajar Inti
- **Dashboard** (`/dashboard`) — ringkasan progres, modul aktif, jadwal, rekomendasi.
- **Kelas Aktif** (`/kelas`) — modul/kelas yang sedang/enrolled diikuti + progres per sesi.
- **Live Session** (`/live-session`) — ikut kelas realtime; join via kode sesi (6 digit)
  atau kode kelas; chat, Q&A, jawab quiz-push, isi NPS. (Salah satu layar boleh landscape.)
- **Learn as You Go** (`/learn`) — belajar potongan kecil/mikro, gaya swipe. (Boleh landscape.)
- **Perpustakaan** (`/perpustakaan`) — bahan bacaan/materi yang bisa diunduh.

## Lab AI (tools cerdas — inti diferensiasi platform)
- **AskSenopati AI** (`/asksenopati`) — chatbot AI (tanya tugas/konsep/ngobrol), sadar
  tanggal + freshness web-search. Ada juga varian app (`/asksenopati-app`).
- **Analisis Gambar AI** (`/analisis-gambar-ai`) — forensik gambar 12-langkah (deteksi
  AI-generated/deepfake); sekarang juga terima **video** (deepfake scan per-frame).
- **Cek Hoaks AI (5C)** (`/lab-ai/cek-hoaks`) — Detektor Hoaks kerangka 5C (Modul 11):
  cek sumber/konteks/klaim/gambar/emosi; terima teks/gambar/video + reverse-image & fact-checker links.
- **Prompt Coach** (`/lab-ai/prompt-coach`) — nilai prompt dgn kerangka K-I-F-C (Modul 22),
  saran teknik + tulis versi upgrade.
- **Cek Sebelum Kirim** (`/lab-ai/cek-sebelum-kirim`) — deteksi data pribadi sebelum dikirim
  ke AI (UMUM/SPESIFIK UU PDP, zona hijau/kuning/merah, versi aman) — Modul 03.
- **Zona AI + Disclosure** (`/lab-ai/zona-ai`) — nilai etika pakai AI utk tugas (zona
  Hijau/Kuning/Merah + kerangka BIJAK) + generate disclosure jujur — Modul 02.
- **Audit Karier AI** (`/lab-ai/audit-karier`) — audit pekerjaan impian ke 5 Zona Kerentanan
  otomasi + kompetensi manusia + strategi adaptasi — Modul 04.
- **Generator Video AI** (`/generator-video-ai`) — bikin video pakai AI (avatar/HeyGen; sebagian gated env).

## Karir & Persiapan
- **Eksplorasi Karir** (`/karir`) — jurusan, beasiswa, lowongan kerja (data di-scrape/di-kurasi),
  tracker lamaran, CV builder AI.
- **Simulasi IELTS** (`/karir/ielts`) — latihan IELTS (Writing dll) + AI grading.
- **Simulasi TOEFL** (`/karir/toefl`) — latihan TOEFL iBT/ITP/2026 (Reading/Listening/Structure
  auto-grade, Speaking, Writing, Build Sentence, adaptive) + AI grading.

## Engagement
- **Skor Belajarku** (`/skor-belajarku`) — skor & tier personal, progres belajar.
- **Papan Skor** (`/papan-skor`) — leaderboard antar-siswa (per periode).
- **Cerita Interaktif** (`/cerita`) — **Cerita Jeda**: cerita bercabang (pilihan) yang
  sekaligus mengukur psikometri Big5 secara pasif. (Boleh landscape.)
- **Pesan** (`/pesan`) — pesan/DM (dengan blokir + opt-out), kontak support.

## Personal
- **Catatan Saya** (`/catatan`) — catatan belajar pribadi.
- **Catatan Keuanganku** (`/keuangan`) — pencatatan keuangan + OCR struk + shared-expense.
- **AskSenopati App** (`/asksenopati-app`) — varian AskSenopati.
- **Profil Saya** (`/profil`) — biodata, avatar, ganti password, pengaturan akun.

---

# ROLE: TUTOR (Tutor Space)

## Pengajaran Inti
- **Dashboard** (`/dashboard`) — ringkasan mengajar (siswa, review pending, notif).
- **Modul Saya** (`/tutor/modul`) — modul yang di-ampu (sesuai mentor track) + stats.
- **Materi & Soal** (`/tutor/materi`) — **upload materi** (PDF/PPT/dok/gambar) ke modul yang
  diampu (presigned → MinIO). Tutor TIDAK bisa bikin modul baru, hanya materi.

## Sesi & Murid
- **Live Session** (`/tutor/live`) — host kelas realtime: kontrol slide, push quiz, lihat
  Q&A, NPS, presence, akhiri sesi, rekaman.
- **Review Tugas** (`/tutor/review`) — nilai/koreksi tugas (assignment submission) siswa.
- **Siswa & Diskusi** (`/tutor/siswa`) — daftar siswa yang diampu + diskusi; kelola
  permintaan reset (wali kelas) — ada banner/badge notif.

## Lab AI
- Sama dengan student (AskSenopati, Analisis Gambar, Cek Hoaks, Prompt Coach, Cek Sebelum
  Kirim, Zona AI, Audit Karier, Generator Video) — untuk dipakai/didemokan ke siswa.

## Sumber & Komunikasi
- **Perpustakaan** (`/perpustakaan`) — bahan ajar bersama.
- **Learn as You Go** (`/learn`) — preview materi mikro.
- **Usul Pelajaran** (`/tutor/usul-pelajaran`) — ajukan usulan kursus baru (judul, outline,
  target); admin yang review & publish. (Tutor propose, bukan langsung terbit.)
- **Pesan** (`/pesan`).

## Insight
- **Analitik** (`/tutor/analitik`) — analitik pengajaran (progres siswa, penyelesaian).
- **Papan Skor** (`/papan-skor`) · **Cerita Interaktif** (`/cerita`).

## Personal
- **AskSenopati App** · **Profil Saya** (`/profil`).

---

# ROLE: ADMIN (Admin Panel)

## Inti & Monitoring
- **Dashboard** (`/dashboard`) — ringkasan platform.
- **Overview Nasional** (`/admin/overview`) — statistik nasional (siswa/wilayah/aktivitas).
- **Analitik Tugas** (`/admin/analitik-tugas`) — analitik pengerjaan tugas se-platform.

## Pengguna
- **Pengguna** (`/admin/pengguna`) — kelola user (buat tutor/admin, set role & mentor track,
  reset password, edit).
- **Undang Tutor** (`/admin/pengguna/undang-tutor`) — kirim invite tutor (pre-assign mentor track).
- **Penilaian Tutor** (`/admin/penilaian-tutor`) — nilai/evaluasi kinerja tutor.
- **Penilaian Siswa** (`/admin/siswa`) — data + penilaian siswa; export CSV/XLSX (filter wilayah/tutor).

## Konten
- **Modul** (`/admin/modul`) — CRUD modul + sesi (buat/edit/publish; static module + DB course).
- **Bahan Ajar** (`/admin/bahan-ajar`) — kelola bahan ajar/materi global.
- **Kuis & Ujian** (`/admin/kuis`) — kelola bank soal/kuis/ujian per modul.
- **Usul Pelajaran** (`/admin/usul-pelajaran`) — review + approve/reject/publish usulan tutor.
- **Cerita Interaktif** (`/admin/cerita-interaktif`) — kelola konten Cerita Jeda (beat, pilihan, efek).
- **Konten** (`/admin/konten`) — manajemen konten umum (mis. artikel/blog).
- **Perpustakaan** (`/perpustakaan`).

## Lab AI
- **AskSenopati AI**, **Analisis Gambar AI**, **Generator Video AI** (`/admin/generator-video-ai`).

## Operasi
- **Live Events** (`/admin/live-events`) — kelola jadwal & event live session.
- **Master Data** (`/admin/master-data`) — data master (wilayah BPS, cabang/branch).
- **Scrape Manager** (`/admin/scrape-manager`) — kelola scraping data (beasiswa/lowongan) + cron.
- **Moderasi** (`/admin/moderasi`) — moderasi konten/diskusi/pesan.
- **Keamanan (SOC)** (`/admin/security`) — dashboard security event (login gagal, akses ditolak,
  perubahan privilege, top IP) — bagian SOC platform.
- **Audit Log** (`/admin/audit`) — jejak aksi admin (role change, reset password, hapus konten).

## Akun & Komunikasi
- **Pesan** (`/pesan`) · **AskSenopati App** · **Pengaturan** (`/admin/pengaturan`) · **Profil Saya**.

---

# Publik / pra-login (semua)

- **Landing/marketing** (`/`, `/home`, `/tentang`, `/blog`) — mobile UA di-redirect ke `/welcome`.
- **Auth**: `/login`, `/daftar` (register), reset password, OTP verifikasi email.
- **Onboarding**: `/onboarding/biodata` (wajib untuk student baru), selamat-datang.
- **Verifikasi sertifikat**: `/api/certificate/verify/[code]` (publik).
- **Undang tutor**: `/tutor/invite/*` (calon tutor set password sebelum punya akun).

---

# Relevansi untuk mobile app

App mobile (Expo) LEARNER-FACING. Yang paling relevan untuk mobile = **fitur STUDENT**:
Belajar Inti, Lab AI, Karir (IELTS/TOEFL), Cerita Interaktif, Live Session, Pesan, Profil.
Fitur admin (CRUD konten, operasi, SOC) = web-only, TIDAK perlu di mobile. Tutor mungkin
pakai subset (materi, live host, review) — cek kebutuhan produk. Screen mobile yang sudah
ada: home, modul, profil, live-session, lab-gambar, auth. Sisanya (Lab AI lain, Cerita Jeda,
Karir, Papan Skor, dll) = roadmap — kontrak API-nya sudah tersedia di `BACKEND_API_CONTRACTS.md`.
