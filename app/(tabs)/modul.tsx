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
import { colors, font, radius, spacing, weight } from "@/lib/theme";

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
      <View style={styles.header}>
        <Text style={styles.title}>Katalog Modul</Text>
        <Text style={styles.subtitle}>
          {available.length} modul siap dipelajari{comingSoon.length > 0 ? `, ${comingSoon.length} segera hadir` : ""}.
        </Text>
      </View>

      {isLoading && modules.length === 0 ? (
        <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 40 }} />
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Siap Dipelajari</Text>
        {available.map((mod) => (
          <TouchableOpacity
            key={mod.slug}
            style={styles.card}
            onPress={() => router.push(`/modul/${mod.slug}`)}
            activeOpacity={0.75}
          >
            <View style={styles.cardHead}>
              <Text style={styles.cardCategory}>{mod.category}</Text>
              <Text style={styles.cardLevel}>{mod.level}</Text>
            </View>
            <Text style={styles.cardTitle}>{mod.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {mod.excerpt}
            </Text>
            <Text style={styles.cardMeta}>
              {mod.durationMinutes ? `${mod.durationMinutes} menit · ` : ""}
              {mod.lessonCount} sesi
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {comingSoon.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Segera Hadir</Text>
          <Text style={styles.subtitle}>Tim editorial sedang menyiapkan konten modul lainnya.</Text>
          {comingSoon.map((mod) => (
            <View key={mod.id} style={styles.csCard}>
              <Text style={styles.csCategory}>{mod.category}</Text>
              <Text style={styles.csTitle}>{mod.title}</Text>
              <Text style={styles.csLevel}>{mod.level}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing["2xl"] },
  header: { marginBottom: spacing.lg },
  title: { fontSize: font.h1, fontWeight: weight.extrabold, color: colors.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: font.small, color: colors.muted, marginTop: spacing.xs },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: font.h2, fontWeight: weight.bold, color: colors.ink, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
  cardCategory: { fontSize: 10, color: colors.brandStrong, fontWeight: weight.bold, letterSpacing: 1, textTransform: "uppercase" },
  cardLevel: { fontSize: 10, color: colors.muted, fontWeight: weight.semibold, letterSpacing: 0.5 },
  cardTitle: { fontSize: font.h3, fontWeight: weight.bold, color: colors.ink, marginBottom: spacing.xs },
  cardDesc: { fontSize: font.small, color: colors.muted, lineHeight: 20, marginBottom: spacing.sm },
  cardMeta: { fontSize: font.small, color: colors.muted, fontWeight: weight.semibold },
  csCard: {
    backgroundColor: "rgba(15, 23, 42, 0.03)",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
  },
  csCategory: { fontSize: 10, color: colors.muted, fontWeight: weight.bold, letterSpacing: 1, textTransform: "uppercase" },
  csTitle: { fontSize: font.body, fontWeight: weight.semibold, color: colors.inkSoft, marginTop: 2 },
  csLevel: { fontSize: font.small, color: colors.mutedSoft, marginTop: 2 },
});
