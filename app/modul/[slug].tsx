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
import { colors, font, radius, spacing, weight } from "@/lib/theme";

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
  container: { padding: spacing.lg, paddingBottom: spacing["2xl"] },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, backgroundColor: colors.bg },
  errorTitle: { fontSize: font.h2, fontWeight: weight.bold, color: colors.ink, marginBottom: spacing.xs },
  errorDesc: { fontSize: font.small, color: colors.muted, textAlign: "center", marginBottom: spacing.lg },
  hero: { marginBottom: spacing.lg },
  eyebrow: { fontSize: 10, color: colors.brandStrong, fontWeight: weight.bold, letterSpacing: 1.5, marginBottom: spacing.xs },
  title: { fontSize: 24, fontWeight: weight.extrabold, color: colors.ink, letterSpacing: -0.5, lineHeight: 30 },
  desc: { fontSize: font.body, color: colors.inkSoft, lineHeight: 22, marginTop: spacing.sm },
  metaRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center", marginTop: spacing.md },
  metaPill: { backgroundColor: colors.brandSoft, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  metaPillText: { fontSize: 11, color: colors.brandStrong, fontWeight: weight.bold },
  metaText: { fontSize: font.small, color: colors.muted },
  mentor: { fontSize: font.small, color: colors.muted, marginTop: spacing.sm, fontStyle: "italic" },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardEyebrow: { fontSize: 10, color: colors.brandStrong, fontWeight: weight.bold, letterSpacing: 1.5, marginBottom: spacing.xs },
  cardTitle: { fontSize: font.h3, fontWeight: weight.bold, color: colors.ink, marginBottom: spacing.md },
  objRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xs },
  objCheck: { color: colors.brand, fontWeight: weight.bold, fontSize: font.body },
  objText: { flex: 1, color: colors.inkSoft, fontSize: font.small, lineHeight: 20 },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  lessonRowActive: { backgroundColor: colors.brandSoft },
  lessonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonNumberText: { color: "#fff", fontWeight: weight.bold, fontSize: 12 },
  lessonTitle: { color: colors.ink, fontSize: font.small, fontWeight: weight.semibold, lineHeight: 20 },
  lessonMeta: { color: colors.muted, fontSize: font.tiny, marginTop: 2 },
  lessonDetailTitle: { fontSize: font.h2, fontWeight: weight.bold, color: colors.ink, marginBottom: spacing.md, letterSpacing: -0.5 },
  videoButton: {
    backgroundColor: colors.brandStrong,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  videoButtonText: { color: "#fff", fontWeight: weight.bold, fontSize: font.body },
  empty: {
    color: colors.muted,
    fontStyle: "italic",
    fontSize: font.small,
    padding: spacing.md,
    textAlign: "center",
  },
  emptyText: { color: colors.muted, fontStyle: "italic", fontSize: font.small, textAlign: "center" },
  lessonNav: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  navButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
  },
  navButtonPrimary: { backgroundColor: colors.brand, borderColor: colors.brand },
  navButtonDisabled: { opacity: 0.4 },
  navButtonText: { color: colors.inkSoft, fontWeight: weight.semibold, fontSize: font.small },
  navButtonPrimaryText: { color: "#fff", fontWeight: weight.bold, fontSize: font.small },
  button: {
    backgroundColor: colors.brand,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonText: { color: "#fff", fontWeight: weight.bold, fontSize: font.body },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.brandStrong,
  },
  buttonSecondaryText: { color: colors.brandStrong, fontWeight: weight.bold, fontSize: font.body },
});
