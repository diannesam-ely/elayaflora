import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: mediaUrl(item.image) }} style={styles.img} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <View style={styles.badge360}><Text style={styles.badge360Text}>{(item.images?.length || 1)} angles · 360°</Text></View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>₱{item.price.toLocaleString()} · Stock: {item.stock}</Text>
            </View>
            <Pressable testID={`delete-${item.id}`} onPress={() => delMut.mutate(item.id)} style={styles.trashBtn}><Text style={{ fontSize: 18 }}>🗑</Text></Pressable>
          </View>
        )}
      />
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
  trashBtn: { padding: spacing.sm },
  fabRow: { position: "absolute", left: 0, right: 0, bottom: 64, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  fab: { borderRadius: radius.pill, overflow: "hidden" },
  fabBg: { paddingVertical: 14, alignItems: "center" },
  fabText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
