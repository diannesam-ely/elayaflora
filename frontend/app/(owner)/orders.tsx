import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";

const LABEL: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", preparing: "Preparing",
  ready_for_delivery: "Ready to Deliver", ready_for_pickup: "Ready for Pickup",
  handed_to_courier: "Handed to Courier", out_for_delivery: "Out for Delivery",
  completed: "Completed", cancelled: "Cancelled",
};
const METHOD: Record<string, string> = { in_house: "In-House Delivery", third_party: "Third-Party", pickup: "Pick-Up" };

export default function OwnerOrders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: orders = [] } = useQuery({ queryKey: ["owner-orders"], queryFn: () => api("/owner/orders"), refetchInterval: 6000 });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Customer Orders</Text>
        <Text style={styles.sub}>{orders.length} total · {orders.filter((o: any) => o.status === "pending").length} pending</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}>
        {orders.length === 0 && <Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>No orders yet today 💐</Text>}
        {orders.map((o: any) => (
          <Pressable key={o.id} testID={`order-${o.id}`} onPress={() => router.push(`/(owner)/order/${o.id}` as any)} style={styles.card}>
            <View style={styles.rowTop}>
              <View>
                <Text style={styles.orderNo}>{o.order_no}</Text>
                <Text style={styles.customer}>{o.customer_name}</Text>
              </View>
              <View style={styles.pill}><Text style={styles.pillText}>{LABEL[o.status] || o.status}</Text></View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaTag}>🚚 {METHOD[o.delivery_method] || o.delivery_method}</Text>
              <Text style={[styles.metaTag, { color: o.payment_status === "paid" ? colors.success : colors.warning }]}>
                {o.payment_status === "paid" ? "💳 Paid" : o.payment_method === "gcash" ? "GCash · unpaid" : "COD"}
              </Text>
            </View>
            <View style={styles.rowBot}>
              <Text style={styles.total}>₱{o.total.toLocaleString()} · {o.items.length} items</Text>
              <Text style={styles.manage}>Manage →</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontSize: 24, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  card: { padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, gap: spacing.sm },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderNo: { fontWeight: "700", color: colors.onSurface, fontSize: 15 },
  customer: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.brandTertiary },
  pillText: { color: colors.onBrandTertiary, fontSize: 11, fontWeight: "700" },
  metaRow: { flexDirection: "row", gap: spacing.md, flexWrap: "wrap" },
  metaTag: { color: colors.onSurfaceSecondary, fontSize: 12, fontWeight: "600" },
  rowBot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  total: { fontSize: 14, fontWeight: "700", color: colors.brandPrimary },
  manage: { color: colors.onSurfaceSecondary, fontWeight: "700", fontSize: 13 },
});
