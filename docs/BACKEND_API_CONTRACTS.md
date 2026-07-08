# Senopati Backend — Kontrak API (SEMUA fitur)

Referensi kontrak untuk mobile app. **127 endpoint** (di luar admin & cron),
diekstrak dari route handler backend (`src/app/api/<path>/route.ts`, input Zod).
Pelengkap `senopati-backend-connect-guide.md` (cara connect + akun test).

## Cara pakai dokumen ini
- `[METHODS] /path — auth`. `Bearer` = wajib header `Authorization: Bearer <token>`.
  `PUBLIC` = tanpa auth. `Bearer/tutor` = khusus role tutor.
- **req** = field body/query (nama:tipe, dari Zod schema). Field bertanda `?` di
  backend = opsional; cek route untuk detail (min/max, enum values).
- **res** = key utama objek response JSON (path sukses; key `error` untuk gagal diabaikan di sini).
- Ini RINGKASAN kontrak. Untuk bentuk PERSIS (nested, tipe lengkap): **probe live**
  dengan akun test (lihat connect-guide) atau baca route handler + Zod schema di repo backend.

## Auth singkat
1. `POST /api/auth/mobile/login {email,password}` → `{token, expiresAt, user}` (JWT 30 hari).
2. Kirim `Authorization: Bearer <token>` di setiap request non-public.
3. Base URL: `https://senopatiacademy.id` (publik, tanpa VPN).

## Konvensi
- Orientasi PORTRAIT lock (kecuali Live Session, Learn as You Go, Cerita Jeda).
- Bahasa Indonesia; modul ready: 01/02/03/04/11/22 + Cerita Jeda.
- File/media selalu via `GET /api/storage/[...key]` (jangan hardcode URL storage).
- Mutasi (POST/PUT/PATCH/DELETE) WAJIB bawa Bearer (juga supaya lolos CSRF middleware).

---

## Auth & akun

### `[POST,DELETE]` /api/account/avatar — _Bearer_
- **res**: `{ ok, avatarUrl, sizeBytes }`

### `[POST]` /api/account/change-password — _Bearer_
- **res**: `{ ok }`

### `[GET,PUT]` /api/account/profile — _Bearer_
- **req**: `name:string, school:string, grade:string, avatarUrl:string`
- **res**: `{ account }`

### `[-]` /api/auth/[...nextauth] — _PUBLIC_

### `[POST]` /api/auth/mobile/login — _PUBLIC_
- **req**: `email:string, password:string`

### `[GET]` /api/auth/mobile/me — _PUBLIC_

### `[POST]` /api/auth/otp/request — _PUBLIC_
- **req**: `email:string, purpose:enum`
- **res**: `{ ok, expiresAt }`
- **res**: `{ error, retryAfterSeconds }`

### `[POST]` /api/auth/otp/verify — _PUBLIC_
- **req**: `email:string, code:string, purpose:enum`
- **res**: `{ ok }`

### `[POST]` /api/auth/password-reset/confirm — _PUBLIC_
- **req**: `email:string, code:string, newPassword:string`
- **res**: `{ ok }`

### `[POST]` /api/auth/register — _PUBLIC_
- **req**: `name:string, email:string, password:string, school:string, grade:string`

### `[POST]` /api/auth/signup — _PUBLIC_
- **req**: `email:string, code:string, password:string, name:string`
- **res**: `{ ok }`

### `[GET,PUT]` /api/onboarding/biodata — _Bearer_
- **req**: `fullName:string, gender:enum`

### `[GET,PUT]` /api/onboarding/profile — _Bearer_
- **req**: `nickname:string, learnerRole:enum, timeBudget:enum, aiExperience:enum, interests:array`
- **res**: `{ preference }`


## Wilayah (BPS, untuk biodata)

### `[GET]` /api/wilayah/districts — _PUBLIC_
- **req**: `regencyId:string`

### `[GET]` /api/wilayah/provinces — _PUBLIC_

### `[GET]` /api/wilayah/regencies — _PUBLIC_
- **req**: `provinceId:string`

### `[GET]` /api/wilayah/search — _PUBLIC_
- **req**: `q:string, level:enum, limit:coerce`
- **res**: `{ results }`

### `[GET]` /api/wilayah/villages — _PUBLIC_
- **req**: `districtId:string`


## Belajar: modul, progress, kuis

### `[POST,GET]` /api/lessons/[lessonId]/video-progress — _Bearer_
- **req**: `positionSec:number, watchedSec:number, activeSegment:number, segmentComplete:boolean, manualComplete:boolean, totalDurationSec:number`

### `[GET,POST]` /api/materials — _Bearer_
- **req**: `moduleSlug:string, sessionIndex:number, objectKey:string, pdfFilename:string, title:string, sourceFormat:enum, changeNote:string, kind:enum`

### `[PATCH,DELETE]` /api/materials/[id] — _Bearer_
- **req**: `slideIndex:number, note:string`
- **req**: `title:string, totalPages:number, slideNotes:array`
- **res**: `{ material }`
- **res**: `{ ok }`

### `[GET,POST]` /api/materials/[id]/progress — _Bearer_
- **req**: `lastSlideIndex:number, totalPages:number`
- **res**: `{ progress }`

### `[POST]` /api/materials/[id]/rollback — _Bearer_
- **req**: `versionId:string`
- **res**: `{ material }`

### `[POST]` /api/materials/presigned-upload — _Bearer_
- **req**: `moduleSlug:string, sessionIndex:number, filename:string, contentType:string, sizeBytes:number`
- **res**: `{ uploadUrl, publicUrl, expiresAt }`

### `[GET]` /api/mobile/modul — _PUBLIC_

### `[GET]` /api/mobile/modul/[slug] — _PUBLIC_
- **res**: `{ course:{ id,title,slug,description,category,level,coverImageUrl,durationMinutes,format,objectivesJson,highlightsJson,previewBody,tutor, lessons:[ ... ] } }`
- **BARU**: tiap `lessons[]` kini punya `material` = `{ kind:"slide"|"student_handout", title, pdfUrl, pdfFilename, totalPages } | null` (slide PDF sesi; `tutor_guide` tidak dikirim). Materi di-map ke lesson via `orderIndex`.

### `[GET,PUT]` /api/notes — _Bearer_
- **req**: `moduleSlug:string, sessionIndex:number, body:string, isPublic:boolean`

### `[GET]` /api/notes/all — _Bearer_

### `[GET]` /api/programs/[slug] — _Bearer_
- **res**: `{ program, enrollment, progress }`

### `[GET]` /api/programs/[slug]/activities — _Bearer_

### `[POST]` /api/programs/[slug]/enroll — _Bearer_
- **req**: `source:enum`

### `[GET,POST]` /api/progress — _Bearer_
- **req**: `moduleSlug:string, sessionIndex:number, totalSessions:number`
- **res**: `{ progresses }`

### `[GET]` /api/quiz/questions — _Bearer_  ← BACA SOAL (render kuis)
- **query**: `moduleSlug:string, quizType:"session"|"final_exam", sessionIndex:number` (sessionIndex wajib bila quizType=session)
- **res**: `{ quiz, questions }`
  - `quiz`: `{ id, title, quizType, moduleSlug, sessionIndex, passingGrade, timeLimitSec, maxAttempts, randomizeOrder, showAnswers, total }` (atau `null` bila kuis belum ada)
  - `questions[]`: `{ id, type, question, options:string[], points, orderIndex }` + `correct:number, explanation:string` **hanya bila** `quiz.showAnswers` (exam yang menyembunyikan kunci tidak mengirim `correct`)
  - Alur: `GET /api/quiz/questions` (render) → user jawab → `POST /api/quiz/submit` (skor dihitung server dari kunci DB). Pola sama dgn Cerita Jeda: submit/attempts hanya state, ini yang baca kontennya.

### `[GET]` /api/quiz/attempts — _Bearer_

### `[POST]` /api/quiz/submit — _Bearer_
- **req**: `moduleSlug:string, sessionIndex:number, quizType:enum, answers:{[questionId]:optionIndex}, score:number, maxScore:number, passed:boolean, submissionKey:string`
- **res**: `{ submission, deduped }`
- **catatan**: `score/passed` di body diabaikan; server re-grade dari kunci DB (`gradeModuleQuiz`). `answers` = map `questionId → index opsi terpilih`.

### `[GET,POST]` /api/review — _Bearer_
- **req**: `moduleSlug:string, rating:number, experience:string, tags:array, body:string, anonymous:boolean`
- **res**: `{ reviews }`


## Cerita Jeda (interactive story)

> **PENTING — pisahkan STATE vs KONTEN.** Endpoint start/advance/choice/finalize
> hanya mengelola **state** (posisi `currentBeatCode`, saldo, flags, dll), TIDAK
> mengembalikan teks cerita. Untuk **konten** (narasi, dialog, pilihan, aset) baca
> `GET /api/cerita/[slug]/beat/[code]`.
>
> **Alur render:**
> 1. `POST /start` → dapat `{playthrough}` (punya `state.currentBeatCode`, biasanya "1.0").
> 2. `GET /beat/[currentBeatCode]` → render beat itu.
> 3. Beat tanpa choices → maju via `POST /advance {nextCode: beat.defaultNextCode}`.
>    Beat dengan choices → user pilih → `POST /choice {choiceId}`.
>    Keduanya mengembalikan **state** baru (server resolve beat berikut + apply efek).
> 4. Ambil `currentBeatCode` baru dari state → `GET /beat/[code]` lagi. Ulangi.
> 5. Selesai → `POST /finalize` (kunci skor psikometri, dsb).

### `[GET]` /api/cerita — _Bearer_  ⟵ LIST cerita (baru)
- **res**: `{ stories:[{ slug,title,subtitle,description,authorCredit,coverUrl,startBeatCode,createdAt, progress:{ playthroughId,status:"in_progress"|"completed",currentBeatCode,completedAt,startedAt }|null }] }`

### `[GET]` /api/cerita/[slug] — _Bearer_  ⟵ INTRO/detail cerita (baru)
- **res**: `{ story:{ slug,title,subtitle,description,authorCredit,coverUrl,startBeatCode,isPublished,createdAt }, progress:{ ...,resumeBeatCode }|null }` · 404 kalau tak ada/unpublished

### `[GET]` /api/cerita/[slug]/beat/[code] — _Bearer_  ⟵ KONTEN beat (baru)
- **res**: `{ beat: {`
  - `code, beatType, dayNumber, timeOfDay, location,`
  - `narration, dialogues:[{speaker,text,emotion?}], enterTransition, authorNote,`
  - `backgroundUrl, characterUrls:[], uiOverlayUrl, audioUrl,`  ← URL siap pakai (relative ke base)
  - `interactive` (null utk dialogue; utk beat khusus: `{kind:"investigation"|"compose_message"|...}`),
  - `choices:[{id,label,body}],`
  - `defaultNextCode` (beat berikut kalau tak ada choices)
  - `} }`

### `[POST]` /api/cerita/[slug]/start — _Bearer_
- **res**: `{ playthrough }` (state; `state.currentBeatCode` = beat awal)

### `[POST]` /api/cerita/[slug]/advance — _Bearer_
- **req**: `playthroughId:string, nextCode:string` (biasanya = `beat.defaultNextCode`)
- **res**: state baru (`currentBeatCode` sudah pindah)

### `[POST]` /api/cerita/[slug]/choice — _Bearer_
- **req**: `playthroughId:string, choiceId:string`
- **res**: state baru (server resolve cabang + apply efek/trait Big5)

### `[POST]` /api/cerita/[slug]/finalize — _Bearer_
- **req**: `playthroughId:string`
- **res**: `{ message }`


## Lab AI

### `[GET,POST]` /api/asksenopati — _Bearer_

### `[GET,POST,DELETE,PATCH]` /api/asksenopati/[id] — _Bearer_
- **req**: `content:string`
- **req**: `title:string`
- **res**: `{ conversation }`

### `[POST]` /api/lab/audit-karier — _Bearer_

### `[GET,POST]` /api/lab/avatar-video — _Bearer_
- **req**: `script:string, avatarId:string, voiceId:string`

### `[GET]` /api/lab/avatar-video/[id] — _Bearer_
- **res**: `{ job }`

### `[GET]` /api/lab/avatar-video/library — _Bearer_

### `[POST]` /api/lab/hoax-check — _Bearer_

### `[GET]` /api/lab/hoax-check/history — _Bearer_

### `[POST]` /api/lab/image-forensik — _Bearer_

### `[POST]` /api/lab/privacy-check — _Bearer_

### `[POST]` /api/lab/prompt-coach — _Bearer_

### `[POST]` /api/lab/video-jobs — _Bearer_
- **req**: `mode:enum, prompt:string, refImageUrl:string`
- **res**: `{ message }`

### `[POST]` /api/lab/zona-ai — _Bearer_

### `[POST]` /api/writing/grade — _Bearer_

### `[GET]` /api/writing/grades — _Bearer_
- **res**: `{ items }`

### `[GET]` /api/writing/grades/[id] — _Bearer_


## Live Session (realtime)

### `[GET,POST]` /api/live-events — _Bearer_
- **req**: `minute:number, block:string, activity:string, engagement:string`
- **req**: `title:string, description:string, moduleSlug:string, format:enum, agenda:array, scheduledAt:string, durationMinutes:number, meetingUrl:string, maxParticipants:number`

### `[GET,PATCH,DELETE]` /api/live-events/[id] — _Bearer_
- **req**: `title:string, description:string, scheduledAt:string, durationMinutes:number, meetingUrl:string, recordingUrl:string, status:enum, maxParticipants:number`
- **res**: `{ event }`
- **res**: `{ ok }`

### `[POST,GET]` /api/live-events/[id]/activity — _Bearer_
- **req**: `studentId:string, activityType:enum, note:string`

### `[POST]` /api/live-events/[id]/certificate/generate — _Bearer_
- **req**: `userId:string, force:boolean`
- **res**: `{ ok, generated, skipped }`

### `[POST]` /api/live-events/[id]/chat — _Bearer_
- **req**: `text:string`
- **res**: `{ ok }`

### `[POST]` /api/live-events/[id]/end — _Bearer_
- **res**: `{ alreadyEnded, endedAt, progressAppliedAt, attendedCount }`

### `[POST]` /api/live-events/[id]/heartbeat — _Bearer_
- **res**: `{ ok, durationMs, joinedAt, lastSeenAt }`

### `[GET]` /api/live-events/[id]/insight — _Bearer_

### `[GET]` /api/live-events/[id]/participants — _Bearer_

### `[POST]` /api/live-events/[id]/present — _Bearer_
- **req**: `action:literal`
- **req**: `action:literal`
- **res**: `{ ok }`

### `[GET,POST]` /api/live-events/[id]/qna — _Bearer_
- **req**: `body:string`
- **res**: `{ id }`

### `[PATCH,DELETE]` /api/live-events/[id]/qna/[qid] — _Bearer_
- **req**: `answered:boolean`
- **res**: `{ ok }`

### `[POST]` /api/live-events/[id]/qna/[qid]/vote — _Bearer_
- **res**: `{ upvotes, votedByMe }`

### `[POST]` /api/live-events/[id]/quiz-push — _Bearer_
- **req**: `prompt:string, options:array, correctIdx:number, points:number`
- **req**: `mode:enum, quizId:string, title:string, questions:array`
- **res**: `{ mode }`

### `[POST]` /api/live-events/[id]/quiz-push/[pushId] — _Bearer_
- **req**: `action:enum`
- **res**: `{ ok, closed }`
- **res**: `{ resultsVisible }`

### `[POST]` /api/live-events/[id]/quiz-push/[pushId]/answer — _Bearer_
- **req**: `text:string`

### `[GET]` /api/live-events/[id]/quiz-push/[pushId]/leaderboard — _Bearer_

### `[GET]` /api/live-events/[id]/quiz-push/[pushId]/my-result — _Bearer_

### `[GET]` /api/live-events/[id]/quiz-push/[pushId]/stats — _Bearer_
- **res**: `{ mode, totalSubmissions }`
- **res**: `{ openSubmissions }`
- **res**: `{ questions }`

### `[GET]` /api/live-events/[id]/quiz-push/active — _Bearer_
- **res**: `{ active }`

### `[POST]` /api/live-events/[id]/recording/presigned-upload — _Bearer_
- **req**: `filename:string, contentType:string, sizeBytes:number`
- **res**: `{ publicUrl }`

### `[POST,DELETE]` /api/live-events/[id]/rsvp — _Bearer_
- **res**: `{ ok }`

### `[GET]` /api/live-events/[id]/stream — _Bearer_

### `[GET,POST]` /api/live-events/[id]/survey — _Bearer_
- **req**: `npsScore:number, feedback:string`
- **res**: `{ submitted, survey }`

### `[POST,GET]` /api/student/join-class — _Bearer_
- **req**: `code:string`
- **res**: `{ homeroomTutor }`
- **res**: `{ assignedAt }`

### `[POST]` /api/student/join-session — _Bearer_
- **req**: `code:string`
- **res**: `{ eventId, tutorName }`


## Diskusi, tugas, sertifikat

### `[GET]` /api/assignment — _Bearer_

### `[POST]` /api/assignment/presigned-upload — _Bearer_
- **req**: `moduleSlug:string, sessionIndex:number, filename:string, contentType:string, sizeBytes:number`
- **res**: `{ uploadUrl, publicUrl, expiresAt }`

### `[POST]` /api/assignment/submit — _Bearer_
- **req**: `moduleSlug:string, sessionIndex:number, text:string, attachmentUrl:string`

### `[POST]` /api/certificate/issue — _Bearer_
- **req**: `moduleSlug:string`
- **res**: `{ certificate }`

### `[GET]` /api/certificate — _Bearer_  ⟵ LIST sertifikat milik user (baru)
- **res**: `{ moduleCertificates:[{ certCode,moduleSlug,moduleTitle,score,issuedAt,revoked,verifyUrl }], programCertificates:[{ certCode,programSlug,programTitle,averageScore,issuedAt,revoked,pdfUrl,verifyUrl }] }`

### `[GET]` /api/certificate/verify/[code] — _PUBLIC_

### `[GET,POST]` /api/discussion — _Bearer_
- **req**: `moduleSlug:string, sessionIndex:number, title:string, body:string`

### `[GET]` /api/discussion/[id] — _PUBLIC_

### `[POST]` /api/discussion/[id]/like — _Bearer_
- **res**: `{ liked }`

### `[POST]` /api/discussion/[id]/reply — _Bearer_
- **req**: `body:string`


## Skor & Papan Peringkat (baru)

### `[GET]` /api/papan-skor — _Bearer_  ⟵ leaderboard
- **query**: `scope=national|province|branch` (default national; branch/province fallback ke national kalau user tak punya cabang), `period=YYYY-MM` (default periode terbaru berdata), `limit=1..100` (default 100)
- **res**: `{ scope,scopeLabel,period,periodLabel,isCurrentPeriod, availablePeriods:[{value,label,isCurrent}], entries:[{rank,studentId,studentName,avatarInitial,avatarUrl,score,tier,tierLabel,isMe}], me:{rank,score,tier,tierLabel,inTopList}|null, total }`

### `[GET]` /api/skor-belajarku — _Bearer_  ⟵ scorecard + tier milik user
- **query**: `trend=1..12` (default 6)
- **res** (ada data): `{ hasData:true, period,periodLabel,computedAt, totalScore, tier,tierLabel, components:{ learningAchievement,outcome,engagement,liveParticipation,community }(masing2 {value,max,label}), ranks:{branch,province,national,branchQuartile}, metrics:{quizCount,avgQuiz,completedModules,behavioralEvents,rsvps,tutorTags,discussionPosts,dmMessages}, trend:[{period,periodLabel,totalScore,tier}] }` · **(belum ada)**: `{ hasData:false, message }`
- tier: `unggulan|aktif|berkembang|memulai|insufficient` (label: Unggulan/Aktif/Berkembang/Sedang Memulai/Belum Cukup Data)

## Karir & keuangan (student)

### `[GET]` /api/mobile/karir/jurusan — _Bearer_  (baru)
- **query**: `category` (Saintek|Soshum|Campuran), `q`, `page`, `pageSize` (≤50)
- **res**: `{ items:[{slug,name,category,summary}], total, page, pageSize, filters:{categories} }`
- **detail** `[GET] /api/mobile/karir/jurusan/[slug]`: `{ slug,name,category,summary,matchPct(null),riasec:{R,I,A,S,E,C},careerOutlook:[],topSchools:[],scholarships:[{slug,name,provider,level,country,coverage,deadlineAt}] }`

### `[GET]` /api/mobile/karir/beasiswa — _Bearer_  (baru)
- **query**: `level` (s1|s2|s3, exact), `country` (contains), `q`, `page`, `pageSize`
- **res**: `{ items:[{slug,name,provider,summary,coverage,level,country,deadlineAt}], total, page, pageSize, filters:{levels,countries} }`
- **detail** `[GET] /api/mobile/karir/beasiswa/[slug]`: `{ ...,applicationUrl,requirements:[],eligibleMajors:[{slug,name,category}],openToAllMajors, guide:{timeline,essayTips,documents,interviewTips,faqs}|null }`

### `[GET]` /api/mobile/karir/kerja — _Bearer_  (baru)
- **query**: `category` (domestik|luar_negeri, exact), `country` (contains), `q`, `page`, `pageSize`
- **res**: `{ items:[{slug,name,category,country,programName,summary,sectors:[],salaryMinIdr,salaryMaxIdr,durationMonths}], total, page, pageSize, filters:{categories} }`
- **detail** `[GET] /api/mobile/karir/kerja/[slug]`: `{ ...,requirements:[],officialUrl,targetAudience,isOverseas, guide:{timeline,documents,costs,examPrep,safetyTips,rights,faqs,verifiedChannels}|null }`

### `[POST]` /api/keuangan/ocr-struk — _Bearer_
- **res**: `{ error, resetInSeconds }`

### `[GET,POST]` /api/student/career/applications — _Bearer_
- **req**: `title:string, company:string, source:enum, jobUrl:string, pathwaySlug:string, status:enum, location:string, salaryNote:string, appliedAt:string, followUpAt:string, interviewAt:string, notes:string`

### `[GET,PATCH,DELETE]` /api/student/career/applications/[id] — _Bearer_
- **req**: `title:string, company:string, source:enum, jobUrl:string, pathwaySlug:string, status:enum, location:string, salaryNote:string, appliedAt:string, followUpAt:string, interviewAt:string, notes:string`
- **res**: `{ application }`

### `[GET,PUT]` /api/student/career/cv — _Bearer_
- **req**: `position:string, company:string, startDate:string, endDate:string, current:boolean, bullets:array`
- **req**: `school:string, major:string, startYear:number, endYear:number, current:boolean, gpa:string`
- **res**: `{ cv }`

### `[POST]` /api/student/career/submit — _Bearer_
- **req**: `scoreR:number, scoreI:number, scoreA:number, scoreS:number, scoreE:number, scoreC:number, hollandCode:string`

### `[GET,POST]` /api/student/keuangan — _Bearer_
- **req**: `counterpartyName:string, counterpartyContact:string, direction:enum, amount:number, note:string, status:enum`
- **res**: `{ message }`

### `[PATCH,DELETE]` /api/student/keuangan/[id] — _Bearer_
- **req**: `counterpartyName:string, counterpartyContact:string, amount:number, note:string, status:enum`
- **res**: `{ message }`

### `[GET,POST]` /api/student/shared-expense — _Bearer_
- **req**: `name:string, contact:string, share:number`
- **req**: `mode:enum, title:string, description:string, totalAmount:number, deadline:string, bankAccountInfo:string, participants:array`

### `[PATCH,DELETE]` /api/student/shared-expense/[id] — _Bearer_
- **req**: `title:string, description:string, bankAccountInfo:string, status:enum`
- **res**: `{ ok }`

### `[PATCH]` /api/student/shared-expense/[id]/participants/[pid] — _Bearer_
- **req**: `status:enum, paidNote:string`
- **res**: `{ participant }`


## Notifikasi & push

### `[GET]` /api/notifications — _Bearer_

### `[POST]` /api/notifications/[id]/read — _Bearer_
- **res**: `{ notification }`

### `[POST]` /api/notifications/read-all — _Bearer_
- **res**: `{ ok }`

### `[POST,DELETE]` /api/notifications/register — _PUBLIC_
- **req**: `platform:enum`
- **res**: `{ ok, id }`

### `[POST,DELETE]` /api/notifications/subscribe — _Bearer_
- **req**: `endpoint:string, p256dh:string, auth:string, userAgent:string`
- **res**: `{ ok, id }`

### `[GET]` /api/notifications/vapid-public-key — _PUBLIC_
- **res**: `{ publicKey }`


## Pesan, storage, misc

### `[POST]` /api/error-log — _PUBLIC_
- **res**: `{ ok, reason }`

### `[POST]` /api/events/behavioral — _Bearer_
- **req**: `eventType:enum, payload:record, moduleSlug:string, sessionId:string`
- **req**: `events:array`
- **res**: `{ ok, skipped }`

### `[GET]` /api/health — _PUBLIC_
- **res**: `{ ok, version, ts }`

### `[POST]` /api/homeroom-reset/[id]/decide — _Bearer_
- **res**: `{ ok, status }`

### `[POST]` /api/newsletter/subscribe — _PUBLIC_
- **req**: `email:string, source:string`
- **res**: `{ message }`

### `[GET,POST]` /api/pesan — _Bearer_
- **req**: `recipientId:string, initialMessage:string`
- **res**: `{ threads }`

### `[GET,POST]` /api/pesan/[id] — _Bearer_
- **req**: `body:string`

### `[POST]` /api/pesan/contact-support — _Bearer_

### `[GET]` /api/storage/[...key] — _Bearer_

### `[GET,POST]` /api/student/homeroom-reset — _Bearer_
- **res**: `{ ok, requestId, status }`

### `[GET]` /api/users/search — _Bearer_
- **res**: `{ users }`

### `[POST]` /api/usul-pelajaran — _Bearer_
- **req**: `title:string, summary:string`
- **req**: `title:string, category:string, targetLevel:string, durationEst:string, description:string, motivation:string, outline:array`


## Tutor (kalau app dipakai tutor)

### `[GET,POST]` /api/tutor-invites/[token] — _PUBLIC_
- **req**: `password:string`

### `[GET,POST]` /api/tutor/invite-code — _Bearer_
- **res**: `{ inviteCode }`

### `[GET]` /api/tutor/reset-pending-count — _Bearer_
- **res**: `{ count }`

### `[GET]` /api/tutor/students — _Bearer/tutor_
- **res**: `{ students }`

### `[GET]` /api/tutor/submissions — _Bearer/tutor_
- **res**: `{ submissions, counts }`

### `[GET,PATCH]` /api/tutor/submissions/[id] — _Bearer/tutor_
- **req**: `status:enum, feedback:string, grade:number`
- **res**: `{ submission }`

### `[GET]` /api/tutor/summary — _Bearer/tutor_
- **res**: `{ recentThreads }`

### `[POST,DELETE]` /api/tutor/teaching-materials — _Bearer/tutor_
- **req**: `moduleSlug:string, title:string, description:string, objectKey:string`
- **res**: `{ ok }`

### `[POST]` /api/tutor/teaching-materials/presigned-upload — _Bearer/tutor_
- **req**: `moduleSlug:string, filename:string, contentType:string, sizeBytes:number`
- **res**: `{ ok, uploadUrl, publicUrl, expiresAt }`
