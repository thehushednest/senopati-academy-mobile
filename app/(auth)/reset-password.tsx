import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthLayout } from "@/components/AuthLayout";
import { AuthInput } from "@/components/AuthInput";
import { ApiError, requestOtp, resetPassword } from "@/lib/api";
import { colors, font, fontFamily, radius, spacing, weight } from "@/lib/theme";

type Step = "email" | "verify";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const emailValid = EMAIL_REGEX.test(email.trim());

  return (
    <AuthLayout
      showBack
      heroContent={
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SENOPATI ACADEMY</Text>
          {success ? (
            <Text style={styles.headline}>
              Password baru,{"\n"}
              <Text style={styles.headlineAccent}>aktif ✓</Text>
            </Text>
          ) : step === "email" ? (
            <Text style={styles.headline}>
              Lupa password,{"\n"}
              <Text style={styles.headlineAccent}>tidak apa-apa.</Text>
            </Text>
          ) : (
            <Text style={styles.headline}>
              Set password{"\n"}
              <Text style={styles.headlineAccent}>baru kamu.</Text>
            </Text>
          )}
        </View>
      }
    >
      {success ? (
        <>
          <Text style={styles.subtitle}>
            Password berhasil diubah. Kami arahkan ke halaman masuk…
          </Text>
        </>
      ) : step === "email" ? (
        <>
          <Text style={styles.subtitle}>
            Masukkan email akun kamu — kami kirim kode 6 digit untuk reset
            password.
          </Text>

          <AuthInput
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="email@contoh.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!busy}
            isValid={emailValid}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={sendOtp}
            disabled={busy || !emailValid}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.primaryBtnText}>KIRIM KODE RESET</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ingat password lagi?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Masuk</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Kode 6 digit dikirim ke{" "}
            <Text style={{ fontWeight: weight.bold, color: colors.ink }}>
              {email}
            </Text>
            . Berlaku 10 menit.
          </Text>

          <AuthInput
            label="KODE OTP"
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, "").slice(0, 6))}
            placeholder="000000"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            editable={!busy}
          />

          <AuthInput
            label="PASSWORD BARU (MIN. 8 KARAKTER)"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!busy}
            isPassword
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={submit}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.primaryBtnText}>UBAH PASSWORD</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setStep("email");
              setOtp("");
              setPassword("");
              setError(null);
            }}
            style={styles.changeEmailWrap}
          >
            <Text style={styles.changeEmailText}>Ganti email</Text>
          </TouchableOpacity>
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: font.tiny,
    fontWeight: weight.bold,
    color: colors.bg,
    letterSpacing: 1.8,
    opacity: 0.85,
  },
  headline: {
    fontFamily: fontFamily.heading,
    fontSize: font.hero,
    fontWeight: weight.semibold,
    color: colors.bg,
    letterSpacing: -0.8,
    lineHeight: font.hero * 1.15,
  },
  headlineAccent: {
    fontFamily: fontFamily.heading,
    fontStyle: "italic",
    color: colors.bg,
    opacity: 0.92,
  },
  subtitle: {
    fontSize: font.small,
    color: colors.muted,
    lineHeight: font.small * 1.55,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontSize: font.small,
    backgroundColor: "rgba(220, 38, 38, 0.08)",
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.brandStrong,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  primaryBtnText: {
    color: colors.bg,
    fontSize: font.body,
    fontWeight: weight.bold,
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  changeEmailWrap: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  changeEmailText: {
    fontSize: font.small,
    color: colors.muted,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing["2xl"],
  },
  footerText: {
    fontSize: font.small,
    color: colors.muted,
  },
  footerLink: {
    fontSize: font.small,
    color: colors.brandStrong,
    fontWeight: weight.bold,
  },
});
