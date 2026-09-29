import { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api, mediaUrl } from "@/src/api";
import { uploadFile } from "@/src/upload";

export default function ShopApplication() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: existing } = useQuery({ queryKey: ["owner-application"], queryFn: () => api("/owner/application") });

  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [contact, setContact] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [location, setLocation] = useState("Biñan, Laguna");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [permit, setPermit] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const rejected = existing?.status === "rejected";

  const pickPermit = async () => {
    setErr(null);
    const res = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"], copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    try { setBusy("permit"); const up = await uploadFile(a.uri, a.name || "permit", a.mimeType || "image/jpeg"); setPermit(up.url); }
    catch (e: any) { setErr(e.message); } finally { setBusy(null); }
  };

  const pickLogo = async () => {
    setErr(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setErr("Photo permission is needed to add a shop photo."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    try { setBusy("logo"); const up = await uploadFile(a.uri, "shop.jpg", "image/jpeg"); setLogo(up.url); }
    catch (e: any) { setErr(e.message); } finally { setBusy(null); }
  };

  const useMyLocation = async () => {
    setErr(null);
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) { setErr("Location permission helps buyers find your shop."); return; }
    setBusy("loc");
    try {
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch { setErr("Could not get location"); } finally { setBusy(null); }
  };

  const mut = useMutation({
    mutationFn: () => api("/owner/application", { method: "POST", body: JSON.stringify({
      shop_name: shopName, description, business_permit_url: permit, image: logo,
      location, lat: coords?.lat, lng: coords?.lng,
      owner_full_name: ownerName, contact_number: contact, owner_address: ownerAddress,
    }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner-application"] }); qc.invalidateQueries({ queryKey: ["my-shop"] }); router.replace("/(owner)/dashboard"); },
    onError: (e: any) => setErr(e.message),
  });

  const submit = () => {
    if (!shopName || !ownerName || !contact || !ownerAddress) { setErr("Please complete all required fields."); return; }
    if (!permit) { setErr("Please upload your business permit."); return; }
    mut.mutate();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="back-btn" onPress={() => router.back()}><Text style={styles.back}>←</Text></Pressable>
        <Text style={styles.title}>Shop Application</Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xxl }} keyboardShouldPersistTaps="handled" bottomOffset={20}>
        {rejected && (
          <View style={styles.rejectBox}>
            <Text style={styles.rejectTitle}>Previous application rejected</Text>
            <Text style={styles.rejectReason}>{existing?.reject_reason}</Text>
            <Text style={styles.rejectHint}>Update your details below and re-submit for approval.</Text>
          </View>
        )}
        <Text style={styles.intro}>Tell us about your flower shop. Our admin will review and approve your application before you can sell.</Text>

        <Field label="Shop Name *"><TextInput testID="shopname-input" value={shopName} onChangeText={setShopName} placeholder="Bloom & Petal" placeholderTextColor={colors.muted} style={styles.input} /></Field>
        <Field label="Shop Description"><TextInput testID="desc-input" value={description} onChangeText={setDescription} placeholder="Handcrafted bouquets..." placeholderTextColor={colors.muted} multiline style={[styles.input, { minHeight: 70 }]} /></Field>

        <Field label="Business Permit *">
          <Pressable testID="permit-btn" onPress={pickPermit} style={styles.uploadBtn}>
            {busy === "permit" ? <ActivityIndicator color={colors.brandPrimary} /> : <Text style={styles.uploadText}>{permit ? "✓ Permit uploaded — tap to replace" : "📄 Upload business permit (image/PDF)"}</Text>}
          </Pressable>
          {permit && <Image source={{ uri: mediaUrl(permit) }} style={styles.permitPreview} contentFit="cover" />}
        </Field>

        <Field label="Shop Photo">
          <Pressable testID="logo-btn" onPress={pickLogo} style={styles.uploadBtn}>
            {busy === "logo" ? <ActivityIndicator color={colors.brandPrimary} /> : <Text style={styles.uploadText}>{logo ? "✓ Photo added — tap to replace" : "📷 Upload a shop photo"}</Text>}
          </Pressable>
        </Field>

        <Field label="Shop Location (address in Biñan) *"><TextInput testID="location-input" value={location} onChangeText={setLocation} placeholder="San Antonio, Biñan, Laguna" placeholderTextColor={colors.muted} style={styles.input} /></Field>
        <Pressable testID="gps-btn" onPress={useMyLocation} style={styles.gpsBtn}>
          {busy === "loc" ? <ActivityIndicator color={colors.onBrandTertiary} /> : <Text style={styles.gpsText}>📍 {coords ? `Pinned (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : "Use my current GPS location"}</Text>}
        </Pressable>

        <Field label="Owner's Full Name *"><TextInput testID="ownername-input" value={ownerName} onChangeText={setOwnerName} placeholder="Ana Reyes" placeholderTextColor={colors.muted} style={styles.input} /></Field>
        <Field label="Contact Number *"><TextInput testID="contact-input" value={contact} onChangeText={setContact} keyboardType="phone-pad" placeholder="0917-000-0000" placeholderTextColor={colors.muted} style={styles.input} /></Field>
        <Field label="Owner's Address *"><TextInput testID="owneraddr-input" value={ownerAddress} onChangeText={setOwnerAddress} placeholder="Poblacion, Biñan, Laguna" placeholderTextColor={colors.muted} style={styles.input} /></Field>

        {err ? <Text testID="app-error" style={styles.err}>{err}</Text> : null}

        <Pressable testID="submit-app-btn" onPress={submit} disabled={mut.isPending} style={styles.cta}>
          <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBg}>
            {mut.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaText}>Submit for Approval</Text>}
          </LinearGradient>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={{ gap: spacing.xs }}><Text style={styles.label}>{label}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  back: { fontSize: 22, color: colors.onSurface },
  title: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  intro: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  label: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "600" },
  input: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.onSurface },
  uploadBtn: { backgroundColor: colors.brandTertiary, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: colors.borderStrong, borderStyle: "dashed" },
  uploadText: { color: colors.onBrandTertiary, fontWeight: "600", fontSize: 13 },
  permitPreview: { width: "100%", height: 160, borderRadius: radius.md, marginTop: spacing.sm, backgroundColor: colors.surfaceSecondary },
  gpsBtn: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  gpsText: { color: colors.onSurfaceSecondary, fontWeight: "600", fontSize: 13 },
  err: { color: colors.error, fontSize: 13 },
  cta: { borderRadius: radius.pill, overflow: "hidden", marginTop: spacing.sm },
  ctaBg: { paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  rejectBox: { backgroundColor: colors.error + "15", borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.error },
  rejectTitle: { color: colors.error, fontWeight: "800", fontSize: 14 },
  rejectReason: { color: colors.onSurface, fontSize: 13, marginTop: 4 },
  rejectHint: { color: colors.muted, fontSize: 12, marginTop: 6 },
});
