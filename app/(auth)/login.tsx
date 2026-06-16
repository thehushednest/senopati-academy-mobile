import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthLayout } from "@/components/AuthLayout";
import { AuthInput } from "@/components/AuthInput";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import {
  biometricLabel,
  getBiometricCapability,
  tryBiometricUnlock,
} from "@/lib/biometric";
import { sessionStore } from "@/lib/storage";
import { colors, font, fontFamily, radius, spacing, weight } from "@/lib/theme";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bioLabel, setBioLabel] = useState<string | null>(null);
  const [bioShadowReady, setBioShadowReady] = useState(false);

  useEffect(() => {
    (async () => {
      const enabled = await sessionStore.isBiometricEnabled();
      const shadow = await sessionStore.getBiometricShadowToken();
      if (!enabled || !shadow) return;
      const cap = await getBiometricCapability();
      if (cap.available && cap.enrolled) {
        setBioLabel(biometricLabel(cap.types));
        setBioShadowReady(true);
      }
    })();
  }, []);

  const handleBiometric = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const ok = await tryBiometricUnlock();
      if (!ok) {
        setError("Biometrik gagal. Coba password.");
        return;
      }
      await refresh();
      router.replace("/(tabs)");
    } catch {
      setError("Tidak bisa unlock. Coba password.");
    } finally {
      setBusy(false);
    }
  };

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

  const emailValid = EMAIL_REGEX.test(email.trim());

  return (
    <AuthLayout
      showBack
      heroContent={
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SENOPATI ACADEMY</Text>
          <Text style={styles.headline}>
            Halo,{"\n"}
            <Text style={styles.headlineAccent}>masuk akun.</Text>
          </Text>
        </View>
      }
    >
      <Text style={styles.subtitle}>
        Lanjut belajar AI dari mana saja — modul, live session, dan Cerita Jeda
        kamu siap di sini.
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

      <AuthInput
        label="PASSWORD"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        autoCapitalize="none"
        autoComplete="password"
        editable={!busy}
        isPassword
      />

      <Link href="/(auth)/reset-password" asChild>
        <TouchableOpacity style={styles.forgotWrap}>
          <Text style={styles.forgot}>Lupa password?</Text>
        </TouchableOpacity>
      </Link>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryBtn, busy && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.primaryBtnText}>MASUK</Text>
        )}
      </TouchableOpacity>

      {bioShadowReady ? (
        <TouchableOpacity
          style={styles.bioBtn}
          onPress={handleBiometric}
          disabled={busy}
          activeOpacity={0.7}
        >
          <Text style={styles.bioBtnText}>🔒 Masuk dengan {bioLabel}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Belum punya akun?</Text>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Daftar sekarang</Text>
          </TouchableOpacity>
        </Link>
      </View>
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
  forgotWrap: {
    alignSelf: "flex-end",
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  forgot: {
    fontSize: font.small,
    color: colors.brandStrong,
    fontWeight: weight.semibold,
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
  bioBtn: {
    backgroundColor: colors.brandSoft,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: "center",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  bioBtnText: {
    color: colors.brandStrong,
    fontSize: font.body,
    fontWeight: weight.bold,
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
