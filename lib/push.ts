/**
 * Push notification scaffold via expo-notifications.
 *
 * Flow registrasi:
 * 1. Request permission saat user pertama kali login (atau setelah opt-in)
 * 2. Get Expo Push Token (atau FCM/APNs native token kalau pakai EAS)
 * 3. POST token ke backend /api/notifications/register
 * 4. Backend simpan token + user mapping, kirim notif via Expo Push API
 *
 * Backend endpoint /api/notifications/register BELUM ADA — Phase 2b.
 * Untuk sementara, function ini cuma cache token di SecureStore.
 */
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";
import { sessionStore } from "./storage";

const KEY_PUSH_TOKEN = "senopati.push_token";

// Saat notif tiba dengan app foreground, tampilkan banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request permission + return Expo Push Token. Null kalau ditolak / emulator.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // Simulator/emulator gak support push native.
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#18c29c",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenData.data;

  // Cache locally
  try {
    if (Platform.OS !== "web") {
      const SecureStore = await import("expo-secure-store");
      await SecureStore.setItemAsync(KEY_PUSH_TOKEN, token);
    }
  } catch {
    // ignore
  }

  // Phase 2b: POST ke backend kalau endpoint sudah ada
  // await api("/api/notifications/register", { method: "POST", body: JSON.stringify({ token, platform: Platform.OS }) });

  return token;
}

export async function getStoredPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const SecureStore = await import("expo-secure-store");
    return SecureStore.getItemAsync(KEY_PUSH_TOKEN);
  } catch {
    return null;
  }
}

// Hindari unused-imports kalau backend register belum aktif
void api;
void sessionStore;
