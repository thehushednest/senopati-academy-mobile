/**
 * AuthInput — minimal text input untuk auth screens.
 *
 * Visual: label kecil di atas, input dengan bottom border only (no full box),
 * trailing icon optional (validation ✓ untuk email format valid, atau eye
 * toggle untuk password show/hide).
 */

import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, font, spacing, weight } from "@/lib/theme";

type Props = TextInputProps & {
  label: string;
  /** Toggle untuk password — secureTextEntry yang bisa di-show/hide */
  isPassword?: boolean;
  /** Tampilkan tanda valid (✓) — biasanya untuk email yang format-nya benar */
  isValid?: boolean;
};

export function AuthInput({ label, isPassword, isValid, ...inputProps }: Props) {
  const [revealed, setRevealed] = useState(false);
  const secure = isPassword ? !revealed : false;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          {...inputProps}
          secureTextEntry={secure}
          style={styles.input}
          placeholderTextColor={colors.mutedSoft}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setRevealed((v) => !v)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={revealed ? "Sembunyikan password" : "Tampilkan password"}
          >
            <EyeIcon open={revealed} />
          </TouchableOpacity>
        ) : isValid ? (
          <CheckIcon />
        ) : null}
      </View>
      <View style={styles.underline} />
    </View>
  );
}

function CheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6 9 17l-5-5"
        stroke={colors.brand}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"
          stroke={colors.muted}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          stroke={colors.muted}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="m3 3 18 18 M10.6 6.1A10 10 0 0 1 22 12s-1.6 2.7-4.4 4.7 M6.6 7.6A14 14 0 0 0 2 12s4 7 10 7c1.8 0 3.5-.4 5-1.2"
        stroke={colors.muted}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: font.small,
    color: colors.muted,
    fontWeight: weight.semibold,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: font.body,
    color: colors.ink,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  underline: {
    height: 1,
    backgroundColor: colors.line,
    marginTop: 2,
  },
});
