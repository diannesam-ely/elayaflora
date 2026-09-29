import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api, mediaUrl } from "@/src/api";
import { useAuth } from "@/src/auth";
import { useCart } from "@/src/cart";

const { width } = Dimensions.get("window");
const CARD_W = width * 0.72;

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { items } = useCart();

  const { data: bouquets = [] } = useQuery({ queryKey: ["p", "bouquet"], queryFn: () => api("/products?product_type=bouquet") });
  const { data: shops = [] } = useQuery({ queryKey: ["shops"], queryFn: () => api("/shops") });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
          <Image source={{ uri: "https://images.unsplash.com/photo-1523693916903-027d144a2b7d?w=1200" }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <LinearGradient colors={["rgba(255,117,140,0.15)", "rgba(43,30,34,0.85)"]} style={StyleSheet.absoluteFillObject} />
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroHi}>Hello, {user?.name?.split(" ")[0] || "Friend"} 🌷</Text>
              <Text style={styles.heroLoc}>📍 Biñan, Laguna</Text>
            </View>
            <Pressable testID="cart-icon" onPress={() => router.push("/(customer)/cart")} style={styles.cartBtn}>
              <Text style={{ fontSize: 20 }}>🛒</Text>
              {items.length > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{items.length}</Text></View>}
            </Pressable>
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>Bloom-to-door,{"\n"}crafted just for you.</Text>
            <Pressable testID="hero-shop-btn" onPress={() => router.push("/(customer)/marketplace")} style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Browse Bouquets →</Text>
            </Pressable>
          </View>
        </View>

        {/* 360 highlight */}
        <Pressable testID="feature-360" onPress={() => bouquets[0] && router.push(`/(customer)/product/${bouquets[0].id}` as any)} style={styles.featureCard}>
          <LinearGradient colors={["#7B3245", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featureBg}>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTag}>NEW</Text>
              <Text style={styles.featureTitle}>Interactive 360° View</Text>
              <Text style={styles.featureDesc}>Swipe to inspect every bouquet from all angles before you buy.</Text>
            </View>
            <Text style={{ fontSize: 44 }}>🔄</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Curated Bouquets</Text>
            <Pressable onPress={() => router.push("/(customer)/marketplace")}><Text style={styles.link}>See all</Text></Pressable>
          </View>
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={bouquets} keyExtractor={(i: any) => i.id}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            renderItem={({ item }) => (
              <Pressable testID={`bouquet-${item.id}`} onPress={() => router.push(`/(customer)/product/${item.id}` as any)} style={styles.bqCard}>
                <Image source={{ uri: mediaUrl(item.image) }} style={styles.bqImg} contentFit="cover" />
                <LinearGradient colors={["transparent", "rgba(43,30,34,0.85)"]} style={styles.bqScrim} />
                {(item.images?.length > 1) && <View style={styles.badge360}><Text style={styles.badge360Text}>360°</Text></View>}
                <View style={styles.bqInfo}>
                  <Text style={styles.bqName}>{item.name}</Text>
                  <Text style={styles.bqPrice}>₱{item.price.toLocaleString()}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Flower Shops in Biñan</Text>
            <Pressable onPress={() => router.push("/(customer)/shops")}><Text style={styles.link}>Map</Text></Pressable>
          </View>
          {shops.map((s: any) => (
            <Pressable key={s.id} testID={`shop-${s.id}`} onPress={() => router.push(`/(customer)/shop/${s.id}` as any)} style={styles.shopRow}>
              <Image source={{ uri: mediaUrl(s.image) }} style={styles.shopImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{s.shop_name}</Text>
                <Text style={styles.shopDesc} numberOfLines={1}>{s.description}</Text>
                <Text style={styles.shopMeta}>📍 {s.location} · {s.distance_km} km · {s.product_count} items</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 300, overflow: "hidden", paddingHorizontal: spacing.lg },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroHi: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  heroLoc: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  cartBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  cartBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#FF758C", minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  cartBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  heroBody: { marginTop: "auto", paddingBottom: spacing.lg, gap: spacing.md },
  heroTitle: { color: "#FFFFFF", fontSize: 32, fontWeight: "300", fontStyle: "italic", lineHeight: 38 },
  heroCta: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" },
  heroCtaText: { color: "#FFFFFF", fontWeight: "600" },
  featureCard: { marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: radius.lg, overflow: "hidden" },
  featureBg: { padding: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.md },
  featureTag: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  featureTitle: { color: "#FFFFFF", fontSize: 21, fontWeight: "700", marginTop: 2 },
  featureDesc: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 4 },
  section: { marginTop: spacing.xl, gap: spacing.md },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg },
  sectionTitle: { fontSize: 22, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  link: { color: colors.brandPrimary, fontWeight: "600", fontSize: 13 },
  bqCard: { width: CARD_W, height: 260, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surfaceSecondary },
  bqImg: { width: "100%", height: "100%" },
  bqScrim: { position: "absolute", left: 0, right: 0, bottom: 0, top: "50%" },
  badge360: { position: "absolute", top: spacing.sm, right: spacing.sm, backgroundColor: "rgba(43,30,34,0.75)", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  badge360Text: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  bqInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.md },
  bqName: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  bqPrice: { color: "#FFFFFF", fontSize: 15, marginTop: 2, opacity: 0.9 },
  shopRow: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, alignItems: "center" },
  shopImg: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary },
  shopName: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  shopDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  shopMeta: { color: colors.onSurfaceSecondary, fontSize: 11, marginTop: 4 },
});
