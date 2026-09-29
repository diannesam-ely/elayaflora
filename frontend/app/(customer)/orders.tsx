import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api, mediaUrl } from "@/src/api";
import { useCart } from "@/src/cart";

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#B87B41" },
  confirmed: { label: "Confirmed", color: "#607487" },
  preparing: { label: "Preparing", color: "#7B3245" },
  ready_for_delivery: { label: "Ready", color: "#4C7355" },
  out_for_delivery: { label: "Out for Delivery", color: "#FF758C" },
  completed: { label: "Delivered", color: "#4C7355" },
  cancelled: { label: "Cancelled", color: "#C4324B" },
};

export default function Orders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { add, clear } = useCart();
  const { data: orders = [], isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: () => api("/orders/mine"), refetchInterval: 8000 });

  const reorder = (o: any) => {
    clear();
    o.items.forEach((i: any) => add({
      product_id: i.product_id, product_type: "bouquet", shop_id: i.shop_id,
      name: i.name, image: i.image, unit_price: i.unit_price, quantity: i.quantity,
    }));
    router.push("/(customer)/cart");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.sub}>Track your bouquet journey</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}>
        {orders.length === 0 && !isLoading && (
          <Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>No orders yet</Text>
        )}
        {orders.map((o: any) => {
          const meta = STATUS_META[o.status] || STATUS_META.pending;
          return (
            <Pressable key={o.id} testID={`order-${o.id}`} onPress={() => router.push(`/(customer)/track/${o.id}` as any)} style={styles.card}>
              <View style={styles.rowTop}>
                <Text style={styles.orderNo}>{o.order_no}</Text>
                <View style={[styles.pill, { backgroundColor: meta.color + "20", borderColor: meta.color }]}>
                  <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>
              <View style={styles.itemsRow}>
                {o.items.slice(0, 3).map((i: any) => (
                  <Image key={i.product_id} source={{ uri: mediaUrl(i.image) }} style={styles.itemImg} contentFit="cover" />
                ))}
                {o.items.length > 3 && (
                  <View style={[styles.itemImg, { alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={{ color: colors.muted, fontWeight: "700" }}>+{o.items.length - 3}</Text>
                  </View>
                )}
              </View>
              <View style={styles.rowBot}>
                <Text style={styles.addr} numberOfLines={1}>📍 {o.delivery_address || "Pick-up"}</Text>
                <Text style={styles.price}>₱{o.total.toLocaleString()}</Text>
              </View>
              <Pressable testID={`reorder-${o.id}`} onPress={() => reorder(o)} style={styles.reorderBtn}>
                <Text style={styles.reorderText}>🔁 Reorder</Text>
              </Pressable>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontSize: 28, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  card: { padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, gap: spacing.sm },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNo: { fontWeight: "700", color: colors.onSurface, fontSize: 15 },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
  pillText: { fontSize: 11, fontWeight: "700" },
  itemsRow: { flexDirection: "row", gap: spacing.sm },
  itemImg: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  rowBot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addr: { flex: 1, color: colors.muted, fontSize: 12 },
  price: { color: colors.brandPrimary, fontWeight: "700", fontSize: 15 },
  reorderBtn: { alignSelf: "flex-start", backgroundColor: colors.brandTertiary, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, marginTop: 2 },
  reorderText: { color: colors.onBrandTertiary, fontWeight: "800", fontSize: 12 },
});
