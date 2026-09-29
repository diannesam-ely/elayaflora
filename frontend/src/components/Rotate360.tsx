import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSharedValue, runOnJS } from "react-native-reanimated";
import { colors, spacing, radius } from "@/src/theme";
import { mediaUrl } from "@/src/api";

/**
 * Interactive 360° viewer built from multiple photos of the same bouquet.
 * Drag/swipe left-right to rotate through the uploaded angles, or tap the
 * on-screen chevrons.
 *
 * IMPORTANT for Android: we render a SINGLE <Image> for the current frame and
 * force a fresh mount per frame via `key`/`recyclingKey`. expo-image on Android
 * does NOT reliably reload when only `source.uri` changes on the same mounted
 * component (it shows the old/blank image), which is why rotation appeared to
 * "do nothing". All angles are prefetched so the swap is instant.
 */
export default function Rotate360({ images, height = 360 }: { images: string[]; height?: number }) {
  const frames = useMemo(
    () => (images && images.length ? images.filter(Boolean).map((f) => mediaUrl(f)!).filter(Boolean) : []),
    [images]
  );
  const n = frames.length;
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const width = useSharedValue(1);
  const startIndex = useSharedValue(0);

  const safeIndex = n > 0 ? ((index % n) + n) % n : 0;
  const currentUri = frames[safeIndex];

  // Preload every angle so rotation is instant.
  useEffect(() => {
    if (frames.length) Image.prefetch(frames).catch(() => {});
  }, [frames]);

  const goTo = (i: number) => setIndex(n > 0 ? ((i % n) + n) % n : 0);
  const setDrag = (d: boolean) => setDragging(d);

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8]) // claim only on horizontal movement; vertical scroll passes through
    .onBegin(() => {
      startIndex.value = safeIndex;
      runOnJS(setDrag)(true);
    })
    .onUpdate((e) => {
      if (n <= 1) return;
      const perFrame = Math.max(22, Math.min(64, width.value / n));
      const delta = Math.round(-e.translationX / perFrame);
      runOnJS(goTo)(startIndex.value + delta);
    })
    .onFinalize(() => runOnJS(setDrag)(false));

  const onLayout = (e: LayoutChangeEvent) => {
    width.value = e.nativeEvent.layout.width || 1;
  };

  if (n === 0) {
    return (
      <View style={[styles.wrap, { height, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>No photos yet</Text>
      </View>
    );
  }

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.wrap, { height }]} onLayout={onLayout} testID="rotate-360">
        {/* key forces a fresh mount per frame so Android always shows the new photo */}
        <Image
          key={currentUri}
          recyclingKey={currentUri}
          source={{ uri: currentUri }}
          style={styles.frame}
          contentFit="cover"
          transition={120}
          cachePolicy="memory-disk"
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
          testID={`angle-${safeIndex}`}
        />

        {loading && (
          <View style={styles.loader} pointerEvents="none">
            <ActivityIndicator color={colors.brandPrimary} />
          </View>
        )}

        {n > 1 && (
          <>
            <View style={styles.badge} pointerEvents="none">
              <Text style={styles.badgeText}>360°</Text>
            </View>

            {/* Tap fallbacks — guarantee rotation works on every device */}
            <Pressable testID="rotate-left" onPress={() => goTo(safeIndex - 1)} style={[styles.chev, styles.chevLeft]} hitSlop={8}>
              <Text style={styles.chevText}>‹</Text>
            </Pressable>
            <Pressable testID="rotate-right" onPress={() => goTo(safeIndex + 1)} style={[styles.chev, styles.chevRight]} hitSlop={8}>
              <Text style={styles.chevText}>›</Text>
            </Pressable>

            <View style={[styles.hint, dragging && { opacity: 0 }]} pointerEvents="none">
              <Text style={styles.hintText}>↔  Drag or tap ‹ › to rotate · {safeIndex + 1}/{n}</Text>
            </View>
            <View style={styles.dots} pointerEvents="none">
              {frames.map((_, i) => (
                <View key={i} style={[styles.dot, i === safeIndex && styles.dotActive]} />
              ))}
            </View>
          </>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", overflow: "hidden", backgroundColor: colors.surfaceSecondary },
  frame: { width: "100%", height: "100%" },
  loader: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: spacing.md, left: spacing.md, backgroundColor: "rgba(43,30,34,0.72)", paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  badgeText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12, letterSpacing: 1 },
  chev: { position: "absolute", top: "50%", marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.85)", alignItems: "center", justifyContent: "center" },
  chevLeft: { left: spacing.md },
  chevRight: { right: spacing.md },
  chevText: { fontSize: 26, fontWeight: "800", color: colors.onSurface, lineHeight: 30 },
  hint: { position: "absolute", bottom: spacing.lg, alignSelf: "center", backgroundColor: "rgba(43,30,34,0.6)", paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill },
  hintText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  dots: { position: "absolute", bottom: spacing.sm, alignSelf: "center", flexDirection: "row", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: "#FFFFFF", width: 18 },
});
