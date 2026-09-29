import { useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, Modal, TextInput, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api, mediaUrl } from "@/src/api";

export default function MyProducts() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({ queryKey: ["my-products"], queryFn: () => api("/owner/products") });
  const delMut = useMutation({ mutationFn: (id: string) => api(`/owner/products/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["my-products"] }) });

  const [restock, setRestock] = useState<any | null>(null);
  const [stockVal, setStockVal] = useState("");

  const stockMut = useMutation({
    mutationFn: () => api(`/owner/products/${restock.id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: restock.name, category: restock.category, description: restock.description,
        image: restock.image, images: restock.images, price: restock.price,
        stock: Math.max(0, parseInt(stockVal || "0")), availability: true,
        colors: restock.colors, flowers_included: restock.flowers_included,
        number_of_flowers: restock.number_of_flowers, wrapping: restock.wrapping,
        ribbon: restock.ribbon, style: restock.style,
      }),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-products"] }); setRestock(null); },
  });

  const openRestock = (item: any) => { setRestock(item); setStockVal(String(item.stock ?? 0)); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>My Bouquets</Text>
        <Text style={styles.sub}>{products.length} ready-made bouquet{products.length === 1 ? "" : "s"}</Text>
      </View>
      <FlatList
        data={products}
        keyExtractor={(i: any) => i.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 140 }}
        ListEmptyComponent={<Text style={{ textAlign: "center", color: colors.muted, marginTop: 40 }}>{isLoading ? "Loading..." : "No bouquets yet — add your first!"}</Text>}
        renderItem={({ item }) => {
          const stock = item.stock ?? 0;
          const out = stock <= 0;
          const low = stock > 0 && stock <= 5;
          const stockColor = out ? colors.error : low ? colors.warning : colors.onSurfaceSecondary;
          return (
            <View style={styles.card}>
              <Image source={{ uri: mediaUrl(item.image) }} style={styles.img} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <View style={styles.badge360}><Text style={styles.badge360Text}>{(item.images?.length || 1)} angles · 360°</Text></View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>₱{item.price.toLocaleString()}</Text>
                <View style={styles.stockRow}>
                  <Text style={[styles.stockText, { color: stockColor }]}>
                    {out ? "⚠️ Out of stock" : low ? `⚠️ Low: ${stock} left` : `Stock: ${stock}`}
                  </Text>
                  <Pressable testID={`restock-${item.id}`} onPress={() => openRestock(item)} style={styles.restockBtn}>
                    <Text style={styles.restockText}>Restock</Text>
                  </Pressable>
                </View>
              </View>
              <Pressable testID={`delete-${item.id}`} onPress={() => delMut.mutate(item.id)} style={styles.trashBtn}><Text style={{ fontSize: 18 }}>🗑</Text></Pressable>
            </View>
          );
        }}
      />

      <Modal visible={!!restock} transparent animationType="slide" onRequestClose={() => setRestock(null)}>
        <Pressable style={styles.modalBg} onPress={() => setRestock(null)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Restock “{restock?.name}”</Text>
          <Text style={styles.sheetSub}>Set the number of bouquets available.</Text>
          <View style={styles.stepper}>
            <Pressable testID="stock-minus" onPress={() => setStockVal(String(Math.max(0, (parseInt(stockVal || "0") || 0) - 1)))} style={styles.stepBtn}><Text style={styles.stepBtnT}>−</Text></Pressable>
            <TextInput testID="stock-input" value={stockVal} onChangeText={setStockVal} keyboardType="number-pad" style={styles.stockInput} />
            <Pressable testID="stock-plus" onPress={() => setStockVal(String((parseInt(stockVal || "0") || 0) + 1))} style={styles.stepBtn}><Text style={styles.stepBtnT}>+</Text></Pressable>
          </View>
          <Pressable testID="save-stock-btn" onPress={() => stockMut.mutate()} disabled={stockMut.isPending} style={styles.saveBtn}>
            <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBg}>
              {stockMut.isPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Update Stock</Text>}
            </LinearGradient>
          </Pressable>
        </View>
      </Modal>

      <View style={[styles.fabRow, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable testID="add-bouquet-fab" onPress={() => router.push("/(owner)/add-bouquet")} style={styles.fab}>
          <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fabBg}>
            <Text style={styles.fabText}>＋ Add Bouquet</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontSize: 24, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  card: { flexDirection: "row", padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, gap: spacing.md, alignItems: "center" },
  img: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  badge360: { alignSelf: "flex-start", backgroundColor: colors.brandTertiary, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  badge360Text: { color: colors.onBrandTertiary, fontSize: 10, fontWeight: "700" },
  name: { fontSize: 15, fontWeight: "600", color: colors.onSurface, marginTop: 4 },
  price: { fontSize: 13, color: colors.onSurfaceSecondary, marginTop: 2 },
  stockRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  stockText: { fontSize: 12, fontWeight: "700" },
  restockBtn: { backgroundColor: colors.brandTertiary, paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill },
  restockText: { color: colors.onBrandTertiary, fontSize: 11, fontWeight: "800" },
  trashBtn: { padding: spacing.sm },
  fabRow: { position: "absolute", left: 0, right: 0, bottom: 64, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  fab: { borderRadius: radius.pill, overflow: "hidden" },
  fabBg: { paddingVertical: 14, alignItems: "center" },
  fabText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  modalBg: { flex: 1, backgroundColor: "rgba(43,30,34,0.5)" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.onSurface, textAlign: "center" },
  sheetSub: { color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 4 },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg, marginVertical: spacing.lg },
  stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  stepBtnT: { fontSize: 24, color: colors.brandPrimary, fontWeight: "700" },
  stockInput: { minWidth: 80, textAlign: "center", fontSize: 28, fontWeight: "800", color: colors.onSurface, borderBottomWidth: 2, borderBottomColor: colors.border, paddingVertical: 4 },
  saveBtn: { borderRadius: radius.pill, overflow: "hidden" },
  saveBg: { paddingVertical: 15, alignItems: "center" },
  saveText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
