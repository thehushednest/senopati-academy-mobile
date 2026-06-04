import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Markdown } from "@/lib/markdown";
import { moduleWebUrl, type ModulDetail } from "@/lib/api";
import { useModul } from "@/lib/hooks";
import { colors, font, kickerStyle, radius, spacing, weight } from "@/lib/theme";

export default function ModulDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data: course, isLoading, error } = useModul(slug);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Modul tidak ditemukan</Text>
        <Text style={styles.errorDesc}>
          {error instanceof Error ? error.message : "Tidak bisa memuat modul."}
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const lesson = course.lessons[activeLessonIdx];
  const objectives = Array.isArray(course.objectivesJson)
    ? (course.objectivesJson as string[])
    : [];

  return (
    <>
      <Stack.Screen options={{ title: course.title.split(" — ")[0] || "Modul" }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{course.category.toUpperCase()}</Text>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.desc}>{course.description}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{course.level}</Text>
            </View>
            {course.durationMinutes ? (
              <Text style={styles.metaText}>⏱ {course.durationMinutes} menit</Text>
            ) : null}
            <Text style={styles.metaText}>{course.lessons.length} sesi</Text>
          </View>
          {course.tutor?.name ? (
            <Text style={styles.mentor}>Mentor: {course.tutor.name}</Text>
          ) : null}
        </View>

        {/* Tujuan belajar */}
        {objectives.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tujuan Belajar</Text>
            {objectives.map((obj, idx) => (
              <View key={idx} style={styles.objRow}>
                <Text style={styles.objCheck}>✓</Text>
                <Text style={styles.objText}>{obj}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Lesson list (sidebar-like horizontal pill) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sesi</Text>
          {course.lessons.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Tim editorial sedang menyiapkan konten sesi untuk modul ini.
              </Text>
              <TouchableOpacity
                style={[styles.button, { marginTop: spacing.md }]}
                onPress={() => Linking.openURL(moduleWebUrl(course.slug))}
              >
                <Text style={styles.buttonText}>Buka di web</Text>
              </TouchableOpacity>
            </View>
          ) : (
            course.lessons.map((l, idx) => (
              <TouchableOpacity
                key={l.id}
                style={[styles.lessonRow, idx === activeLessonIdx && styles.lessonRowActive]}
                onPress={() => setActiveLessonIdx(idx)}
                activeOpacity={0.7}
              >
                <View style={styles.lessonNumber}>
                  <Text style={styles.lessonNumberText}>{String(idx + 1).padStart(2, "0")}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lessonTitle} numberOfLines={2}>
                    {l.title}
                  </Text>
                  {l.durationMinutes ? (
                    <Text style={styles.lessonMeta}>{l.durationMinutes} menit</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Lesson detail */}
        {lesson ? (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>Sesi {activeLessonIdx + 1}</Text>
            <Text style={styles.lessonDetailTitle}>{lesson.title}</Text>

            {lesson.videoUrl ? (
              <TouchableOpacity
                style={styles.videoButton}
                onPress={() => Linking.openURL(lesson.videoUrl!)}
              >
                <Text style={styles.videoButtonText}>▶ Buka video sesi</Text>
              </TouchableOpacity>
            ) : null}

            {lesson.notes ? (
              <View style={{ marginTop: spacing.md }}>
                <Markdown source={lesson.notes} />
              </View>
            ) : (
              <Text style={styles.empty}>Catatan sesi belum tersedia.</Text>
            )}

            <View style={styles.lessonNav}>
              <TouchableOpacity
                style={[styles.navButton, activeLessonIdx === 0 && styles.navButtonDisabled]}
                disabled={activeLessonIdx === 0}
                onPress={() => setActiveLessonIdx(activeLessonIdx - 1)}
              >
                <Text style={styles.navButtonText}>← Sebelumnya</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  styles.navButtonPrimary,
                  activeLessonIdx === course.lessons.length - 1 && styles.navButtonDisabled,
                ]}
                disabled={activeLessonIdx === course.lessons.length - 1}
                onPress={() => setActiveLessonIdx(activeLessonIdx + 1)}
              >
                <Text style={styles.navButtonPrimaryText}>Selanjutnya →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Web fallback link */}
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => Linking.openURL(moduleWebUrl(course.slug))}
        >
          <Text style={styles.buttonSecondaryText}>Buka modul lengkap di web</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  center: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: spacing.xl, backgroundColor: colors.bg,
  },
  errorTitle: {
    fontSize: font.h2, fontWeight: weight.semibold,
    color: colors.ink, marginBottom: spacing.xs,
  },
  errorDesc: {
    fontSize: font.small, color: colors.muted,
    textAlign: "center", marginBottom: spacing.lg,
  },

  // ── Hero: editorial kicker + serif title + flat meta ──────
  hero: {
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    ...kickerStyle,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: font.hero,
    fontWeight: weight.semibold,
    color: colors.ink,
    letterSpacing: -0.7,
    lineHeight: font.hero * 1.1,
  },
  desc: {
    fontSize: font.body,
    color: colors.body,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  metaRow: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 8, alignItems: "center", marginTop: spacing.lg,
  },
  metaPill: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  metaPillText: {
    fontSize: font.tiny,
    color: colors.muted,
    fontWeight: weight.medium,
  },
  metaText: {
    fontSize: font.tiny,
    color: colors.muted,
    fontWeight: weight.medium,
  },
  mentor: {
    fontSize: font.small,
    color: colors.muted,
    marginTop: spacing.md,
  },

  // ── Card (flat, no background, hairline top divider) ──────
  card: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginBottom: 0,
  },
  cardEyebrow: { ...kickerStyle, marginBottom: spacing.sm },
  cardTitle: {
    fontSize: font.h2,
    fontWeight: weight.semibold,
    color: colors.ink,
    letterSpacing: -0.3,
    marginBottom: spacing.lg,
  },

  // ── Objectives (bullet rows) ──────────────────────────────
  objRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "flex-start",
  },
  objCheck: {
    color: colors.brand,
    fontWeight: weight.semibold,
    fontSize: font.body,
    lineHeight: 22,
  },
  objText: {
    flex: 1,
    color: colors.inkSoft,
    fontSize: font.body,
    lineHeight: 22,
  },

  // ── Lesson row (numbered list, no pill bg) ────────────────
  lessonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  lessonRowActive: {
    backgroundColor: "transparent",
  },
  lessonNumber: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonNumberText: {
    color: colors.mutedSoft,
    fontWeight: weight.semibold,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
  },
  lessonTitle: {
    color: colors.ink,
    fontSize: font.body,
    fontWeight: weight.medium,
    lineHeight: 21,
  },
  lessonMeta: {
    color: colors.muted,
    fontSize: font.tiny,
    marginTop: 2,
  },

  // ── Lesson detail ─────────────────────────────────────────
  lessonDetailTitle: {
    fontSize: font.h1,
    fontWeight: weight.semibold,
    color: colors.ink,
    marginBottom: spacing.lg,
    letterSpacing: -0.4,
    lineHeight: font.h1 * 1.15,
  },

  // ── Video button — primary CTA pill ───────────────────────
  videoButton: {
    backgroundColor: colors.ink,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  videoButtonText: {
    color: colors.bg,
    fontWeight: weight.semibold,
    fontSize: font.small,
    letterSpacing: 0.2,
  },

  empty: {
    color: colors.muted,
    fontSize: font.small,
    padding: spacing.md,
    textAlign: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: font.small,
    textAlign: "center",
    lineHeight: 20,
  },

  lessonNav: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  navButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: "center",
  },
  navButtonPrimary: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  navButtonDisabled: { opacity: 0.3 },
  navButtonText: {
    color: colors.ink,
    fontWeight: weight.medium,
    fontSize: font.small,
  },
  navButtonPrimaryText: {
    color: colors.bg,
    fontWeight: weight.semibold,
    fontSize: font.small,
  },

  button: {
    backgroundColor: colors.ink,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.bg,
    fontWeight: weight.semibold,
    fontSize: font.body,
    letterSpacing: 0.2,
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  buttonSecondaryText: {
    color: colors.ink,
    fontWeight: weight.medium,
    fontSize: font.body,
  },
});
