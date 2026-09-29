import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

const { width } = Dimensions.get("window");

export default function AdminOverview() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: o } = useQuery({ queryKey: ["admin-overview"], queryFn: () => api("/admin/overview"), refetchInterval: 8000 });

  const cards = [
    { label: "Customers", value: o?.total_customers ?? 0, color: "#FF758C" },
    { label: "Shop Owners", value: o?.total_owners ?? 0, color: "#7B3245" },
    { label: "Orders", value: o?.total_orders ?? 0, color: "#607487" },
    { label: "Revenue", value: `₱${(o?.revenue ?? 0).toLocaleString()}`, color: "#4C7355" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <LinearGradient colors={["#2B1E22", "#4A353B"]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.badge}><Text style={styles.badgeText}>ADMIN</Text></View>
        <Text style={styles.title}>System Overview</Text>
        <Text style={styles.sub}>Welcome, {user?.name}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100, gap: spacing.md }}>
        <View style={styles.grid}>
          {cards.map((c) => (
            <View key={c.label} style={styles.card}>
              <View style={[styles.cardBar, { backgroundColor: c.color }]} />
              <Text style={styles.cardLabel}>{c.label}</Text>
              <Text style={styles.cardValue}>{c.value}</Text>
            </View>
          ))}
        </View>

        <Pressable testID="manage-owners" onPress={() => router.push("/(admin)/shop-owners")} style={styles.ownerBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ownerTitle}>Shop Owner Applications</Text>
            <Text style={styles.ownerSub}>{o?.shops_pending ?? 0} awaiting your review</Text>
          </View>
          <Text style={{ fontSize: 22 }}>→</Text>
        </Pressable>

        <Text style={styles.section}>Shop Owner Status</Text>
        <View style={styles.breakdown}>
          <View style={styles.brRow}><Text style={styles.brLabel}>⏳ Pending</Text><Text style={[styles.brVal, { color: colors.warning }]}>{o?.shops_pending ?? 0}</Text></View>
          <View style={styles.brRow}><Text style={styles.brLabel}>✅ Approved</Text><Text style={[styles.brVal, { color: colors.success }]}>{o?.shops_approved ?? 0}</Text></View>
          <View style={styles.brRow}><Text style={styles.brLabel}>❌ Rejected</Text><Text style={[styles.brVal, { color: colors.error }]}>{o?.shops_rejected ?? 0}</Text></View>
          <View style={styles.brRow}><Text style={styles.brLabel}>🏪 Total shops</Text><Text style={styles.brVal}>{o?.total_shops ?? 0}</Text></View>
        </View>

        <Text style={styles.section}>Orders</Text>
        <View style={styles.breakdown}>
          <View style={styles.brRow}><Text style={styles.brLabel}>💐 Active products</Text><Text style={styles.brVal}>{o?.total_products ?? 0}</Text></View>
          <View style={styles.brRow}><Text style={styles.brLabel}>⏳ Pending orders</Text><Text style={styles.brVal}>{o?.pending_orders ?? 0}</Text></View>
          <View style={styles.brRow}><Text style={styles.brLabel}>✅ Completed orders</Text><Text style={styles.brVal}>{o?.completed_orders ?? 0}</Text></View>
        </View>

        <Pressable testID="logout-btn" onPress={async () => { await logout(); router.replace("/"); }} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, gap: 6, overflow: "hidden" },
  badge: { alignSelf: "flex-start", backgroundColor: "rgba(255,117,140,0.2)", borderColor: "#FF758C", borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: "#FF758C", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  title: { color: "#FFFFFF", fontSize: 26, fontWeight: "300", fontStyle: "italic" },
  sub: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: { width: (width - spacing.lg * 2 - spacing.md) / 2, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, overflow: "hidden" },
  cardBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  cardLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  cardValue: { color: colors.onSurface, fontSize: 22, fontWeight: "700", marginTop: 4 },
  ownerBanner: { flexDirection: "row", alignItems: "center", padding: spacing.md, backgroundColor: colors.brandTertiary, borderRadius: radius.md },
  ownerTitle: { fontWeight: "700", color: colors.onBrandTertiary, fontSize: 15 },
  ownerSub: { color: colors.onBrandTertiary, fontSize: 12, marginTop: 2, opacity: 0.8 },
  section: { fontSize: 15, fontWeight: "700", color: colors.onSurface, marginTop: spacing.sm },
  breakdown: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, gap: 6 },
  brRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  brLabel: { color: colors.onSurface, fontSize: 14 },
  brVal: { color: colors.brandPrimary, fontWeight: "700", fontSize: 15 },
  logoutBtn: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.error, alignItems: "center" },
  logoutText: { color: colors.error, fontWeight: "700" },
});
