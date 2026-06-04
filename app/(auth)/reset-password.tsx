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
import { ApiError, requestOtp, resetPassword } from "@/lib/api";
import { colors, font, radius, spacing, weight } from "@/lib/theme";

type Step = "email" | "verify";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const sendOtp = async () => {
    if (!email.trim() || busy) return;
    setError(null);
    setBusy(true);
    try {
      await requestOtp(email.trim(), "password_reset");
      setStep("verify");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Tidak bisa kirim kode. Coba lagi.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (busy) return;
    if (otp.length !== 6) return setError("Kode OTP harus 6 digit.");
    if (password.length < 8) return setError("Password baru minimal 8 karakter.");
    setError(null);
    setBusy(true);
    try {
      await resetPassword({ email: email.trim(), password, otp });
      setSuccess(true);
      setTimeout(() => router.replace("/(auth)/login"), 1800);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal reset password. Coba lagi.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.brand}>Reset Password</Text>
          <Text style={styles.tagline}>Kami akan kirim kode ke email kamu.</Text>
        </View>

        <View style={styles.card}>
          {success ? (
            <>
              <Text style={styles.title}>Password berhasil diubah ✓</Text>
              <Text style={styles.subtitle}>Mengarahkan ke halaman masuk…</Text>
            </>
          ) : step === "email" ? (
            <>
              <Text style={styles.title}>Email akun kamu</Text>
              <View style={styles.field}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="kamu@email.com"
                  placeholderTextColor={colors.mutedSoft}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!busy}
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.button, busy && styles.buttonDisabled]}
                onPress={sendOtp}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kirim Kode</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Verifikasi & set password baru</Text>
              <Text style={styles.subtitle}>
                Kode 6 digit dikirim ke {email}. Berlaku 10 menit.
              </Text>
              <View style={styles.field}>
                <Text style={styles.label}>Kode OTP</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otp}
                  onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor={colors.mutedSoft}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  editable={!busy}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Password baru (min. 8)</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedSoft}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  editable={!busy}
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.button, busy && styles.buttonDisabled]}
                onPress={submit}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Simpan Password</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Link href="/(auth)/login" style={styles.linkPrimary}>
            ← Kembali ke login
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, backgroundColor: colors.bg },
  hero: { alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.lg },
  brand: { fontSize: font.h1, fontWeight: weight.semibold, color: colors.brandStrong, letterSpacing: -0.5 },
  tagline: { fontSize: font.small, color: colors.muted, marginTop: spacing.xs },
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
  title: { fontSize: font.h2, fontWeight: weight.bold, color: colors.ink, marginBottom: spacing.xs },
  subtitle: { fontSize: font.small, color: colors.muted, marginBottom: spacing.lg, lineHeight: 20 },
  field: { marginBottom: spacing.md },
  label: { fontSize: font.small, color: colors.inkSoft, fontWeight: weight.semibold, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.body,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
  },
  otpInput: { letterSpacing: 8, fontSize: 22, textAlign: "center", fontWeight: weight.bold },
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: font.body, fontWeight: weight.bold },
  footer: { alignItems: "center", marginTop: spacing.xl },
  linkPrimary: { color: colors.brandStrong, fontSize: font.small, fontWeight: weight.bold },
});
