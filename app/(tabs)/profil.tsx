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
import { colors, font, kickerStyle, radius, spacing, weight } from "@/lib/theme";

/**
 * Profil — editorial sidebar style. Drop avatar circle dengan brand bg +
 * card panels berwarna. Ganti ke dark avatar + cream text + hairline rows.
 */

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

  const roleLabel: Record<string, string> = {
    student: "Pelajar",
    tutor: "Tutor",
    admin: "Admin",
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
    >
      {/* ── Masthead ──────────────────────────────────── */}
      <View style={styles.masthead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "U"}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name}>{user?.name || "Pelajar"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.roleText}>
            {roleLabel[user?.role ?? "student"] ?? "Pelajar"}
          </Text>
        </View>
      </View>

      {/* ── Account section ────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>Akun</Text>
        <Row
          label="Edit profil"
          hint="Ubah nama, foto, biodata"
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

      {/* ── Lainnya ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>Lainnya</Text>
        <Row label="Kebijakan privasi" onPress={() => Linking.openURL("https://senopatiacademy.id/privacy")} />
        <Row label="Syarat & ketentuan" onPress={() => Linking.openURL("https://senopatiacademy.id/terms")} />
        <Row
          label="Hubungi kami"
          hint="halo@senopatiacademy.id"
          onPress={() => Linking.openURL("mailto:halo@senopatiacademy.id")}
        />
      </View>

      {/* ── Sign out — text link, no colored box ───────── */}
      <TouchableOpacity style={styles.signOut} onPress={handleSignOut} activeOpacity={0.5}>
        <Text style={styles.signOutText}>Keluar dari akun</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Senopati Academy Mobile · v0.1.0</Text>
    </ScrollView>
  );
}

function Row({ label, hint, onPress }: { label: string; hint?: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.5}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      <Text style={styles.rowChevron}>→</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing["3xl"],
  },

  masthead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 17,
    color: colors.bg,
    fontWeight: weight.semibold,
    letterSpacing: 0.5,
  },
  identity: {
    flex: 1,
  },
  name: {
    fontSize: font.h2,
    fontWeight: weight.semibold,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: font.small,
    color: colors.muted,
    marginTop: 2,
  },
  roleText: {
    ...kickerStyle,
    marginTop: 6,
  },

  section: {
    marginBottom: spacing.xl,
  },
  sectionKicker: {
    ...kickerStyle,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLabel: {
    fontSize: font.body,
    color: colors.ink,
    fontWeight: weight.medium,
  },
  rowHint: {
    fontSize: font.small,
    color: colors.muted,
    marginTop: 2,
  },
  rowChevron: {
    fontSize: 18,
    color: colors.muted,
    fontWeight: weight.medium,
    paddingLeft: spacing.md,
  },

  signOut: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  signOutText: {
    color: colors.danger,
    fontSize: font.body,
    fontWeight: weight.semibold,
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
  },

  version: {
    textAlign: "center",
    color: colors.mutedSoft,
    fontSize: font.tiny,
    marginTop: spacing.xl,
    letterSpacing: 0.5,
  },
});
