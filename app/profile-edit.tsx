/**
 * Profile Edit screen — native form untuk update biodata + avatar.
 *
 * Phase 3A (2026-06-16) — replace Linking.openURL("/profil") di
 * (tabs)/profil.tsx dengan native screen ini.
 *
 * Fields:
 * - Avatar: tap untuk pick image (expo-image-picker) → POST /api/account/avatar
 *   - Long-press untuk Hapus foto
 * - Nama lengkap (StudentProfile.fullName)
 * - Sekolah (StudentProfile.schoolName)
 * - Kelas / Grade (StudentProfile.schoolGrade)
 * - Nomor HP (StudentProfile.phoneNumber)
 *
 * Field lain (alamat, ortu, dll) defer ke web /profil — terlalu banyak
 * untuk first-pass native UI. Tambah link "Edit detail lain di web" di
 * bawah form supaya user tetap bisa akses.
 *
 * Save: PUT /api/onboarding/biodata + refresh auth context supaya nama +
 * avatar baru langsung muncul di seluruh app.
 */

import { Stack, useRouter } from "expo-router";
// expo-image-picker baru ditambah di package.json — perlu `npm install`
// supaya module ter-resolve (TS error sebelum install harmless).
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import {
  deleteAvatar,
  getBiodata,
  updateBiodata,
  uploadAvatar,
  type BiodataPayload,
} from "@/lib/api";
import { colors, font, radius, spacing, weight } from "@/lib/theme";

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolGrade, setSchoolGrade] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Load biodata saat mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getBiodata();
      if (cancelled || !data) {
        setLoading(false);
        return;
      }
      setFullName(data.fullName ?? "");
      setSchoolName(data.schoolName ?? "");
      setSchoolGrade(data.schoolGrade ?? "");
      setPhoneNumber(data.phoneNumber ?? "");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAvatarPick() {
    if (avatarBusy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Izin diperlukan",
        "Beri akses ke foto supaya kami bisa pakai gambar dari galeri kamu.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;

    setAvatarBusy(true);
    try {
      const url = await uploadAvatar(uri);
      setAvatarUrl(url);
      await refresh(); // sync ke auth-context supaya tab Profil dapat avatar baru
    } catch (err) {
      Alert.alert("Upload gagal", err instanceof Error ? err.message : "Coba lagi.");
    } finally {
      setAvatarBusy(false);
    }
  }

  function handleAvatarLongPress() {
    if (!avatarUrl || avatarBusy) return;
    Alert.alert("Hapus foto profil?", undefined, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          setAvatarBusy(true);
          try {
            await deleteAvatar();
            setAvatarUrl(null);
            await refresh();
          } catch (err) {
            Alert.alert("Gagal hapus", err instanceof Error ? err.message : "Coba lagi.");
          } finally {
            setAvatarBusy(false);
          }
        },
      },
    ]);
  }

  async function handleSave() {
    if (saving) return;
    if (!fullName.trim()) {
      Alert.alert("Nama wajib", "Isi nama lengkap kamu dulu.");
      return;
    }
    setSaving(true);
    const payload: BiodataPayload = {
      fullName: fullName.trim() || null,
      schoolName: schoolName.trim() || null,
      schoolGrade: schoolGrade.trim() || null,
      phoneNumber: phoneNumber.trim() || null,
    };
    try {
      await updateBiodata(payload);
      await refresh();
      Alert.alert("Tersimpan", "Profil kamu sudah update.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Gagal simpan", err instanceof Error ? err.message : "Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  const initials = (fullName || user?.name || user?.email || "?")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <>
      <Stack.Screen options={{ title: "Edit Profil", headerBackTitle: "Profil" }} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Avatar block ───────────────────────────────── */}
          <View style={styles.avatarBlock}>
            <TouchableOpacity
              onPress={handleAvatarPick}
              onLongPress={handleAvatarLongPress}
              activeOpacity={0.85}
              disabled={avatarBusy}
              style={styles.avatarTouchable}
              accessibilityLabel="Ganti foto profil. Tap-tahan untuk hapus."
            >
              <View style={styles.avatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitials}>{initials || "U"}</Text>
                )}
                {avatarBusy ? (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color={colors.bg} />
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>
              Tap untuk ganti foto. Tap-tahan untuk hapus.
            </Text>
          </View>

          {/* ── Form fields ────────────────────────────────── */}
          {loading ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
          ) : (
            <View style={styles.form}>
              <Field
                label="Nama lengkap *"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Sesuai KK/akte kelahiran"
                autoCapitalize="words"
                autoComplete="name"
              />
              <Field
                label="Sekolah"
                value={schoolName}
                onChangeText={setSchoolName}
                placeholder="Mis. SMA Negeri 1 Jakarta"
                autoCapitalize="words"
              />
              <Field
                label="Kelas / Grade"
                value={schoolGrade}
                onChangeText={setSchoolGrade}
                placeholder="Mis. XI IPA 3"
                autoCapitalize="characters"
              />
              <Field
                label="Nomor HP"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="08xxxxxxxxxx"
                keyboardType="phone-pad"
                autoComplete="tel"
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={styles.saveBtnText}>SIMPAN PERUBAHAN</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.webLink}
                onPress={() => Linking.openURL("https://senopatiacademy.id/profil")}
              >
                <Text style={styles.webLinkText}>
                  Edit detail lain (alamat, ortu, dll) di web →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "name" | "tel" | "email";
  keyboardType?: "default" | "phone-pad" | "email-address";
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "sentences",
  autoComplete,
  keyboardType = "default",
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedSoft}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  avatarBlock: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatarTouchable: {
    borderRadius: 999,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    color: colors.bg,
    fontSize: 36,
    fontWeight: weight.semibold,
    letterSpacing: 1,
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(12, 15, 20, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    fontSize: font.small,
    color: colors.muted,
    textAlign: "center",
  },
  form: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: font.small,
    color: colors.muted,
    fontWeight: weight.semibold,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  fieldInput: {
    fontSize: font.body,
    color: colors.ink,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  saveBtn: {
    backgroundColor: colors.brand,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  saveBtnText: {
    color: colors.bg,
    fontWeight: weight.semibold,
    letterSpacing: 1,
    fontSize: font.body,
  },
  webLink: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  webLinkText: {
    color: colors.brand,
    fontSize: font.small,
    fontWeight: weight.semibold,
  },
});
