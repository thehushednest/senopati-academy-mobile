import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { useModulList } from "@/lib/hooks";
import { colors, font, kickerStyle, radius, spacing, weight } from "@/lib/theme";

/**
 * Beranda — editorial mobile layout. Drop hero card + rainbow accent borders
 * yang bikin "AI generic". Ganti ke editorial pattern: kicker + serif title
 * + flat list dengan hairline divider.
 */

export default function BerandaScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: modules = [] } = useModulList();
  const availableModules = modules.filter((m) => !m.comingSoon).slice(0, 4);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  })();

  const firstName = (user?.name || "Pelajar").split(" ")[0];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
    >
      {/* ── Masthead ─────────────────────────────────────── */}
      <View style={styles.masthead}>
        <Text style={styles.kicker}>{greeting.toUpperCase()}</Text>
        <Text style={styles.heroTitle}>Halo, {firstName}.</Text>
        <Text style={styles.heroLede}>
          Belum mulai modul apa pun? Pilih satu dari Paham AI di bawah.
        </Text>
      </View>

      {/* ── Modul section ────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>Program Paham AI</Text>
          <Text style={styles.sectionCount}>{availableModules.length} modul</Text>
        </View>

        <View style={styles.list}>
          {availableModules.map((mod, idx) => (
            <TouchableOpacity
              key={mod.slug}
              style={[styles.row, idx === availableModules.length - 1 && styles.rowLast]}
              onPress={() => router.push(`/modul/${mod.slug}`)}
              activeOpacity={0.6}
            >
              <Text style={styles.rowNum}>
                {String(idx + 1).padStart(2, "0")}
              </Text>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {mod.title}
                </Text>
                <Text style={styles.rowDesc} numberOfLines={2}>
                  {mod.excerpt}
                </Text>
                <View style={styles.rowMeta}>
                  <Text style={styles.metaText}>{mod.level}</Text>
                  <Text style={styles.metaSep}>·</Text>
                  {mod.durationMinutes ? (
                    <>
                      <Text style={styles.metaText}>{mod.durationMinutes} menit</Text>
                      <Text style={styles.metaSep}>·</Text>
                    </>
                  ) : null}
                  <Text style={styles.metaText}>{mod.lessonCount} sesi</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Tip — sidenote style, tidak ber-warna ─────────── */}
      <View style={styles.tip}>
        <Text style={styles.tipKicker}>Catatan</Text>
        <Text style={styles.tipText}>
          Belajar 30 menit per hari lebih efektif dari 3 jam sekali. Konsisten
          dulu, intensitas nanti.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing["3xl"],
  },

  // ── Masthead ────────────────────────────────────────
  masthead: {
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: spacing.xl,
  },
  kicker: {
    ...kickerStyle,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: font.hero,
    fontWeight: weight.semibold,
    color: colors.ink,
    letterSpacing: -0.7,
    lineHeight: font.hero * 1.1,
  },
  heroLede: {
    fontSize: font.body,
    color: colors.body,
    marginTop: spacing.md,
    lineHeight: 22,
  },

  // ── Section ─────────────────────────────────────────
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sectionKicker: {
    ...kickerStyle,
  },
  sectionCount: {
    fontSize: font.tiny,
    color: colors.muted,
    fontVariant: ["tabular-nums"],
  },

  // ── List (editorial divider list, no card) ─────────
  list: {
    marginTop: 0,
  },
  row: {
    flexDirection: "row",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: spacing.lg,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowNum: {
    fontSize: 22,
    fontWeight: weight.semibold,
    color: colors.mutedSoft,
    fontVariant: ["tabular-nums"],
    width: 32,
    lineHeight: 26,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: font.h3,
    fontWeight: weight.semibold,
    color: colors.ink,
    letterSpacing: -0.2,
    marginBottom: 4,
    lineHeight: 20,
  },
  rowDesc: {
    fontSize: font.small,
    color: colors.body,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: font.tiny,
    color: colors.muted,
    fontWeight: weight.medium,
  },
  metaSep: {
    fontSize: font.tiny,
    color: colors.lineStrong,
  },

  // ── Tip — sidenote (no colored box, just text + rule) ─
  tip: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  tipKicker: {
    ...kickerStyle,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: font.small,
    color: colors.body,
    lineHeight: 20,
  },
});
