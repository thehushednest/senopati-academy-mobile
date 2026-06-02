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
import { ApiError, requestOtp, signup } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { colors, font, radius, spacing, weight } from "@/lib/theme";

type Step = "email" | "verify";

export default function SignupScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    if (!email.trim() || busy) return;
    setError(null);
    setBusy(true);
    try {
      await requestOtp(email.trim(), "signup_verify");
      setStep("verify");
      startCooldown();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Tidak bisa kirim kode. Coba lagi.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const verifyAndCreate = async () => {
    if (busy) return;
    if (otp.length !== 6) {
      setError("Kode OTP harus 6 digit.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signup({ email: email.trim(), password, otp, name: name.trim() || undefined });
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal mendaftar. Coba lagi.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.brand}>Senopati Academy</Text>
          <Text style={styles.tagline}>Daftar gratis, mulai belajar AI hari ini</Text>
        </View>

        <View style={styles.card}>
          {step === "email" ? (
            <>
              <Text style={styles.title}>Daftar akun</Text>
              <Text style={styles.subtitle}>Kami akan kirim kode verifikasi 6 digit ke emailmu.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Nama panggilan (opsional)</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Sasa, Raka, …"
                  placeholderTextColor={colors.mutedSoft}
                  autoComplete="name-given"
                  editable={!busy}
                />
              </View>

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
              <Text style={styles.title}>Cek inboxmu</Text>
              <Text style={styles.subtitle}>
                Kode 6 digit dikirim ke <Text style={{ fontWeight: weight.bold }}>{email}</Text>. Berlaku 10
                menit.
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
                <Text style={styles.label}>Buat password (min. 8 karakter)</Text>
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
                onPress={verifyAndCreate}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Daftar</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={sendOtp}
                disabled={cooldown > 0 || busy}
                style={{ marginTop: spacing.md }}
              >
                <Text style={[styles.linkSmall, (cooldown > 0 || busy) && { opacity: 0.4 }]}>
                  {cooldown > 0 ? `Kirim ulang dalam ${cooldown}s` : "Kirim ulang kode"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setStep("email");
                  setOtp("");
                  setPassword("");
                  setError(null);
                }}
                disabled={busy}
              >
                <Text style={styles.linkSmall}>← Ubah email</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sudah punya akun?</Text>
          <Link href="/(auth)/login" style={styles.linkPrimary}>
            Masuk
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, backgroundColor: colors.bg },
  hero: { alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.lg },
  brand: { fontSize: font.h1, fontWeight: weight.extrabold, color: colors.brandStrong, letterSpacing: -0.5 },
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
  linkSmall: { color: colors.brandStrong, fontSize: font.small, textAlign: "center", fontWeight: weight.semibold, marginTop: spacing.sm },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.xl, gap: spacing.xs },
  footerText: { color: colors.muted, fontSize: font.small },
  linkPrimary: { color: colors.brandStrong, fontSize: font.small, fontWeight: weight.bold },
});
