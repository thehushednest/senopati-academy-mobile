import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import { biometricLabel, getBiometricCapability, promptBiometric } from "@/lib/biometric";
import { sessionStore } from "@/lib/storage";
import { colors, font, radius, spacing, weight } from "@/lib/theme";

export default function ProfilScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [bioCapable, setBioCapable] = useState(false);
  const [bioLabel, setBioLabel] = useState("Biometrik");
  const [bioEnabled, setBioEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const cap = await getBiometricCapability();
      if (cap.available && cap.enrolled) {
        setBioCapable(true);
        setBioLabel(biometricLabel(cap.types));
      }
      setBioEnabled(await sessionStore.isBiometricEnabled());
    })();
  }, []);

  const toggleBiometric = async (next: boolean) => {
    if (next) {
      const ok = await promptBiometric("Aktifkan unlock biometrik");
      if (!ok) return;
    }
    await sessionStore.setBiometricEnabled(next);
    setBioEnabled(next);
  };

  const handleSignOut = () => {
    Alert.alert("Keluar", "Yakin mau keluar dari akun?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const initials = (user?.name || user?.email || "?")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "U"}</Text>
        </View>
        <Text style={styles.name}>{user?.name || "Pelajar"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{(user?.role || "student").toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Akun</Text>
        <Row
          label="Edit profil"
          hint="Ubah nama, foto, dll"
          onPress={() => Linking.openURL("https://senopatiacademy.id/profil")}
        />
        <Row
          label="Ganti password"
          hint="Via web — buka di browser"
          onPress={() => Linking.openURL("https://senopatiacademy.id/reset-password")}
        />
        {bioCapable ? (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Unlock dengan {bioLabel}</Text>
              <Text style={styles.rowHint}>Cepat masuk tanpa ketik password</Text>
            </View>
            <Switch
              value={bioEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: colors.line, true: colors.brand }}
              thumbColor="#fff"
            />
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lainnya</Text>
        <Row label="Kebijakan Privasi" onPress={() => Linking.openURL("https://senopatiacademy.id/privacy")} />
        <Row label="Syarat & Ketentuan" onPress={() => Linking.openURL("https://senopatiacademy.id/terms")} />
        <Row
          label="Hubungi kami"
          hint="halo@senopatiacademy.id"
          onPress={() => Linking.openURL("mailto:halo@senopatiacademy.id")}
        />
      </View>

      <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Keluar dari akun</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Senopati Academy Mobile · v0.1.0</Text>
    </ScrollView>
  );
}

function Row({ label, hint, onPress }: { label: string; hint?: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing["2xl"] },
  header: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 28, color: "#fff", fontWeight: weight.bold },
  name: { fontSize: font.h2, fontWeight: weight.bold, color: colors.ink },
  email: { fontSize: font.small, color: colors.muted, marginTop: 2 },
  rolePill: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  roleText: { fontSize: 10, color: colors.brandStrong, fontWeight: weight.bold, letterSpacing: 1 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: font.small, color: colors.muted, fontWeight: weight.bold, marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: "uppercase" },
  row: {
    backgroundColor: colors.panel,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowLabel: { fontSize: font.body, color: colors.ink, fontWeight: weight.semibold },
  rowHint: { fontSize: font.small, color: colors.muted, marginTop: 2 },
  rowChevron: { fontSize: 22, color: colors.mutedSoft },
  signOut: {
    backgroundColor: "#fee2e2",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  signOutText: { color: colors.danger, fontSize: font.body, fontWeight: weight.bold },
  version: { textAlign: "center", color: colors.mutedSoft, fontSize: font.tiny, marginTop: spacing.xl },
});
