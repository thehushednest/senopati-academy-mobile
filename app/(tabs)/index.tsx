import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { useModulList } from "@/lib/hooks";
import { colors, font, radius, spacing, weight } from "@/lib/theme";

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{greeting},</Text>
        <Text style={styles.heroTitle}>
          {user?.name || "Pelajar"} 👋
        </Text>
        <Text style={styles.heroDesc}>
          Belum mulai modul apa pun? Yuk pilih satu dari Paham AI di bawah.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Program Paham AI</Text>
        <Text style={styles.sectionSub}>4 modul gratis, siap langsung pelajari.</Text>

        {availableModules.map((mod, idx) => {
          const accent = ["#18c29c", "#6366f1", "#f59e0b", "#ec4899"][idx % 4];
          return (
            <TouchableOpacity
              key={mod.slug}
              style={[styles.card, { borderLeftColor: accent }]}
              onPress={() => router.push(`/modul/${mod.slug}`)}
              activeOpacity={0.75}
            >
              <Text style={styles.cardEyebrow}>{mod.category.toUpperCase()}</Text>
              <Text style={styles.cardTitle}>{mod.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {mod.excerpt}
              </Text>
              <View style={styles.cardMeta}>
                <Text style={styles.metaPill}>{mod.level}</Text>
                {mod.durationMinutes ? (
                  <Text style={styles.metaText}>⏱ {mod.durationMinutes} menit</Text>
                ) : null}
                <Text style={styles.metaText}>{mod.lessonCount} sesi</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.tip}>
        <Text style={styles.tipTitle}>💡 Tip belajar</Text>
        <Text style={styles.tipText}>
          Belajar 30 menit per hari lebih efektif dari pada 3 jam sekali. Konsisten dulu, intensitas
          nanti.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing["2xl"] },
  hero: {
    backgroundColor: colors.panel,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  eyebrow: { fontSize: font.small, color: colors.muted, fontWeight: weight.semibold },
  heroTitle: {
    fontSize: font.h1,
    fontWeight: weight.extrabold,
    color: colors.ink,
    marginTop: spacing.xs,
    letterSpacing: -0.5,
  },
  heroDesc: { fontSize: font.small, color: colors.muted, marginTop: spacing.sm, lineHeight: 20 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: font.h2, fontWeight: weight.bold, color: colors.ink, marginBottom: spacing.xs },
  sectionSub: { fontSize: font.small, color: colors.muted, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardEyebrow: { fontSize: 10, color: colors.brandStrong, fontWeight: weight.bold, letterSpacing: 1 },
  cardTitle: { fontSize: font.h3, fontWeight: weight.bold, color: colors.ink, marginTop: spacing.xs },
  cardDesc: { fontSize: font.small, color: colors.muted, marginTop: spacing.xs, lineHeight: 20 },
  cardMeta: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, alignItems: "center" },
  metaPill: {
    fontSize: 11,
    color: colors.brandStrong,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    fontWeight: weight.bold,
  },
  metaText: { fontSize: font.small, color: colors.muted },
  tip: {
    backgroundColor: "#fef3c7",
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  tipTitle: { fontSize: font.body, fontWeight: weight.bold, color: colors.ink, marginBottom: spacing.xs },
  tipText: { fontSize: font.small, color: colors.inkSoft, lineHeight: 20 },
});
