import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, Dimensions, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api, mediaUrl } from "@/src/api";
import MapView from "@/src/components/LeafletMap";
import Stars from "@/src/components/Stars";

const { width } = Dimensions.get("window");
const CARD_W = (width - spacing.lg * 2 - spacing.md) / 2;
const METHOD: Record<string, string> = { in_house: "In-House", third_party: "Third-Party", pickup: "Pick-Up" };

export default function ShopDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: shop, isLoading } = useQuery({ queryKey: ["shop", id], queryFn: () => api(`/shops/${id}`), enabled: !!id });
  const { data: products = [] } = useQuery({ queryKey: ["shop-products", id], queryFn: () => api(`/products?shop_id=${id}`), enabled: !!id });
  const { data: reviews = [] } = useQuery({ queryKey: ["shop-reviews", id], queryFn: () => api(`/shops/${id}/reviews`), enabled: !!id });

  if (isLoading || !shop) return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.hero}>
          <Image source={{ uri: mediaUrl(shop.image) }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <LinearGradient colors={["rgba(43,30,34,0.2)", "rgba(43,30,34,0.9)"]} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable testID="back-btn" onPress={() => router.back()} style={styles.circle}><Text>←</Text></Pressable>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.name}>{shop.shop_name}</Text>
            <Text style={styles.loc}>📍 {shop.location} · {shop.distance_km} km</Text>
          </View>
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Text style={styles.desc}>{shop.description}</Text>
          {(shop.rating_count > 0) && <Stars value={shop.rating_avg || 0} size={16} count={shop.rating_count} />}
          <View style={styles.methodRow}>
            {(shop.delivery_methods || []).map((m: string) => (
              <Text key={m} style={styles.methodPill}>🚚 {METHOD[m] || m}</Text>
            ))}
          </View>
          <View style={{ height: 160, borderRadius: radius.md, overflow: "hidden" }}>
            <MapView markers={[{ lat: shop.lat, lng: shop.lng, emoji: "🌸", label: shop.shop_name }]} zoom={15} />
          </View>
          <Text style={styles.sectionTitle}>Bouquets ({products.length})</Text>
        </View>

        <FlatList
          data={products}
          keyExtractor={(i: any) => i.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
          contentContainerStyle={{ gap: spacing.md }}
          ListEmptyComponent={<Text style={{ textAlign: "center", color: colors.muted }}>No bouquets yet.</Text>}
          ListFooterComponent={
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm }}>
              <Text style={styles.sectionTitle}>Customer Reviews {reviews.length ? `(${reviews.length})` : ""}</Text>
              {reviews.length === 0 && <Text style={{ color: colors.muted, fontSize: 13 }}>No reviews yet.</Text>}
              {reviews.slice(0, 10).map((r: any, i: number) => (
                <View key={i} style={styles.reviewCard} testID={`shop-review-${i}`}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewName}>{r.user_name} · {r.product_name}</Text>
                    <Stars value={r.rating} size={13} />
                  </View>
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable testID={`product-${item.id}`} onPress={() => router.push(`/(customer)/product/${item.id}` as any)} style={styles.card}>
              <Image source={{ uri: mediaUrl(item.image) }} style={styles.cardImg} contentFit="cover" />
              {(item.images?.length > 1) && <View style={styles.badge}><Text style={styles.badgeText}>360°</Text></View>}
              <View style={{ padding: spacing.sm }}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardPrice}>₱{item.price.toLocaleString()}</Text>
              </View>
            </Pressable>
          )}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  hero: { height: 240, overflow: "hidden" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: spacing.lg },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  heroInfo: { position: "absolute", bottom: spacing.lg, left: spacing.lg, right: spacing.lg },
  name: { color: "#FFFFFF", fontSize: 28, fontWeight: "300", fontStyle: "italic" },
  loc: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 2 },
  desc: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 20 },
  methodRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  methodPill: { backgroundColor: colors.brandTertiary, color: colors.onBrandTertiary, fontSize: 12, fontWeight: "700", paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, overflow: "hidden" },
  sectionTitle: { fontSize: 20, fontWeight: "300", fontStyle: "italic", color: colors.onSurface, marginTop: spacing.sm },
  card: { width: CARD_W, backgroundColor: colors.surface, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  cardImg: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceSecondary },
  badge: { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(43,30,34,0.75)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  cardName: { color: colors.onSurface, fontSize: 14, fontWeight: "600" },
  cardPrice: { color: colors.brandPrimary, fontSize: 15, fontWeight: "700", marginTop: 2 },
  reviewCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md },
  reviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  reviewName: { fontWeight: "700", color: colors.onSurface, fontSize: 12, flex: 1 },
  reviewComment: { color: colors.onSurfaceSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
});
