import { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from "react-native";
import { Image } from "expo-image";
import { colors, spacing, radius } from "@/src/theme";
import { mediaUrl } from "@/src/api";

/**
 * Interactive 360° viewer built from multiple photos of the same bouquet.
 * Drag/swipe left-right to rotate through the angles (front, sides, back...).
 */
export default function Rotate360({ images, height = 360 }: { images: string[]; height?: number }) {
  const frames = useMemo(() => (images && images.length ? images : []), [images]);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const widthRef = useRef(1);
  const startIndex = useRef(0);

  const n = frames.length;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => n > 1,
      onMoveShouldSetPanResponder: (_e, g) => n > 1 && Math.abs(g.dx) > 2,
      onPanResponderGrant: () => {
        setDragging(true);
        startIndex.current = indexRef.current;
      },
      onPanResponderMove: (_e, g) => {
        const perFrame = widthRef.current / Math.max(n, 6);
        const delta = Math.round(-g.dx / perFrame);
        let next = (startIndex.current + delta) % n;
        if (next < 0) next += n;
        setIndex(next);
      },
      onPanResponderRelease: () => setDragging(false),
      onPanResponderTerminate: () => setDragging(false),
    }),
  ).current;

  // keep a ref mirror of index for gesture math
  const indexRef = useRef(0);
  indexRef.current = index;

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width || 1;
  };

  if (n === 0) {
    return <View style={[styles.wrap, { height, backgroundColor: colors.surfaceSecondary }]} />;
  }

  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout} {...pan.panHandlers} testID="rotate-360">
      {/* preload all frames so rotation is instant */}
      {frames.map((f, i) => (
        <Image
          key={i}
          source={{ uri: mediaUrl(f) }}
          style={[StyleSheet.absoluteFillObject, { opacity: i === index ? 1 : 0 }]}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
        />
      ))}

      {n > 1 && (
        <>
          <View style={styles.badge} pointerEvents="none">
            <Text style={styles.badgeText}>360°</Text>
          </View>
          <View style={[styles.hint, dragging && { opacity: 0 }]} pointerEvents="none">
            <Text style={styles.hintText}>↔  Drag to rotate</Text>
          </View>
          <View style={styles.dots} pointerEvents="none">
            {frames.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", overflow: "hidden", backgroundColor: colors.surfaceSecondary },
  badge: { position: "absolute", top: spacing.md, left: spacing.md, backgroundColor: "rgba(43,30,34,0.72)", paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  badgeText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12, letterSpacing: 1 },
  hint: { position: "absolute", bottom: spacing.lg, alignSelf: "center", backgroundColor: "rgba(43,30,34,0.6)", paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill },
  hintText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  dots: { position: "absolute", bottom: spacing.sm, alignSelf: "center", flexDirection: "row", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: "#FFFFFF", width: 18 },
});
