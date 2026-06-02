import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { colors, font, radius, spacing, weight } from "@/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Tidak bisa masuk. Coba lagi.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.brand}>Senopati Academy</Text>
          <Text style={styles.tagline}>Belajar AI, siap hadapi masa depan</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Selamat datang kembali</Text>
          <Text style={styles.subtitle}>Masuk dengan email & password kamu.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="kamu@email.com"
              placeholderTextColor={colors.mutedSoft}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!busy}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedSoft}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!busy}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Masuk</Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/reset-password" style={styles.linkSmall}>
            Lupa password?
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Belum punya akun?</Text>
          <Link href="/(auth)/signup" style={styles.linkPrimary}>
            Daftar sekarang
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  hero: {
    alignItems: "center",
    marginTop: spacing["2xl"],
    marginBottom: spacing.xl,
  },
  brand: {
    fontSize: font.h1,
    fontWeight: weight.extrabold,
    color: colors.brandStrong,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: font.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: {
    fontSize: font.h2,
    fontWeight: weight.bold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: font.small,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: font.small,
    color: colors.inkSoft,
    fontWeight: weight.semibold,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.body,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
  },
  error: {
    color: colors.danger,
    fontSize: font.small,
    marginBottom: spacing.md,
    backgroundColor: "#fee2e2",
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  button: {
    backgroundColor: colors.brand,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: font.body,
    fontWeight: weight.bold,
  },
  linkSmall: {
    color: colors.brandStrong,
    fontSize: font.small,
    marginTop: spacing.md,
    textAlign: "center",
    fontWeight: weight.semibold,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  footerText: {
    color: colors.muted,
    fontSize: font.small,
  },
  linkPrimary: {
    color: colors.brandStrong,
    fontSize: font.small,
    fontWeight: weight.bold,
  },
});
