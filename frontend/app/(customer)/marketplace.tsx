import { View, Text, StyleSheet, Pressable, FlatList, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api, mediaUrl } from "@/src/api";

const { width } = Dimensions.get("window");
const CARD_W = (width - spacing.lg * 2 - spacing.md) / 2;

export default function Marketplace() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: prods = [], isLoading } = useQuery({ queryKey: ["products", "all"], queryFn: () => api("/products?product_type=bouquet") });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="back-btn" onPress={() => router.back()}><Text style={styles.back}>←</Text></Pressable>
        <View>
          <Text style={styles.title}>Bouquets</Text>
          <Text style={styles.sub}>Fresh from local shops in Biñan</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={prods}
        keyExtractor={(i: any) => i.id}
        numColumns={2}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: spacing.md }}
        renderItem={({ item }) => (
          <Pressable testID={`product-${item.id}`} onPress={() => router.push(`/(customer)/product/${item.id}` as any)} style={styles.card}>
            <Image source={{ uri: mediaUrl(item.image) }} style={styles.img} contentFit="cover" />
            {(item.images?.length > 1) && <View style={styles.badge}><Text style={styles.badgeText}>360°</Text></View>}
            <View style={{ padding: spacing.sm, gap: 2 }}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.price}>₱{item.price.toLocaleString()}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={{ textAlign: "center", color: colors.muted, marginTop: 40 }}>{isLoading ? "Loading fresh blooms..." : "No bouquets yet"}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  back: { fontSize: 22, color: colors.onSurface },
  title: { fontSize: 24, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  sub: { color: colors.muted, fontSize: 12 },
  card: { width: CARD_W, backgroundColor: colors.surface, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  img: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceSecondary },
  badge: { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(43,30,34,0.75)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  name: { color: colors.onSurface, fontSize: 14, fontWeight: "600" },
  price: { color: colors.brandPrimary, fontSize: 15, fontWeight: "700", marginTop: 2 },
});
