import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius } from "@/src/theme";
import { mediaUrl } from "@/src/api";
import { useCart } from "@/src/cart";
export default function Cart() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, updateQty, remove, total } = useCart();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="back-btn" onPress={() => router.back()}><Text style={styles.back}>←</Text></Pressable>
        <Text style={styles.title}>Cart</Text>
        <View style={{ width: 24 }} />
      </View>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>🌸</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Pressable testID="shop-now-btn" onPress={() => router.push("/(customer)/marketplace")} style={styles.shopBtn}>
            <Text style={styles.shopBtnText}>Shop Now</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 160 }}>
            {items.map((it) => (
              <View key={it.product_id} style={styles.row}>
                <Image source={{ uri: mediaUrl(it.image) }} style={styles.img} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>{it.name}</Text>
                  {it.customization && <Text style={styles.custom}>Custom · {it.customization.flower}, {it.customization.wrap}</Text>}
                  <Text style={styles.price}>₱{it.unit_price.toLocaleString()}</Text>
                  <View style={styles.qtyCtrl}>
                    <Pressable onPress={() => updateQty(it.product_id, it.quantity - 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnT}>−</Text></Pressable>
                    <Text style={styles.qty}>{it.quantity}</Text>
                    <Pressable onPress={() => updateQty(it.product_id, it.quantity + 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnT}>+</Text></Pressable>
                  </View>
                </View>
                <Pressable testID={`remove-${it.product_id}`} onPress={() => remove(it.product_id)}><Text style={{ fontSize: 18 }}>🗑</Text></Pressable>
              </View>
            ))}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
              <Text style={styles.total}>Total</Text>
              <Text style={styles.totalPrice}>₱{total.toLocaleString()}</Text>
            </View>
            <Pressable testID="checkout-btn" onPress={() => router.push("/(customer)/checkout")} style={styles.cta}>
              <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBg}>
                <Text style={styles.ctaText}>Checkout</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  back: { fontSize: 22, color: colors.onSurface },
  title: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  emptyText: { color: colors.muted, fontSize: 15 },
  shopBtn: { paddingHorizontal: spacing.xl, paddingVertical: 12, backgroundColor: colors.brandPrimary, borderRadius: radius.pill, marginTop: spacing.md },
  shopBtnText: { color: colors.onBrandPrimary, fontWeight: "700" },
  row: { flexDirection: "row", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, alignItems: "flex-start" },
  img: { width: 72, height: 72, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  name: { fontSize: 14, fontWeight: "600", color: colors.onSurface },
  custom: { fontSize: 11, color: colors.muted, marginTop: 2 },
  price: { fontSize: 15, fontWeight: "700", color: colors.brandPrimary, marginTop: 4 },
  qtyCtrl: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm, alignSelf: "flex-start", backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  qtyBtn: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  qtyBtnT: { color: colors.brandPrimary, fontSize: 16, fontWeight: "700" },
  qty: { fontSize: 14, fontWeight: "600", color: colors.onSurface, minWidth: 20, textAlign: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 64, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  total: { fontSize: 14, color: colors.muted },
  totalPrice: { fontSize: 22, fontWeight: "700", color: colors.brandPrimary },
  cta: { borderRadius: radius.pill, overflow: "hidden" },
  ctaBg: { paddingVertical: 14, alignItems: "center" },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
