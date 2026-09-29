import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";

const METHOD: Record<string, string> = { in_house: "In-House", third_party: "Third-Party", pickup: "Pick-Up" };

export default function AdminOrders() {
  const insets = useSafeAreaInsets();
  const { data: orders = [] } = useQuery({ queryKey: ["admin-orders"], queryFn: () => api("/admin/orders"), refetchInterval: 8000 });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>All Orders</Text>
        <Text style={styles.sub}>{orders.length} total across all shops</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}>
        {orders.length === 0 && <Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>No orders yet.</Text>}
        {orders.map((o: any) => (
          <View key={o.id} style={styles.card} testID={`admin-order-${o.id}`}>
            <View style={styles.rowTop}>
              <Text style={styles.orderNo}>{o.order_no}</Text>
              <Text style={styles.price}>₱{o.total.toLocaleString()}</Text>
            </View>
            <Text style={styles.meta}>{o.customer_name} · {o.items.length} items</Text>
            <View style={styles.tags}>
              <Text style={styles.tag}>{o.status.replace(/_/g, " ")}</Text>
              <Text style={styles.tag}>🚚 {METHOD[o.delivery_method] || o.delivery_method}</Text>
              <Text style={[styles.tag, { color: o.payment_status === "paid" ? colors.success : colors.warning }]}>
                {o.payment_status === "paid" ? "PAID" : (o.payment_method || "").toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontSize: 24, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  card: { padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, gap: spacing.xs },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNo: { fontWeight: "700", color: colors.onSurface, fontSize: 15 },
  price: { color: colors.brandPrimary, fontWeight: "700", fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12 },
  tags: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", marginTop: 4 },
  tag: { fontSize: 11, fontWeight: "700", color: colors.onSurfaceSecondary, backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, overflow: "hidden", textTransform: "capitalize" },
});
