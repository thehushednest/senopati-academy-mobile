import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { useModulList } from "@/lib/hooks";
import { colors, font, kickerStyle, spacing, weight } from "@/lib/theme";

/**
 * Katalog modul — editorial divider list. Drop card+border pattern,
 * numbered list dengan kicker + meta inline.
 */

export default function ModulScreen() {
  const router = useRouter();
  const { data: modules = [], isLoading, refetch } = useModulList();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const available = modules.filter((m) => !m.comingSoon);
  const comingSoon = modules.filter((m) => m.comingSoon);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* ── Masthead ─────────────────────────────────── */}
      <View style={styles.masthead}>
        <Text style={styles.kicker}>Katalog</Text>
        <Text style={styles.title}>Modul AI siap dipelajari.</Text>
        <Text style={styles.lede}>
          {available.length} modul{comingSoon.length > 0 ? ` aktif, ${comingSoon.length} segera hadir` : ""}.
          Pilih yang paling dekat dengan kebutuhanmu — gak harus urut.
        </Text>
      </View>

      {isLoading && modules.length === 0 ? (
        <ActivityIndicator size="small" color={colors.brand} style={{ marginTop: 40 }} />
      ) : null}

      {/* ── Available list ────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>Siap dipelajari</Text>
          <Text style={styles.sectionCount}>{available.length}</Text>
        </View>

        <View>
          {available.map((mod, idx) => (
            <TouchableOpacity
              key={mod.slug}
              style={[styles.row, idx === available.length - 1 && styles.rowLast]}
              onPress={() => router.push(`/modul/${mod.slug}`)}
              activeOpacity={0.6}
            >
              <Text style={styles.rowNum}>{String(idx + 1).padStart(2, "0")}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.rowCategory}>
                  {mod.category.toUpperCase()}
                </Text>
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

      {/* ── Coming soon ────────────────────────────────── */}
      {comingSoon.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionKicker, { color: colors.accent }]}>Segera hadir</Text>
            <Text style={styles.sectionCount}>{comingSoon.length}</Text>
          </View>
          {comingSoon.map((mod, idx) => (
            <View
              key={mod.id}
              style={[styles.row, styles.rowCs, idx === comingSoon.length - 1 && styles.rowLast]}
            >
              <Text style={[styles.rowNum, { color: colors.mutedSoft }]}>
                {String(idx + available.length + 1).padStart(2, "0")}
              </Text>
              <View style={styles.rowBody}>
                <Text style={styles.rowCategory}>{mod.category.toUpperCase()}</Text>
                <Text style={[styles.rowTitle, { color: colors.body }]} numberOfLines={2}>
                  {mod.title}
                </Text>
                <Text style={styles.metaText}>{mod.level}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing["3xl"],
  },

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
  title: {
    fontSize: font.hero,
    fontWeight: weight.semibold,
    color: colors.ink,
    letterSpacing: -0.7,
    lineHeight: font.hero * 1.1,
  },
  lede: {
    fontSize: font.body,
    color: colors.body,
    marginTop: spacing.md,
    lineHeight: 22,
  },

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
  sectionKicker: { ...kickerStyle },
  sectionCount: {
    fontSize: font.tiny,
    color: colors.muted,
    fontVariant: ["tabular-nums"],
  },

  row: {
    flexDirection: "row",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: spacing.lg,
  },
  rowLast: { borderBottomWidth: 0 },
  rowCs: { opacity: 0.7 },

  rowNum: {
    fontSize: 22,
    fontWeight: weight.semibold,
    color: colors.mutedSoft,
    fontVariant: ["tabular-nums"],
    width: 32,
    lineHeight: 26,
  },
  rowBody: { flex: 1 },

  rowCategory: {
    fontSize: font.micro,
    color: colors.brand,
    fontWeight: weight.semibold,
    letterSpacing: 1.5,
    marginBottom: 4,
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
});
