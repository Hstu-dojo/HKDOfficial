import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { partnerDesign } from "../shared/design";
export const colors = partnerDesign.colors;
export function Action({
  title,
  onPress,
  secondary = false,
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        secondary && styles.secondary,
        disabled && { opacity: 0.45 },
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={secondary ? colors.primary : "white"}
        />
      )}
      <Text style={[styles.buttonText, secondary && { color: colors.primary }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Field(props: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {props.label && <Text style={styles.label}>{props.label}</Text>}
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        style={[
          styles.input,
          props.multiline && { minHeight: 80, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  if (!message) return null;
  return (
    <View style={styles.error}>
      <Text accessibilityRole="alert" style={{ color: "#a32035", flex: 1 }}>
        {message}
      </Text>
      {onRetry && (
        <Pressable onPress={onRetry}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            Retry
          </Text>
        </Pressable>
      )}
    </View>
  );
}
export function Loading() {
  return (
    <View style={{ padding: 32, alignItems: "center", gap: 12 }}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>Loading…</Text>
    </View>
  );
}
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 18, paddingBottom: 32 },
  card: {
    backgroundColor: "white",
    padding: partnerDesign.spacing.card,
    borderRadius: partnerDesign.radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: partnerDesign.spacing.gap,
  },
  title: {
    fontSize: partnerDesign.typography.title,
    fontWeight: "700",
    color: colors.ink,
  },
  heading: {
    fontSize: partnerDesign.typography.heading,
    fontWeight: "700",
    color: colors.ink,
  },
  body: {
    fontSize: partnerDesign.typography.body,
    color: colors.ink,
    lineHeight: 21,
  },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  label: {
    fontSize: partnerDesign.typography.label,
    fontWeight: "600",
    color: colors.ink,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: partnerDesign.radius.control,
    padding: 13,
    fontSize: 15,
    color: colors.ink,
    minHeight: 48,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: partnerDesign.radius.control,
    minHeight: 48,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondary: { backgroundColor: "#eee7ff" },
  buttonText: { color: "white", fontWeight: "700", fontSize: 14 },
  error: {
    backgroundColor: "#fff0f1",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eee7ff",
  },
  divider: { height: 1, backgroundColor: colors.border },
});
