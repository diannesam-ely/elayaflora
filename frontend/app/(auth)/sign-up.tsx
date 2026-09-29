import { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { colors, spacing, radius } from "@/src/theme";
import { useAuth, Role } from "@/src/auth";

export default function SignUp() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!name || !email || !password) { setErr("Please fill in all fields"); return; }
    setLoading(true); setErr(null);
    try {
      const u = await register({ name, email: email.trim(), password, role });
      if (u.role === "customer") router.replace("/(customer)/home");
      else if (u.role === "flower_owner") router.replace("/(owner)/application");
    } catch (e: any) { setErr(e.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="back-btn" onPress={() => router.back()} style={styles.backBtn}><Text style={{ fontSize: 22, color: colors.onSurface }}>←</Text></Pressable>
        <Text style={styles.headerTitle}>Create account</Text>
        <View style={{ width: 36 }} />
      </View>
      <KeyboardAwareScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]} keyboardShouldPersistTaps="handled" bottomOffset={20}>
        <Text style={styles.hero}>Join Elaya</Text>
        <Text style={styles.sub}>Bloom-to-door in Biñan, Laguna</Text>

        <Text style={styles.label}>I am a</Text>
        <View style={styles.roleRow}>
          {(["customer", "flower_owner"] as Role[]).map((r) => (
            <Pressable key={r} testID={`role-${r}`} onPress={() => setRole(r)} style={[styles.roleCard, role === r && styles.roleCardActive]}>
              <Text style={[styles.roleTitle, role === r && { color: colors.onBrandPrimary }]}>{r === "customer" ? "Customer" : "Shop Owner"}</Text>
              <Text style={[styles.roleDesc, role === r && { color: colors.onBrandPrimary }]}>{r === "customer" ? "Order flowers & bouquets" : "Sell your floral creations"}</Text>
            </Pressable>
          ))}
        </View>

        {role === "flower_owner" && (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>🛈 After creating your account, you will submit a shop application for admin approval before you can sell.</Text>
          </View>
        )}

        <View style={styles.field}><Text style={styles.label}>Full Name</Text>
          <TextInput testID="name-input" value={name} onChangeText={setName} placeholder="Maria Santos" placeholderTextColor={colors.muted} style={styles.input} /></View>
        <View style={styles.field}><Text style={styles.label}>Email</Text>
          <TextInput testID="email-input" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.muted} style={styles.input} /></View>
        <View style={styles.field}><Text style={styles.label}>Password</Text>
          <TextInput testID="password-input" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" placeholderTextColor={colors.muted} style={styles.input} /></View>

        {err ? <Text testID="signup-error" style={styles.err}>{err}</Text> : null}

        <Pressable testID="signup-btn" onPress={onSubmit} disabled={loading} style={styles.cta}>
          <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaBg}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaText}>Create Account</Text>}
          </LinearGradient>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "600", color: colors.onSurface },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md },
  hero: { fontSize: 32, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  sub: { color: colors.muted, marginBottom: spacing.md },
  label: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "600" },
  roleRow: { flexDirection: "row", gap: spacing.sm },
  roleCard: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  roleCardActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  roleTitle: { color: colors.onSurface, fontWeight: "700", fontSize: 15 },
  roleDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  noticeBox: { backgroundColor: colors.brandTertiary, borderRadius: radius.md, padding: spacing.md },
  noticeText: { color: colors.onBrandTertiary, fontSize: 12, lineHeight: 18 },
  field: { gap: spacing.xs },
  input: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: 15, color: colors.onSurface },
  err: { color: colors.error, fontSize: 13 },
  cta: { borderRadius: radius.pill, overflow: "hidden", marginTop: spacing.md },
  ctaBg: { paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
