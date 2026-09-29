import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api, mediaUrl } from "@/src/api";

const FILTERS = ["all", "pending", "approved", "rejected"] as const;
const STATUS_COLOR: Record<string, string> = { pending: colors.warning, approved: colors.success, rejected: colors.error };

export default function ShopOwners() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data: shops = [] } = useQuery({ queryKey: ["admin-owners"], queryFn: () => api("/admin/shop-owners"), refetchInterval: 8000 });
  const approveMut = useMutation({ mutationFn: (sid: string) => api(`/admin/shop-owners/${sid}/approve`, { method: "PATCH" }), onSuccess: () => refresh() });
  const rejectMut = useMutation({ mutationFn: (sid: string) => api(`/admin/shop-owners/${sid}/reject`, { method: "PATCH", body: JSON.stringify({ reason: reason || "Application did not meet requirements." }) }), onSuccess: () => { setReason(""); refresh(); } });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-owners"] }); qc.invalidateQueries({ queryKey: ["admin-overview"] }); };

  const filtered = filter === "all" ? shops : shops.filter((s: any) => s.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Shop Owners</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FILTERS.map((f) => {
            const count = f === "all" ? shops.length : shops.filter((s: any) => s.status === f).length;
            return (
              <Pressable key={f} testID={`filter-${f}`} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipActive]}>
                <Text style={[styles.chipText, filter === f && { color: colors.onBrandPrimary }]}>{f[0].toUpperCase() + f.slice(1)} ({count})</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}>
        {filtered.length === 0 && <Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>No applications here.</Text>}
        {filtered.map((s: any) => {
          const open = openId === s.id;
          return (
            <View key={s.id} style={styles.card} testID={`owner-${s.id}`}>
              <Pressable onPress={() => setOpenId(open ? null : s.id)} style={styles.cardHead}>
                <Image source={{ uri: mediaUrl(s.image) }} style={styles.logo} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{s.shop_name}</Text>
                  <Text style={styles.owner}>{s.owner_full_name} · {s.contact_number}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: (STATUS_COLOR[s.status] || colors.muted) + "22" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[s.status] || colors.muted }]}>{s.status}</Text>
                </View>
              </Pressable>

              {open && (
                <View style={styles.details}>
                  <Detail k="Description" v={s.description || "—"} />
                  <Detail k="Shop Location" v={s.location} />
                  <Detail k="Owner Email" v={s.owner_email || "—"} />
                  <Detail k="Owner Address" v={s.owner_address} />
                  <Detail k="Products" v={String(s.product_count)} />
                  {s.reject_reason ? <Detail k="Reject Reason" v={s.reject_reason} /> : null}

                  <Text style={styles.permitLabel}>Business Permit</Text>
                  {s.business_permit_url
                    ? <Image source={{ uri: mediaUrl(s.business_permit_url) }} style={styles.permit} contentFit="cover" />
                    : <Text style={{ color: colors.muted }}>No permit uploaded</Text>}

                  {s.status !== "approved" && (
                    <>
                      <TextInput testID={`reason-${s.id}`} value={reason} onChangeText={setReason} placeholder="Rejection reason (optional)" placeholderTextColor={colors.muted} style={styles.reasonInput} />
                      <View style={styles.actionRow}>
                        <Pressable testID={`reject-${s.id}`} onPress={() => rejectMut.mutate(s.id)} style={[styles.actBtn, { backgroundColor: colors.error }]}>
                          <Text style={styles.actText}>Reject</Text>
                        </Pressable>
                        <Pressable testID={`approve-${s.id}`} onPress={() => approveMut.mutate(s.id)} style={[styles.actBtn, { backgroundColor: colors.success }]}>
                          <Text style={styles.actText}>Approve</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                  {s.status === "approved" && (
                    <Pressable testID={`reject-${s.id}`} onPress={() => rejectMut.mutate(s.id)} style={[styles.actBtn, { backgroundColor: colors.error, marginTop: spacing.sm }]}>
                      <Text style={styles.actText}>Revoke / Reject</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return <View style={styles.kv}><Text style={styles.k}>{k}</Text><Text style={styles.v}>{v}</Text></View>;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontSize: 24, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  chipRow: { paddingVertical: spacing.md, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, height: 36, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, flexShrink: 0 },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: 13, color: colors.onSurfaceSecondary, fontWeight: "600" },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, overflow: "hidden" },
  cardHead: { flexDirection: "row", alignItems: "center", padding: spacing.md, gap: spacing.md },
  logo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  name: { fontWeight: "700", color: colors.onSurface, fontSize: 15 },
  owner: { color: colors.muted, fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "capitalize" },
  details: { padding: spacing.md, paddingTop: 0, gap: 6, borderTopWidth: 1, borderTopColor: colors.divider },
  kv: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, marginTop: spacing.xs },
  k: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  v: { color: colors.onSurface, fontSize: 12, flexShrink: 1, textAlign: "right" },
  permitLabel: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "700", marginTop: spacing.sm },
  permit: { width: "100%", height: 180, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  reasonInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, marginTop: spacing.sm, color: colors.onSurface },
  actionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  actBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.pill, alignItems: "center" },
  actText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
});
