import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors } from "@/src/theme";

/** Read-only or interactive 1–5 star row. */
export default function Stars({
  value = 0,
  size = 16,
  onChange,
  count,
}: {
  value?: number;
  size?: number;
  onChange?: (v: number) => void;
  count?: number;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const star = (
          <Text style={{ fontSize: size, color: filled ? "#F6A623" : colors.border }}>{filled ? "★" : "☆"}</Text>
        );
        return onChange ? (
          <Pressable key={i} testID={`star-${i}`} onPress={() => onChange(i)} hitSlop={6} style={{ paddingHorizontal: 2 }}>
            {star}
          </Pressable>
        ) : (
          <View key={i} style={{ paddingHorizontal: 1 }}>{star}</View>
        );
      })}
      {typeof count === "number" && (
        <Text style={styles.count}>{value ? value.toFixed(1) : "New"}{count ? ` (${count})` : ""}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  count: { marginLeft: 6, color: colors.muted, fontSize: 12, fontWeight: "600" },
});
