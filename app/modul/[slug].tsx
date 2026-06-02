import Constants from "expo-constants";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { sessionStore } from "@/lib/storage";
import { colors } from "@/lib/theme";

const BASE = (Constants.expoConfig?.extra as { apiBaseUrl?: string })?.apiBaseUrl ??
  "https://senopatiacademy.id";

/**
 * Modul detail — render web page via WebView untuk reuse lesson player.
 * Inject session cookie supaya logged-in state ke-share.
 *
 * Phase 2: bikin native lesson player (markdown/MDX → React Native components).
 */
export default function ModulDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionStore.getToken().then((t) => {
      setToken(t);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  const url = `${BASE}/belajar/${slug}`;
  const cookieHeader = token ? `__Secure-next-auth.session-token=${token}` : "";

  return (
    <>
      <Stack.Screen options={{ title: "Modul" }} />
      <WebView
        source={{
          uri: url,
          headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        }}
        sharedCookiesEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        )}
        style={{ flex: 1, backgroundColor: colors.bg }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
