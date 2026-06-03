/**
 * Biometric quick unlock — Face ID / Touch ID di iOS, fingerprint di Android.
 *
 * Flow:
 * 1. User login normal pertama kali
 * 2. App tanya "Aktifkan unlock biometrik?" → save flag + shadow copy token
 * 3. Saat re-launch app + token expired tapi shadow ada: prompt biometric
 * 4. Sukses → restore token dari shadow + redirect ke (tabs)
 */
import * as LocalAuthentication from "expo-local-authentication";
import { sessionStore } from "./storage";

export type BiometricCapability = {
  available: boolean;
  enrolled: boolean;
  types: LocalAuthentication.AuthenticationType[];
};

export async function getBiometricCapability(): Promise<BiometricCapability> {
  const [hardware, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);
  return { available: hardware, enrolled, types };
}

export async function promptBiometric(reason = "Buka kunci Senopati Academy") {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: "Pakai password",
    cancelLabel: "Batal",
    disableDeviceFallback: false,
  });
  return result.success;
}

/** True kalau perangkat bisa pakai biometric (hardware + at least one fingerprint/face enrolled). */
export async function isBiometricUsable(): Promise<boolean> {
  const cap = await getBiometricCapability();
  return cap.available && cap.enrolled;
}

/** Tipe biometric untuk label UI yang akurat. */
export function biometricLabel(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "Face ID";
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "Sidik jari";
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return "Iris";
  return "Biometrik";
}

/**
 * Try restore session via biometric. Return user kalau sukses + token masih valid,
 * null kalau perlu re-login penuh.
 */
export async function tryBiometricUnlock(): Promise<boolean> {
  const enabled = await sessionStore.isBiometricEnabled();
  if (!enabled) return false;
  const shadow = await sessionStore.getBiometricShadowToken();
  if (!shadow) return false;

  const usable = await isBiometricUsable();
  if (!usable) return false;

  const ok = await promptBiometric("Buka kunci dengan biometrik");
  if (!ok) return false;

  // Restore token dari shadow
  await sessionStore.setToken(shadow);
  return true;
}
