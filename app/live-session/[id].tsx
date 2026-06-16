/**
 * Live Session join screen — Phase 3A (2026-06-16).
 *
 * Pakai SSE polyfill lib/sse.ts buat real-time slide + chat sync dengan
 * presenter. PDF slide TIDAK di-render di mobile (butuh react-native-pdf
 * berat) — tampilkan info filename + slide number, plus link "Buka slide
 * di browser" supaya user bisa lihat slide via webview kalau perlu.
 *
 * Features:
 * - Header: title event + status pill (Live / Idle)
 * - Slide info card: filename + current slide + open in browser
 * - Chat: list pesan + compose input
 * - SSE reconnect handled di lib/sse.ts (exponential backoff)
 *
 * Defer ke Phase 3B:
 * - Q&A list + upvote
 * - Quiz push modal (presenter push soal in-session)
 * - Native PDF slide viewer (react-native-pdf)
 */

import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import { getLiveEvent, sendChatMessage, type LiveEventDetail } from "@/lib/api";
import { connectLiveSession, type SSEController } from "@/lib/sse";
import { colors, font, radius, spacing, weight } from "@/lib/theme";

type ChatItem = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  ts: number;
};

type SlideState = {
  presenting: boolean;
  filename: string | null;
  slide: number | null;
  pdfUrl: string | null;
};

const WEB_BASE = "https://senopatiacademy.id";
const MAX_CHAT_LENGTH = 280;

export default function LiveSessionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const sseRef = useRef<SSEController | null>(null);
  const chatRef = useRef<FlatList<ChatItem>>(null);

  const [event, setEvent] = useState<LiveEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState<SlideState>({
    presenting: false,
    filename: null,
    slide: null,
    pdfUrl: null,
  });
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sseError, setSseError] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);

  // Fetch event detail.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const data = await getLiveEvent(id);
      if (cancelled) return;
      setEvent(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Connect SSE setelah event loaded.
  useEffect(() => {
    if (!event) return;
    let cancelled = false;

    (async () => {
      const controller = await connectLiveSession(event.id, {
        onOpen: () => {
          if (cancelled) return;
          setSseError(null);
          setSseConnected(true);
        },
        onSlide: (state) => {
          if (cancelled) return;
          const s = state as {
            presenting: boolean;
            filename: string | null;
            slide: number | null;
            pdfUrl: string | null;
          };
          setSlide({
            presenting: s.presenting,
            filename: s.filename,
            slide: s.slide,
            pdfUrl: s.pdfUrl,
          });
        },
        onChat: (msg) => {
          if (cancelled) return;
          const m = msg as ChatItem;
          setChat((prev) => {
            // Dedup by id — sometimes SSE re-emit during reconnect
            if (prev.some((p) => p.id === m.id)) return prev;
            return [...prev, m];
          });
        },
        onError: (err) => {
          if (cancelled) return;
          setSseError(err.message);
          setSseConnected(false);
        },
      });
      if (cancelled) {
        controller.close();
        return;
      }
      sseRef.current = controller;
    })();

    return () => {
      cancelled = true;
      sseRef.current?.close();
      sseRef.current = null;
    };
  }, [event]);

  // Auto-scroll chat ke bottom saat ada pesan baru.
  useEffect(() => {
    if (chat.length === 0) return;
    requestAnimationFrame(() => {
      chatRef.current?.scrollToEnd({ animated: true });
    });
  }, [chat.length]);

  async function handleSend() {
    if (sending || !event) return;
    const text = draft.trim();
    if (!text) return;
    if (text.length > MAX_CHAT_LENGTH) return;

    setSending(true);
    setDraft("");
    try {
      await sendChatMessage(event.id, text);
      // SSE akan broadcast pesan ke list — tidak perlu manual append.
    } catch (err) {
      // Kalau gagal, restore draft supaya user bisa retry.
      setDraft(text);
      // TODO: toast feedback
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Live Session" }} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Stack.Screen options={{ title: "Live Session" }} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Sesi tidak ditemukan atau sudah berakhir.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const isLive = event.status === "live" || slide.presenting;
  const slideUrl = slide.pdfUrl
    ? `${WEB_BASE}/live-session/${event.id}`
    : null;

  return (
    <>
      <Stack.Screen options={{ title: event.title, headerBackTitle: "Back" }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        {/* ── Header: status + slide info ────────────────── */}
        <View style={styles.header}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isLive && styles.statusDotLive]} />
            <Text style={styles.statusText}>
              {isLive ? "LIVE" : event.status === "ended" ? "SELESAI" : "BELUM MULAI"}
            </Text>
            {sseConnected ? (
              <Text style={styles.connText}>· tersambung</Text>
            ) : sseError ? (
              <Text style={styles.connTextErr}>· koneksi putus, retry…</Text>
            ) : (
              <Text style={styles.connText}>· menyambung…</Text>
            )}
          </View>

          <Text style={styles.title}>{event.title}</Text>
          {event.host?.name ? (
            <Text style={styles.host}>oleh {event.host.name}</Text>
          ) : null}

          {slide.presenting && slide.filename ? (
            <View style={styles.slideCard}>
              <Text style={styles.slideLabel}>SLIDE AKTIF</Text>
              <Text style={styles.slideFile}>{slide.filename}</Text>
              <Text style={styles.slideMeta}>
                Slide {(slide.slide ?? 0) + 1}
              </Text>
              {slideUrl ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(slideUrl)}
                  style={styles.openBtn}
                >
                  <Text style={styles.openBtnText}>Buka slide di browser →</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Chat list ──────────────────────────────────── */}
        <FlatList
          ref={chatRef}
          data={chat}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          ListEmptyComponent={
            <Text style={styles.chatEmpty}>
              Belum ada pesan. Mulai obrolan kalau mau!
            </Text>
          }
          renderItem={({ item }) => {
            const isSelf = item.authorId === user?.id;
            return (
              <View style={[styles.msg, isSelf && styles.msgSelf]}>
                <Text style={styles.msgAuthor}>
                  {isSelf ? "Kamu" : item.authorName}
                </Text>
                <Text style={styles.msgText}>{item.text}</Text>
              </View>
            );
          }}
        />

        {/* ── Compose ────────────────────────────────────── */}
        <View style={styles.composeRow}>
          <TextInput
            style={styles.composeInput}
            value={draft}
            onChangeText={setDraft}
            placeholder={
              event.status === "ended"
                ? "Sesi sudah berakhir"
                : "Tulis pesan ke ruang ini…"
            }
            placeholderTextColor={colors.mutedSoft}
            maxLength={MAX_CHAT_LENGTH}
            editable={event.status !== "ended" && event.status !== "cancelled"}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !draft.trim() || event.status === "ended"}
            style={[
              styles.sendBtn,
              (sending || !draft.trim() || event.status === "ended") && styles.sendBtnDisabled,
            ]}
          >
            <Text style={styles.sendBtnText}>{sending ? "…" : "Kirim"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    color: colors.muted,
    fontSize: font.body,
    textAlign: "center",
  },
  ghostBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
  },
  ghostBtnText: {
    color: colors.ink,
    fontWeight: weight.semibold,
  },

  // Header
  header: {
    padding: spacing.lg,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mutedSoft,
  },
  statusDotLive: {
    backgroundColor: colors.danger,
  },
  statusText: {
    fontSize: font.small,
    fontWeight: weight.semibold,
    color: colors.ink,
    letterSpacing: 1,
  },
  connText: {
    fontSize: font.small,
    color: colors.muted,
  },
  connTextErr: {
    fontSize: font.small,
    color: colors.danger,
  },
  title: {
    fontSize: font.h3,
    fontWeight: weight.semibold,
    color: colors.ink,
  },
  host: {
    fontSize: font.small,
    color: colors.muted,
  },
  slideCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
    gap: 4,
  },
  slideLabel: {
    fontSize: font.small,
    color: colors.brandStrong,
    fontWeight: weight.semibold,
    letterSpacing: 1,
  },
  slideFile: {
    fontSize: font.body,
    color: colors.ink,
    fontWeight: weight.semibold,
  },
  slideMeta: {
    fontSize: font.small,
    color: colors.muted,
  },
  openBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
  },
  openBtnText: {
    color: colors.brand,
    fontWeight: weight.semibold,
    fontSize: font.small,
  },

  // Chat
  chatList: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    flexGrow: 1,
  },
  chatEmpty: {
    color: colors.muted,
    textAlign: "center",
    paddingVertical: spacing["2xl"],
    fontSize: font.small,
  },
  msg: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: spacing.md,
    maxWidth: "85%",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.line,
  },
  msgSelf: {
    alignSelf: "flex-end",
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  msgAuthor: {
    fontSize: font.small,
    color: colors.muted,
    marginBottom: 2,
    fontWeight: weight.semibold,
  },
  msgText: {
    fontSize: font.body,
    color: colors.ink,
  },

  // Compose
  composeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.panel,
    gap: spacing.sm,
  },
  composeInput: {
    flex: 1,
    fontSize: font.body,
    color: colors.ink,
    backgroundColor: colors.panelSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: colors.bg,
    fontWeight: weight.semibold,
  },
});
