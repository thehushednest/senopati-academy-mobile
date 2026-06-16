/**
 * BrandLogo — SVG monogram "SA" untuk Senopati Academy.
 * Cream stroke on transparent bg supaya bisa overlay di gradient hero.
 * Bisa di-replace dengan logo PNG resmi nanti via prop.
 */

import { View, StyleSheet } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "@/lib/theme";

type Props = { size?: number };

export function BrandLogo({ size = 80 }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 80 80">
        {/* Outer ring */}
        <Circle
          cx={40}
          cy={40}
          r={37}
          stroke={colors.bg}
          strokeWidth={2}
          fill="none"
          opacity={0.7}
        />
        {/* Monogram S — kurva flowing */}
        <Path
          d="M52 26c-2-3-7-5-12-5-7 0-12 4-12 9 0 12 24 6 24 18 0 6-6 10-13 10-6 0-11-2-13-6"
          stroke={colors.bg}
          strokeWidth={3.2}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
