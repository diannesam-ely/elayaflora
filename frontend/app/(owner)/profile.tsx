import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api, mediaUrl } from "@/src/api";
import { useAuth } from "@/src/auth";

const METHODS = [
  { key: "in_house", label: "In-House Delivery", desc: "Your own riders (with live tracking)" },
  { key: "third_party", label: "Third-Party", desc: "Courier partners (Lalamove/Grab-style)" },
  { key: "pickup", label: "Pick-Up", desc: "Customer collects at your shop" },
];

export default function OwnerProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, logout } = useAuth();
  const { data: shop, isLoading } = useQuery({ queryKey: ["my-shop"], queryFn: () => api("/shops/mine") });

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [methods, setMethods] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (shop && shop.id) {
      setName(shop.shop_name || ""); setDesc(shop.description || "");
      setContact(shop.contact_number || ""); setLocation(shop.location || "");
      setMethods(shop.delivery_methods || []);
    }
  }, [shop?.id]);

  const mut = useMutation({
    mutationFn: () => api("/shops/mine", { method: "PUT", body: JSON.stringify({ shop_name: name, description: desc, contact_number: contact, location, delivery_methods: methods }) }),
    onSuccess: () => { setSaved(true); qc.invalidateQueries({ queryKey: ["my-shop"] }); setTimeout(() => setSaved(false), 2000); },
  });

  const toggle = (m: string) => setMethods((cur) => cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]);

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Image source={{ uri: mediaUrl(shop?.image) }} style={styles.shopImg} contentFit="cover" />
        <Text style={styles.shopName}>{shop?.shop_name}</Text>
        <Text style={styles.shopMeta}>👤 {user?.name} · {user?.email}</Text>
      </View>
      <KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xxl }} keyboardShouldPersistTaps="handled" bottomOffset={20}>
        <Text style={styles.section}>Shop Information</Text>
        <Field label="Shop Name"><TextInput testID="shopname-input" value={name} onChangeText={setName} style={styles.input} placeholderTextColor={colors.muted} /></Field>
        <Field label="Description"><TextInput testID="desc-input" value={desc} onChangeText={setDesc} multiline style={[styles.input, { minHeight: 64 }]} placeholderTextColor={colors.muted} /></Field>
        <Field label="Contact Number"><TextInput testID="contact-input" value={contact} onChangeText={setContact} keyboardType="phone-pad" style={styles.input} placeholderTextColor={colors.muted} /></Field>
        <Field label="Location"><TextInput testID="loc-input" value={location} onChangeText={setLocation} style={styles.input} placeholderTextColor={colors.muted} /></Field>

        <Text style={styles.section}>Delivery Methods</Text>
        {METHODS.map((m) => {
          const on = methods.includes(m.key);
          return (
            <Pressable key={m.key} testID={`method-${m.key}`} onPress={() => toggle(m.key)} style={[styles.method, on && styles.methodOn]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodLabel, on && { color: colors.onBrandPrimary }]}>{m.label}</Text>
                <Text style={[styles.methodDesc, on && { color: "rgba(255,255,255,0.85)" }]}>{m.desc}</Text>
              </View>
              <View style={[styles.check, on && { backgroundColor: "#FFF" }]}>{on && <Text style={{ color: colors.brandPrimary, fontWeight: "800" }}>✓</Text>}</View>
            </Pressable>
          );
        })}

        <Pressable testID="save-shop-btn" onPress={() => mut.mutate()} disabled={mut.isPending} style={styles.saveBtn}>
          <Text style={styles.saveText}>{mut.isPending ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}</Text>
        </Pressable>

        <Pressable testID="view-permit-btn" onPress={() => {}} style={styles.permitRow}>
          <Text style={styles.permitLabel}>Business Permit</Text>
          {shop?.business_permit_url ? <Image source={{ uri: mediaUrl(shop.business_permit_url) }} style={styles.permitImg} contentFit="cover" /> : <Text style={{ color: colors.muted }}>—</Text>}
        </Pressable>

        <Pressable testID="logout-btn" onPress={async () => { await logout(); router.replace("/"); }} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={{ gap: spacing.xs }}><Text style={styles.label}>{label}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  header: { alignItems: "center", padding: spacing.lg, gap: 4, backgroundColor: colors.brandTertiary },
  shopImg: { width: 88, height: 88, borderRadius: 44, marginBottom: spacing.sm },
  shopName: { fontSize: 22, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  shopMeta: { color: colors.onSurfaceSecondary, fontSize: 12 },
  section: { fontSize: 15, fontWeight: "700", color: colors.onSurface, marginTop: spacing.sm },
  label: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "600" },
  input: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.onSurface },
  method: { flexDirection: "row", alignItems: "center", padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, gap: spacing.md },
  methodOn: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  methodLabel: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  methodDesc: { fontSize: 12, color: colors.muted, marginTop: 2 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center" },
  saveBtn: { backgroundColor: colors.brandPrimary, paddingVertical: 14, borderRadius: radius.pill, alignItems: "center", marginTop: spacing.sm },
  saveText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: 15 },
  permitRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surfaceSecondary, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.sm },
  permitLabel: { color: colors.onSurface, fontWeight: "600" },
  permitImg: { width: 60, height: 44, borderRadius: radius.sm },
  logoutBtn: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.error, alignItems: "center" },
  logoutText: { color: colors.error, fontWeight: "700" },
});
