import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: notifs = [] } = useQuery({ queryKey: ["cust-notifs"], queryFn: () => api("/notifications"), refetchInterval: 10000 });

  const items = [
    { icon: "❤️", label: "Favorites", onPress: () => router.push("/(customer)/favorites") },
    { icon: "🛒", label: "My Cart", onPress: () => router.push("/(customer)/cart") },
    { icon: "📦", label: "Order History", onPress: () => router.push("/(customer)/orders") },
    { icon: "🗺️", label: "Shops in Biñan", onPress: () => router.push("/(customer)/shops") },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.avatar}><Text style={{ fontSize: 36 }}>👤</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}><Text style={styles.roleText}>Customer</Text></View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 100 }}>
        {items.map((it) => (
          <Pressable key={it.label} testID={`profile-${it.label}`} onPress={it.onPress} style={styles.row}>
            <Text style={{ fontSize: 20 }}>{it.icon}</Text>
            <Text style={styles.rowLabel}>{it.label}</Text>
            <Text style={{ color: colors.muted }}>›</Text>
          </Pressable>
        ))}

        <Text style={styles.section}>Notifications</Text>
        {notifs.length === 0 && <Text style={{ color: colors.muted, fontSize: 13 }}>No notifications yet.</Text>}
        {notifs.slice(0, 6).map((n: any) => (
          <View key={n.id} style={[styles.notif, !n.read && styles.notifUnread]} testID={`notif-${n.id}`}>
            <Text style={styles.notifTitle}>{n.title}</Text>
            <Text style={styles.notifBody}>{n.body}</Text>
          </View>
        ))}

        <Pressable testID="logout-btn" onPress={async () => { await logout(); router.replace("/"); }} style={[styles.row, { marginTop: spacing.lg }]}>
          <Text style={{ fontSize: 20 }}>🚪</Text>
          <Text style={[styles.rowLabel, { color: colors.error }]}>Logout</Text>
          <Text style={{ color: colors.muted }}>›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", padding: spacing.lg, gap: spacing.xs, backgroundColor: colors.brandTertiary },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 22, fontWeight: "700", color: colors.onSurface, marginTop: spacing.sm },
  email: { color: colors.muted, fontSize: 13 },
  roleBadge: { backgroundColor: colors.brandPrimary, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, marginTop: spacing.xs },
  roleText: { color: colors.onBrandPrimary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md },
  rowLabel: { flex: 1, color: colors.onSurface, fontSize: 15, fontWeight: "600" },
  section: { fontSize: 15, fontWeight: "700", color: colors.onSurface, marginTop: spacing.md },
  notif: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md },
  notifUnread: { borderLeftWidth: 3, borderLeftColor: colors.brandPrimary },
  notifTitle: { fontWeight: "700", color: colors.onSurface, fontSize: 13 },
  notifBody: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
