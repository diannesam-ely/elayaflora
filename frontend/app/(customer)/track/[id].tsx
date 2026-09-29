import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";
import MapView from "@/src/components/LeafletMap";
import LiveTrackMap from "@/src/components/LiveTrackMap";

const LABELS: Record<string, string> = {
  pending: "Order Placed", confirmed: "Confirmed", preparing: "Preparing",
  ready_for_delivery: "Ready", ready_for_pickup: "Ready for Pickup",
  handed_to_courier: "With Courier", out_for_delivery: "Out for Delivery", completed: "Completed",
};
const METHOD: Record<string, string> = { in_house: "In-House Delivery", third_party: "Third-Party Courier", pickup: "Pick-Up" };

export default function Track() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [paying, setPaying] = useState(false);

  const { data: o, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => api(`/orders/${id}`), enabled: !!id, refetchInterval: 6000 });
  const { data: track } = useQuery({ queryKey: ["track", id], queryFn: () => api(`/orders/${id}/tracking`), enabled: !!id, refetchInterval: 4000 });
  // Poll payment reconciliation while unpaid gcash
  useQuery({
    queryKey: ["pay-status", id],
    queryFn: async () => { const r = await api(`/orders/${id}/payment-status`); qc.invalidateQueries({ queryKey: ["order", id] }); return r; },
    enabled: !!o && o.payment_method === "gcash" && o.payment_status !== "paid",
    refetchInterval: 4000,
  });

  if (isLoading || !o) return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;

  const flow: string[] = o.status_flow || ["pending", "confirmed", "preparing", "out_for_delivery", "completed"];
  const stageIdx = flow.indexOf(o.status);
  const isPickup = o.delivery_method === "pickup";
  const riderEmoji = o.delivery_method === "third_party" ? "🚚" : "🛵";

  const payNow = async () => {
    setPaying(true);
    try {
      const res = await api(`/orders/${id}/pay/gcash`, { method: "POST" });
      if (res?.redirect_url) await WebBrowser.openBrowserAsync(res.redirect_url);
      await api(`/orders/${id}/payment-status`);
      qc.invalidateQueries({ queryKey: ["order", id] });
    } catch {} finally { setPaying(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.mapContainer}>
        {isPickup ? (
          <MapView markers={[{ lat: o.delivery_lat, lng: o.delivery_lng, emoji: "🏪", label: "Pick-up at shop" }]} zoom={15} />
        ) : (
          <LiveTrackMap orderId={o.id} riderEmoji={riderEmoji} />
        )}
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable testID="back-btn" onPress={() => router.replace("/(customer)/orders")} style={styles.circle}><Text>←</Text></Pressable>
          <View style={styles.statusBadge}><Text style={styles.statusText}>{LABELS[o.status] || o.status}</Text></View>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        <View style={styles.handle} />
        <Text style={styles.title}>Order {o.order_no}</Text>
        <Text style={styles.sub}>{METHOD[o.delivery_method]}{isPickup ? "" : track?.moving ? ` · Arriving in ~${track.eta_min} min` : " · ETA 25–40 min"}</Text>
        {!isPickup && track?.moving && (
          <View style={styles.liveRow} testID="live-tracking-banner">
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{riderEmoji} Rider is on the way — watch the pin move</Text>
          </View>
        )}

        {/* Payment banner */}
        <View style={[styles.payBanner, { backgroundColor: o.payment_status === "paid" ? colors.success + "18" : colors.warning + "18" }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.payTitle, { color: o.payment_status === "paid" ? colors.success : colors.warning }]}>
              {o.payment_status === "paid" ? "✓ Paid via GCash" : o.payment_method === "gcash" ? "GCash payment pending" : "Cash on Delivery"}
            </Text>
            {o.payment_ref ? <Text style={styles.payRef}>Ref: {o.payment_ref}</Text> : null}
          </View>
          {o.payment_method === "gcash" && o.payment_status !== "paid" && (
            <Pressable testID="pay-now-btn" onPress={payNow} disabled={paying} style={styles.payBtn}>
              <Text style={styles.payBtnText}>{paying ? "..." : "Pay now"}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.stepper}>
          {flow.map((s, i) => (
            <View key={s} style={styles.step}>
              <View style={[styles.dot, i <= stageIdx && { backgroundColor: colors.brandPrimary }]}>
                {i <= stageIdx && <Text style={{ color: colors.onBrandPrimary, fontSize: 10, fontWeight: "700" }}>✓</Text>}
              </View>
              <Text style={[styles.stepLabel, i === stageIdx && { color: colors.brandPrimary, fontWeight: "700" }]}>{LABELS[s] || s}</Text>
              {i < flow.length - 1 && <View style={[styles.line, i < stageIdx && { backgroundColor: colors.brandPrimary }]} />}
            </View>
          ))}
        </View>

        {!isPickup && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.info}>📍 {o.delivery_address}</Text>
            {o.rider_name ? <Text style={styles.info}>🛵 Rider: {o.rider_name}</Text> : null}
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({o.items.length})</Text>
          {o.items.map((it: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{it.name} × {it.quantity}</Text>
              <Text style={styles.itemPrice}>₱{(it.unit_price * it.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.sm, marginTop: spacing.sm }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>₱{o.total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  mapContainer: { height: "42%", backgroundColor: colors.brandTertiary },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.brandPrimary, borderRadius: radius.pill },
  statusText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: 12 },
  sheet: { flex: 1, backgroundColor: colors.surface, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  sub: { color: colors.muted, marginTop: 2 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.sm, backgroundColor: colors.brandPrimary + "14", paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, alignSelf: "flex-start" },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brandPrimary },
  liveText: { color: colors.brandPrimary, fontSize: 12, fontWeight: "700" },
  payBanner: { flexDirection: "row", alignItems: "center", padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md, gap: spacing.md },
  payTitle: { fontWeight: "800", fontSize: 14 },
  payRef: { color: colors.muted, fontSize: 11, marginTop: 2 },
  payBtn: { backgroundColor: colors.brandPrimary, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill },
  payBtnText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: 12 },
  stepper: { marginTop: spacing.lg, marginBottom: spacing.md },
  step: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 6, position: "relative" },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  stepLabel: { color: colors.onSurfaceSecondary, fontSize: 14 },
  line: { position: "absolute", left: 10, top: 28, width: 2, height: 12, backgroundColor: colors.border },
  section: { marginTop: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  sectionTitle: { fontWeight: "700", color: colors.onSurface, marginBottom: spacing.sm },
  info: { color: colors.onSurface, fontSize: 14, marginTop: 2 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  itemName: { flex: 1, color: colors.onSurface, fontSize: 13 },
  itemPrice: { color: colors.onSurface, fontWeight: "600", fontSize: 13 },
  totalLabel: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  totalPrice: { fontSize: 18, fontWeight: "700", color: colors.brandPrimary },
});
