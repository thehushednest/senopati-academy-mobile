/**
 * AuthLayout — shared shell untuk Welcome / Login / Signup screens.
 *
 * Layout:
 * - Top ~45% : brand teal gradient + decorative circles + heroContent
 * - Bottom : warm paper card dengan rounded top corners, berisi form/CTAs
 *
 * Props:
 * - showBack: tampilkan back arrow di top-left (Login + Signup, bukan Welcome)
 * - heroContent: ReactNode untuk render di hero area di atas card
 * - children: card content (form fields + buttons)
 */

import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import type { ReactNode } from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, radius, spacing } from "@/lib/theme";

type Props = {
  showBack?: boolean;
  heroContent: ReactNode;
  children: ReactNode;
};

export function AuthLayout({ showBack, heroContent, children }: Props) {
  const router = useRouter();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.brandStrong }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.brandStrong, colors.brand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Decorative circles — subtle white shapes untuk organic feel */}
          <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
            <Circle cx="15%" cy="20%" r="40" fill="rgba(255,255,255,0.08)" />
            <Circle cx="85%" cy="15%" r="60" fill="rgba(255,255,255,0.06)" />
            <Circle cx="70%" cy="55%" r="30" fill="rgba(255,255,255,0.10)" />
            <Circle cx="25%" cy="65%" r="50" fill="rgba(255,255,255,0.05)" />
            <Circle cx="50%" cy="35%" r="20" fill="rgba(255,255,255,0.12)" />
          </Svg>

          {showBack ? (
            <TouchableOpacity
              style={styles.back}
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Kembali"
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5 M12 19l-7-7 7-7"
                  stroke="#fdfcf9"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          ) : null}

          <View style={styles.heroInner}>{heroContent}</View>
        </LinearGradient>

        <View style={styles.card}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.brandStrong,
  },
  hero: {
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["3xl"],
    minHeight: 320,
    position: "relative",
    overflow: "hidden",
  },
  back: {
    position: "absolute",
    top: 56,
    left: spacing.lg,
    zIndex: 2,
    padding: spacing.xs,
  },
  heroInner: {
    flex: 1,
    justifyContent: "flex-end",
    zIndex: 1,
  },
  card: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl * 3,
    borderTopRightRadius: radius.xl * 3,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing["3xl"],
    marginTop: -32,
    minHeight: 420,
  },
});
