import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api, mediaUrl } from "@/src/api";
import MapView from "@/src/components/LeafletMap";

export default function Shops() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [locMsg, setLocMsg] = useState<string | null>(null);

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["shops", coords?.lat, coords?.lng],
    queryFn: () => api(coords ? `/shops?lat=${coords.lat}&lng=${coords.lng}` : "/shops"),
  });

  const locate = async () => {
    setLocMsg(null);
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      setLocMsg(perm.canAskAgain ? "Allow location to sort shops by distance." : "Enable location in Settings to use GPS.");
      return;
    }
    setLocBusy(true);
    try { const pos = await Location.getCurrentPositionAsync({}); setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); }
    catch { setLocMsg("Could not get your location."); } finally { setLocBusy(false); }
  };

  const markers = shops.map((s: any) => ({ lat: s.lat, lng: s.lng, emoji: "🌸", label: s.shop_name }));
  if (coords) markers.push({ lat: coords.lat, lng: coords.lng, emoji: "📍", label: "You" });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Flower Shops</Text>
        <Text style={styles.sub}>All shops in Biñan, Laguna</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.mapWrap}>
          <MapView markers={markers} />
        </View>
        <Pressable testID="gps-btn" onPress={locate} style={styles.gpsBtn}>
          {locBusy ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.gpsText}>{coords ? "📍 Location on · sorted by distance" : "📍 Use my GPS to sort by nearest"}</Text>}
        </Pressable>
        {locMsg ? <Text style={styles.locMsg}>{locMsg}</Text> : null}

        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {isLoading && <ActivityIndicator color={colors.brandPrimary} />}
          {shops.map((s: any) => (
            <Pressable key={s.id} testID={`shop-${s.id}`} onPress={() => router.push(`/(customer)/shop/${s.id}` as any)} style={styles.card}>
              <Image source={{ uri: mediaUrl(s.image) }} style={styles.img} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{s.shop_name}</Text>
                <Text style={styles.desc} numberOfLines={2}>{s.description}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaPill}>📍 {s.distance_km} km</Text>
                  <Text style={styles.metaPill}>💐 {s.product_count} items</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontSize: 28, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  mapWrap: { height: 240, backgroundColor: colors.surfaceTertiary },
  gpsBtn: { margin: spacing.lg, marginBottom: spacing.xs, backgroundColor: colors.brandPrimary, paddingVertical: 12, borderRadius: radius.pill, alignItems: "center" },
  gpsText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: 13 },
  locMsg: { color: colors.warning, fontSize: 12, textAlign: "center", paddingHorizontal: spacing.lg },
  card: { flexDirection: "row", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, alignItems: "center" },
  img: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  name: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  desc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: spacing.sm, marginTop: 6 },
  metaPill: { color: colors.onBrandTertiary, backgroundColor: colors.brandTertiary, fontSize: 11, fontWeight: "700", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, overflow: "hidden" },
});
