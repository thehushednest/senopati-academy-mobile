import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, font, radius, spacing, weight } from "@/lib/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Tidak ditemukan" }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🧭</Text>
        <Text style={styles.title}>Halaman tidak ditemukan</Text>
        <Text style={styles.subtitle}>Mungkin link salah, atau kontennya sudah dipindahkan.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Kembali ke Beranda</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  title: { fontSize: font.h2, fontWeight: weight.bold, color: colors.ink, marginBottom: spacing.xs },
  subtitle: { fontSize: font.small, color: colors.muted, textAlign: "center", marginBottom: spacing.lg },
  link: {
    backgroundColor: colors.brand,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  linkText: { color: "#fff", fontWeight: weight.bold, fontSize: font.body },
});
