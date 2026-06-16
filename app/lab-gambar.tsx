/**
 * Lab Gambar AI — image forensik analyzer.
 *
 * Phase 3A (2026-06-16). User pick gambar dari galeri → upload ke
 * /api/lab/image-forensik → backend forward ke ML container di worker1-3
 * → return verdict (BUATAN AI / ASLI / DIRAGUKAN) + 12-section analysis.
 *
 * UI minimalis untuk first-pass:
 * - Big pick button kalau belum ada gambar
 * - Preview + button "Analisis"
 * - Result: verdict pill + confidence + 3 percentage (ai/real/art) bar +
 *   section list (collapsed accordion style)
 * - Reset / Pick another supaya user bisa coba multiple gambar
 *
 * Defer: history (cache last N analysis), share result, camera capture
 * (sekarang cuma galeri).
 */

import { Stack, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { analyzeImage, type ImageForensikResult } from "@/lib/api";
import { colors, font, radius, spacing, weight } from "@/lib/theme";

export default function LabGambarScreen() {
  const router = useRouter();
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImageForensikResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  async function handlePick() {
    if (busy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Izin diperlukan", "Beri akses ke foto supaya bisa pilih gambar.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 0.9,
    });
    if (res.canceled || !res.assets[0]) return;
    setPickedUri(res.assets[0].uri);
    setResult(null);
    setExpandedSections(new Set());
  }

  async function handleAnalyze() {
    if (!pickedUri || busy) return;
    setBusy(true);
    try {
      const r = await analyzeImage(pickedUri);
      setResult(r);
    } catch (err) {
      Alert.alert(
        "Analisis gagal",
        err instanceof Error ? err.message : "Coba lagi nanti.",
      );
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setPickedUri(null);
    setResult(null);
    setExpandedSections(new Set());
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const verdictColor = result
    ? result.top === "AI-generated"
      ? colors.danger
      : colors.success
    : colors.muted;

  return (
    <>
      <Stack.Screen options={{ title: "Lab Gambar AI" }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
        {/* ── Intro ────────────────────────────────────── */}
        <Text style={styles.eyebrow}>LAB GAMBAR</Text>
        <Text style={styles.headline}>Deteksi gambar buatan AI</Text>
        <Text style={styles.lede}>
          Upload gambar untuk cek apakah dibuat AI atau foto asli. Analisis 12
          dimensi: noise, frekuensi, kompresi, anatomi wajah, dll.
        </Text>

        {/* ── Picker / preview ─────────────────────────── */}
        {!pickedUri ? (
          <TouchableOpacity style={styles.pickerEmpty} onPress={handlePick} activeOpacity={0.85}>
            <Text style={styles.pickerEmptyIcon}>＋</Text>
            <Text style={styles.pickerEmptyText}>Pilih gambar dari galeri</Text>
            <Text style={styles.pickerEmptyHint}>Max 10 MB. JPG, PNG, WebP.</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.previewWrap}>
            <Image source={{ uri: pickedUri }} style={styles.preview} />
            {!result ? (
              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnGhost]}
                  onPress={handlePick}
                  disabled={busy}
                >
                  <Text style={styles.btnGhostText}>Ganti gambar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary, busy && { opacity: 0.5 }]}
                  onPress={handleAnalyze}
                  disabled={busy}
                >
                  {busy ? (
                    <ActivityIndicator color={colors.bg} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>ANALISIS</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        {/* ── Result ────────────────────────────────────── */}
        {result ? (
          <View style={styles.resultBlock}>
            <View style={[styles.verdict, { borderLeftColor: verdictColor }]}>
              <Text style={[styles.verdictLabel, { color: verdictColor }]}>
                {result.verdict}
              </Text>
              <Text style={styles.verdictConf}>
                Confidence: {result.confidence}
              </Text>
            </View>

            <View style={styles.bars}>
              <Bar label="AI-generated" value={result.ai} color={colors.danger} />
              <Bar label="Real photo" value={result.real} color={colors.success} />
              <Bar label="Artwork" value={result.art} color={colors.warning} />
            </View>

            <Text style={styles.sectionsTitle}>
              Detail Analisis ({result.sections.length})
            </Text>
            {result.sections.map((sec) => {
              const expanded = expandedSections.has(sec.key);
              const dotColor =
                sec.status === "bad"
                  ? colors.danger
                  : sec.status === "warn"
                    ? colors.warning
                    : colors.success;
              return (
                <View key={sec.key} style={styles.section}>
                  <TouchableOpacity
                    onPress={() => toggleSection(sec.key)}
                    style={styles.sectionHead}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.sectionDot, { backgroundColor: dotColor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle}>
                        {sec.n}. {sec.title}
                      </Text>
                      <Text style={styles.sectionSub}>{sec.subtitle}</Text>
                    </View>
                    <Text style={styles.sectionChevron}>{expanded ? "▴" : "▾"}</Text>
                  </TouchableOpacity>
                  {expanded ? (
                    <View style={styles.sectionBody}>
                      {sec.findings.map((f, i) => (
                        <Text key={i} style={styles.finding}>
                          • {f}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}

            <TouchableOpacity style={[styles.btn, styles.btnGhost, { marginTop: spacing.lg }]} onPress={handleReset}>
              <Text style={styles.btnGhostText}>Analisis gambar lain</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.webLink}
              onPress={() => Linking.openURL("https://senopatiacademy.id/lab-gambar")}
            >
              <Text style={styles.webLinkText}>Buka di web (full detail + history) →</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Kembali</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.bar}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{pct}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
    gap: spacing.lg,
  },
  eyebrow: {
    fontSize: font.small,
    fontWeight: weight.semibold,
    color: colors.brandStrong,
    letterSpacing: 2,
  },
  headline: {
    fontSize: font.h2,
    fontWeight: weight.semibold,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  lede: {
    fontSize: font.body,
    color: colors.body,
    lineHeight: 22,
  },

  // Picker empty state
  pickerEmpty: {
    height: 200,
    borderWidth: 2,
    borderColor: colors.line,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.panelSoft,
  },
  pickerEmptyIcon: {
    fontSize: 48,
    color: colors.brand,
    fontWeight: weight.semibold,
  },
  pickerEmptyText: {
    fontSize: font.body,
    color: colors.ink,
    fontWeight: weight.semibold,
  },
  pickerEmptyHint: {
    fontSize: font.small,
    color: colors.muted,
  },

  // Preview
  previewWrap: {
    gap: spacing.md,
  },
  preview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.panelSoft,
  },
  previewActions: {
    flexDirection: "row",
    gap: spacing.md,
  },

  // Buttons
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: colors.brand,
  },
  btnPrimaryText: {
    color: colors.bg,
    fontWeight: weight.semibold,
    letterSpacing: 1,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
  },
  btnGhostText: {
    color: colors.ink,
    fontWeight: weight.semibold,
  },

  // Result block
  resultBlock: {
    gap: spacing.md,
  },
  verdict: {
    padding: spacing.lg,
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    gap: 4,
  },
  verdictLabel: {
    fontSize: font.h3,
    fontWeight: weight.semibold,
    letterSpacing: 0.5,
  },
  verdictConf: {
    fontSize: font.small,
    color: colors.muted,
  },

  // Bars
  bars: {
    gap: spacing.md,
  },
  bar: {
    gap: spacing.xs,
  },
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barLabel: {
    fontSize: font.small,
    color: colors.ink,
    fontWeight: weight.semibold,
  },
  barValue: {
    fontSize: font.small,
    color: colors.muted,
    fontVariant: ["tabular-nums"],
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.line,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Sections
  sectionsTitle: {
    fontSize: font.small,
    fontWeight: weight.semibold,
    color: colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing.sm,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: font.body,
    color: colors.ink,
    fontWeight: weight.semibold,
  },
  sectionSub: {
    fontSize: font.small,
    color: colors.muted,
    marginTop: 2,
  },
  sectionChevron: {
    fontSize: 16,
    color: colors.muted,
  },
  sectionBody: {
    paddingBottom: spacing.md,
    paddingLeft: spacing.lg + 10,
    gap: spacing.xs,
  },
  finding: {
    fontSize: font.small,
    color: colors.body,
    lineHeight: 20,
  },

  // Footer
  webLink: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  webLinkText: {
    color: colors.brand,
    fontSize: font.small,
    fontWeight: weight.semibold,
  },
  backLink: {
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  backLinkText: {
    color: colors.muted,
    fontSize: font.small,
  },
});
