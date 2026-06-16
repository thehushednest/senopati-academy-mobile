/**
 * Welcome — entry screen untuk user yang belum login.
 * Brand hero + 2 CTA (Masuk / Bikin Akun) + optional OAuth.
 */

import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AuthLayout } from "@/components/AuthLayout";
import { BrandLogo } from "@/components/BrandLogo";
import { colors, font, fontFamily, radius, spacing, weight } from "@/lib/theme";

export default function WelcomeScreen() {
  return (
    <AuthLayout
      heroContent={
        <View style={styles.hero}>
          <BrandLogo size={72} />
          <Text style={styles.brand}>Senopati Academy</Text>
        </View>
      }
    >
      <View style={styles.cardInner}>
        <Text style={styles.eyebrow}>SELAMAT DATANG</Text>
        <Text style={styles.headline}>
          Belajar AI,{"\n"}
          <Text style={styles.headlineAccent}>siap hadapi masa depan.</Text>
        </Text>
        <Text style={styles.lede}>
          Modul, live session, dan Cerita Jeda. Semua di saku kamu, gratis
          100% untuk pelajar Indonesia.
        </Text>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>MASUK</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.7}>
            <Text style={styles.ghostBtnText}>BIKIN AKUN BARU</Text>
          </TouchableOpacity>
        </Link>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>atau</Text>
          <View style={styles.dividerLine} />
        </View>

        <Link href="/(auth)/reset-password" asChild>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkBtnText}>Lupa password? Reset di sini</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: spacing.md,
  },
  brand: {
    fontSize: font.h2,
    fontWeight: weight.semibold,
    color: colors.bg,
    letterSpacing: 0.3,
  },
  cardInner: {
    gap: spacing.md,
  },
  eyebrow: {
    fontSize: font.tiny,
    fontWeight: weight.bold,
    color: colors.brand,
    letterSpacing: 1.8,
  },
  headline: {
    fontFamily: fontFamily.heading,
    fontSize: font.hero,
    fontWeight: weight.semibold,
    color: colors.ink,
    letterSpacing: -0.8,
    lineHeight: font.hero * 1.15,
    marginBottom: spacing.xs,
  },
  headlineAccent: {
    fontFamily: fontFamily.heading,
    fontStyle: "italic",
    color: colors.brandStrong,
  },
  lede: {
    fontSize: font.body,
    color: colors.body,
    lineHeight: font.body * 1.55,
    marginBottom: spacing.lg,
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
  ghostBtn: {
    backgroundColor: "transparent",
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.brandStrong,
  },
  ghostBtnText: {
    color: colors.brandStrong,
    fontSize: font.body,
    fontWeight: weight.bold,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    fontSize: font.small,
    color: colors.muted,
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  linkBtnText: {
    fontSize: font.small,
    color: colors.brandStrong,
    fontWeight: weight.semibold,
  },
});
