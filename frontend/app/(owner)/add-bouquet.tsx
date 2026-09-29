import { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api, mediaUrl } from "@/src/api";
import { uploadFile } from "@/src/upload";

export default function AddBouquet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [flowers, setFlowers] = useState("");
  const [count, setCount] = useState("");
  const [wrapping, setWrapping] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addPhotos = async () => {
    setErr(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setErr("Photo permission is needed to add bouquet angles."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 8, quality: 0.7 });
    if (res.canceled || !res.assets?.length) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const a of res.assets) {
        const up = await uploadFile(a.uri, "angle.jpg", "image/jpeg");
        uploaded.push(up.url);
      }
      setImages((cur) => [...cur, ...uploaded].slice(0, 8));
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  const removeImg = (i: number) => setImages((cur) => cur.filter((_, idx) => idx !== i));

  const mut = useMutation({
    mutationFn: () => api("/owner/products", { method: "POST", body: JSON.stringify({
      name, description, images,
      flowers_included: flowers ? flowers.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      number_of_flowers: count ? parseInt(count) : undefined,
      wrapping: wrapping || undefined,
      price: parseFloat(price || "0"), stock: stock ? parseInt(stock) : 0, availability: true,
    }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-products"] }); router.back(); },
    onError: (e: any) => setErr(e.message),
  });

  const submit = () => {
    if (!name || !price) { setErr("Bouquet name and price are required."); return; }
    if (images.length < 2) { setErr("Add at least 2 photos so customers can rotate the 360° view."); return; }
    mut.mutate();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="back-btn" onPress={() => router.back()}><Text style={styles.back}>←</Text></Pressable>
        <Text style={styles.title}>Add Bouquet</Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xxl }} keyboardShouldPersistTaps="handled" bottomOffset={20}>
        <Text style={styles.label}>360° Photos (front, sides, back...)</Text>
        <Text style={styles.hint}>Upload 2–8 photos of the same bouquet from different angles. Customers swipe to rotate.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
          {images.map((img, i) => (
            <View key={i} style={styles.thumbWrap}>
              <Image source={{ uri: mediaUrl(img) }} style={styles.thumb} contentFit="cover" />
              <Pressable testID={`rm-img-${i}`} onPress={() => removeImg(i)} style={styles.thumbX}><Text style={{ color: "#FFF", fontWeight: "800" }}>✕</Text></Pressable>
              <View style={styles.thumbNum}><Text style={styles.thumbNumText}>{i + 1}</Text></View>
            </View>
          ))}
          <Pressable testID="add-photos-btn" onPress={addPhotos} style={styles.addThumb}>
            {busy ? <ActivityIndicator color={colors.brandPrimary} /> : <Text style={styles.addThumbText}>＋{"\n"}Add</Text>}
          </Pressable>
        </ScrollView>

        <Field label="Bouquet Name *"><TextInput testID="name-input" value={name} onChangeText={setName} placeholder="Romantic Red Roses" placeholderTextColor={colors.muted} style={styles.input} /></Field>
        <Field label="Description"><TextInput testID="desc-input" value={description} onChangeText={setDescription} placeholder="A classic dozen roses..." placeholderTextColor={colors.muted} multiline style={[styles.input, { minHeight: 70 }]} /></Field>
        <Field label="Flowers Included (comma-separated)"><TextInput testID="flowers-input" value={flowers} onChangeText={setFlowers} placeholder="Red Rose, Baby's Breath" placeholderTextColor={colors.muted} style={styles.input} /></Field>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <Field label="No. of Flowers" flex><TextInput testID="count-input" value={count} onChangeText={setCount} keyboardType="number-pad" placeholder="12" placeholderTextColor={colors.muted} style={styles.input} /></Field>
          <Field label="Wrapping" flex><TextInput testID="wrap-input" value={wrapping} onChangeText={setWrapping} placeholder="White Wrapper" placeholderTextColor={colors.muted} style={styles.input} /></Field>
        </View>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <Field label="Price (₱) *" flex><TextInput testID="price-input" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="850" placeholderTextColor={colors.muted} style={styles.input} /></Field>
          <Field label="Stock" flex><TextInput testID="stock-input" value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="10" placeholderTextColor={colors.muted} style={styles.input} /></Field>
        </View>

        {err ? <Text testID="add-error" style={styles.err}>{err}</Text> : null}

        <Pressable testID="save-btn" onPress={submit} disabled={mut.isPending} style={styles.cta}>
          <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBg}>
            {mut.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaText}>Publish Bouquet</Text>}
          </LinearGradient>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return <View style={[{ gap: spacing.xs }, flex && { flex: 1 }]}><Text style={styles.label}>{label}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  back: { fontSize: 22, color: colors.onSurface },
  title: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  label: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "600" },
  hint: { color: colors.muted, fontSize: 12, marginTop: -6 },
  input: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.onSurface },
  thumbWrap: { width: 90, height: 90, borderRadius: radius.md, overflow: "hidden" },
  thumb: { width: "100%", height: "100%", backgroundColor: colors.surfaceSecondary },
  thumbX: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  thumbNum: { position: "absolute", bottom: 4, left: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  thumbNumText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  addThumb: { width: 90, height: 90, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: colors.brandTertiary },
  addThumbText: { color: colors.onBrandTertiary, fontWeight: "700", textAlign: "center", fontSize: 12 },
  err: { color: colors.error, fontSize: 13 },
  cta: { borderRadius: radius.pill, overflow: "hidden", marginTop: spacing.sm },
  ctaBg: { paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
