import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";
import { useCart } from "@/src/cart";
import Rotate360 from "@/src/components/Rotate360";
import Stars from "@/src/components/Stars";

const METHOD: Record<string, string> = { in_house: "In-House Delivery", third_party: "Third-Party", pickup: "Pick-Up" };

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { add } = useCart();
  const qc = useQueryClient();
  const { data: p, isLoading } = useQuery({ queryKey: ["product", id], queryFn: () => api(`/products/${id}`), enabled: !!id });
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: reviews = [] } = useQuery({ queryKey: ["reviews", id], queryFn: () => api(`/products/${id}/reviews`), enabled: !!id });
  const { data: elig } = useQuery({ queryKey: ["review-elig", id], queryFn: () => api(`/reviews/eligibility?product_id=${id}`), enabled: !!id });

  const reviewMut = useMutation({
    mutationFn: () => api("/reviews", { method: "POST", body: JSON.stringify({ product_id: id, rating, comment }) }),
    onSuccess: () => {
      setShowReview(false); setComment("");
      qc.invalidateQueries({ queryKey: ["reviews", id] });
      qc.invalidateQueries({ queryKey: ["review-elig", id] });
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
  });

  const favMut = useMutation({
    mutationFn: () => fav ? api(`/favorites/${id}`, { method: "DELETE" }) : api(`/favorites/${id}`, { method: "POST" }),
    onSuccess: () => { setFav(!fav); qc.invalidateQueries({ queryKey: ["favs"] }); },
  });

  if (isLoading || !p) return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;

  const angles: string[] = p.images && p.images.length ? p.images : (p.image ? [p.image] : []);

  const addToCart = () => {
    add({ product_id: p.id, product_type: p.product_type, shop_id: p.shop_id, name: p.name, image: p.image, unit_price: p.price, quantity: qty });
    router.push("/(customer)/cart");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={styles.viewerWrap}>
          <Rotate360 images={angles} height={380} />
          <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable testID="back-btn" onPress={() => router.back()} style={styles.circleBtn}><Text style={{ fontSize: 18 }}>←</Text></Pressable>
            <Pressable testID="fav-btn" onPress={() => favMut.mutate()} style={styles.circleBtn}><Text style={{ fontSize: 18 }}>{fav ? "❤️" : "🤍"}</Text></Pressable>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.type}>READY-MADE BOUQUET{p.shop ? ` · ${p.shop.shop_name}` : ""}</Text>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.price}>₱{p.price.toLocaleString()}</Text>
          {(p.rating_count > 0) && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <Stars value={p.rating_avg || 0} size={15} count={p.rating_count} />
            </View>
          )}
          <Text style={styles.desc}>{p.description || "Handcrafted with love in Biñan, Laguna."}</Text>

          {p.flowers_included && p.flowers_included.length > 0 && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.label}>Flowers Included</Text>
              <Text style={styles.info}>{p.flowers_included.join(", ")}{p.number_of_flowers ? ` · ${p.number_of_flowers} stems` : ""}</Text>
            </View>
          )}
          {p.wrapping ? (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={styles.label}>Wrapping</Text>
              <Text style={styles.info}>{p.wrapping}{p.ribbon ? ` · ${p.ribbon} ribbon` : ""}</Text>
            </View>
          ) : null}

          {p.shop?.delivery_methods?.length ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.label}>Delivery Options</Text>
              <View style={styles.methodRow}>
                {p.shop.delivery_methods.map((m: string) => <Text key={m} style={styles.methodPill}>🚚 {METHOD[m] || m}</Text>)}
              </View>
            </View>
          ) : null}

          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.qtyRow}>
              <Pressable testID="qty-minus" onPress={() => setQty(Math.max(1, qty - 1))} style={styles.qtyBtn}><Text style={styles.qtyBtnT}>−</Text></Pressable>
              <Text style={styles.qty}>{qty}</Text>
              <Pressable testID="qty-plus" onPress={() => setQty(qty + 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnT}>+</Text></Pressable>
              <Text style={{ marginLeft: spacing.md, color: colors.muted, fontSize: 12 }}>Stock: {p.stock}</Text>
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.reviewsHead}>
            <Text style={styles.reviewsTitle}>Reviews {p.rating_count ? `· ${p.rating_avg?.toFixed(1)}★ (${p.rating_count})` : ""}</Text>
            {elig?.can_review && (
              <Pressable testID="write-review-btn" onPress={() => { setRating(elig?.my_review?.rating || 5); setComment(elig?.my_review?.comment || ""); setShowReview(true); }}>
                <Text style={styles.writeLink}>{elig?.already_reviewed ? "Edit review" : "Write a review"}</Text>
              </Pressable>
            )}
          </View>
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet{elig && !elig.can_review ? " · order this bouquet to review it" : ""}.</Text>
          ) : (
            reviews.map((r: any, i: number) => (
              <View key={i} style={styles.reviewCard} testID={`review-${i}`}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewName}>{r.user_name}</Text>
                  <Stars value={r.rating} size={13} />
                </View>
                {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showReview} transparent animationType="slide" onRequestClose={() => setShowReview(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowReview(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <Text style={styles.modalTitle}>Rate this bouquet</Text>
          <View style={{ alignItems: "center", marginVertical: spacing.md }}>
            <Stars value={rating} size={38} onChange={setRating} />
          </View>
          <TextInput testID="review-comment" value={comment} onChangeText={setComment} multiline placeholder="Share your experience..." placeholderTextColor={colors.muted} style={styles.reviewInput} />
          <Pressable testID="submit-review-btn" onPress={() => reviewMut.mutate()} disabled={reviewMut.isPending} style={styles.submitBtn}>
            <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBg}>
              {reviewMut.isPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Submit Review</Text>}
            </LinearGradient>
          </Pressable>
        </View>
      </Modal>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable testID="add-cart-btn" onPress={addToCart} style={styles.cta}>
          <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBg}>
            <Text style={styles.ctaText}>Add to Cart · ₱{(p.price * qty).toLocaleString()}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  viewerWrap: { width: "100%" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.lg },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
  body: { padding: spacing.lg, gap: 6 },
  type: { color: colors.brandPrimary, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  name: { fontSize: 26, fontWeight: "300", fontStyle: "italic", color: colors.onSurface, marginTop: 4 },
  price: { fontSize: 22, fontWeight: "700", color: colors.brandPrimary, marginTop: 4 },
  desc: { color: colors.muted, marginTop: spacing.sm, lineHeight: 20, fontSize: 14 },
  label: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "700", marginBottom: 6 },
  info: { color: colors.onSurface, fontSize: 14 },
  methodRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  methodPill: { backgroundColor: colors.brandTertiary, color: colors.onBrandTertiary, fontSize: 12, fontWeight: "700", paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, overflow: "hidden" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  qtyBtnT: { fontSize: 18, color: colors.brandPrimary, fontWeight: "700" },
  qty: { fontSize: 16, fontWeight: "700", color: colors.onSurface, minWidth: 24, textAlign: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 64, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  cta: { borderRadius: radius.pill, overflow: "hidden" },
  ctaBg: { paddingVertical: 14, alignItems: "center" },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  reviewsHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.lg },
  reviewsTitle: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  writeLink: { color: colors.brandPrimary, fontWeight: "700", fontSize: 13 },
  noReviews: { color: colors.muted, fontSize: 13, marginTop: spacing.sm },
  reviewCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  reviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewName: { fontWeight: "700", color: colors.onSurface, fontSize: 13 },
  reviewComment: { color: colors.onSurfaceSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
  modalBg: { flex: 1, backgroundColor: "rgba(43,30,34,0.5)" },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.onSurface, textAlign: "center" },
  reviewInput: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, minHeight: 90, color: colors.onSurface, fontSize: 14, textAlignVertical: "top" },
  submitBtn: { borderRadius: radius.pill, overflow: "hidden", marginTop: spacing.md },
  submitBg: { paddingVertical: 14, alignItems: "center" },
  submitText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
