import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { asyncStoragePersister, queryClient } from "@/lib/query-client";
import { colors } from "@/lib/theme";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 24 * 60 * 60 * 1000,
      }}
    >
      <AuthProvider>
        <RootLayoutGate />
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

function RootLayoutGate() {
  const { user, isBootstrapping } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isBootstrapping) return;
    SplashScreen.hideAsync().catch(() => null);

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(tabs)";

    if (!user && inAppGroup) {
      router.replace("/(auth)/welcome");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, isBootstrapping, segments, router]);

  // Deep link: senopati://modul/<slug> atau https://senopatiacademy.id/modul/<slug>
  useEffect(() => {
    if (!user) return;
    function handleUrl(url: string) {
      const parsed = Linking.parse(url);
      if (!parsed.path) return;
      const segs = parsed.path.split("/").filter(Boolean);
      if (segs[0] === "modul" && segs[1]) {
        router.push(`/modul/${segs[1]}`);
      } else if (segs[0] === "profil") {
        router.push("/(tabs)/profil");
      }
    }
    Linking.getInitialURL().then((url) => url && handleUrl(url));
    const sub = Linking.addEventListener("url", (e) => handleUrl(e.url));
    return () => sub.remove();
  }, [user, router]);

  // Push notif tap → buka modul kalau payload punya { modulSlug }
  useEffect(() => {
    if (!user) return;
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data as { modulSlug?: string } | null;
      if (data?.modulSlug) router.push(`/modul/${data.modulSlug}`);
    });
    return () => sub.remove();
  }, [user, router]);

  if (isBootstrapping) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.brand,
        }}
      >
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modul/[slug]" options={{ presentation: "card", headerShown: true, title: "Modul" }} />
    </Stack>
  );
}
