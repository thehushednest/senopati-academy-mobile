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
import { ApiError, requestOtp, signup } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { colors, font, fontFamily, radius, spacing, weight } from "@/lib/theme";

type Step = "email" | "verify";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const emailValid = EMAIL_REGEX.test(email.trim());

  return (
    <AuthLayout
      showBack
      heroContent={
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SENOPATI ACADEMY</Text>
          {step === "email" ? (
            <Text style={styles.headline}>
              Bikin akun,{"\n"}
              <Text style={styles.headlineAccent}>3 langkah cepat.</Text>
            </Text>
          ) : (
            <Text style={styles.headline}>
              Cek inbox,{"\n"}
              <Text style={styles.headlineAccent}>kami sudah kirim kode.</Text>
            </Text>
          )}
        </View>
      }
    >
      {step === "email" ? (
        <>
          <Text style={styles.subtitle}>
            Gratis 100% untuk pelajar SMA. Kami kirim kode verifikasi 6 digit ke
            email kamu.
          </Text>

          <AuthInput
            label="NAMA PANGGILAN (OPSIONAL)"
            value={name}
            onChangeText={setName}
            placeholder="Sasa, Raka, …"
            autoComplete="name-given"
            editable={!busy}
          />

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
              <Text style={styles.primaryBtnText}>KIRIM KODE OTP</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Sudah punya akun?</Text>
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
            label="BUAT PASSWORD (MIN. 8 KARAKTER)"
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
            onPress={verifyAndCreate}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.primaryBtnText}>DAFTAR</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={sendOtp}
            disabled={cooldown > 0 || busy}
            style={styles.resendWrap}
          >
            <Text
              style={[
                styles.resendText,
                (cooldown > 0 || busy) && { opacity: 0.4 },
              ]}
            >
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
  resendWrap: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  resendText: {
    fontSize: font.small,
    color: colors.brandStrong,
    fontWeight: weight.semibold,
  },
  changeEmailWrap: {
    alignItems: "center",
    paddingVertical: spacing.sm,
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
