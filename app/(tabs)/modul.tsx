import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LAUNCH_MODULES } from "@/lib/api";
import { colors, font, radius, spacing, weight } from "@/lib/theme";

const COMING_SOON_PREVIEW = [
  { category: "Foundations", title: "How AI Works", level: "Pemula" },
  { category: "Foundations", title: "History of AI", level: "Pemula" },
  { category: "Praktis", title: "AI for Writing", level: "Menengah" },
  { category: "Praktis", title: "AI for Research", level: "Menengah" },
  { category: "Ethics & Safety", title: "Bias in AI", level: "Menengah" },
  { category: "Advanced & Dev", title: "API Integration Basics", level: "Lanjutan" },
];

export default function ModulScreen() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Katalog Modul</Text>
        <Text style={styles.subtitle}>4 modul siap dipelajari, lainnya segera hadir.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Siap Dipelajari</Text>
        {LAUNCH_MODULES.map((mod) => (
          <TouchableOpacity
            key={mod.slug}
            style={styles.card}
            onPress={() => router.push(`/modul/${mod.slug}`)}
            activeOpacity={0.75}
          >
            <View style={styles.cardHead}>
              <Text style={styles.cardCategory}>{mod.categorySlug}</Text>
              <Text style={styles.cardLevel}>{mod.level}</Text>
            </View>
            <Text style={styles.cardTitle}>{mod.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {mod.excerpt}
            </Text>
            <Text style={styles.cardMeta}>
              {mod.duration} · {mod.topics} sesi
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Segera Hadir</Text>
        <Text style={styles.subtitle}>Tim editorial sedang menyiapkan konten modul lainnya.</Text>
        {COMING_SOON_PREVIEW.map((mod, idx) => (
          <View key={idx} style={styles.csCard}>
            <Text style={styles.csCategory}>{mod.category}</Text>
            <Text style={styles.csTitle}>{mod.title}</Text>
            <Text style={styles.csLevel}>{mod.level}</Text>
          </View>
        ))}
      </View>
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
