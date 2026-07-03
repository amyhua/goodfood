import { StyleSheet } from "react-native";

/** Shared styles for the MVP screens. */
export const colors = {
  brand: "#166534",
  brandText: "#ffffff",
  border: "#e5e5e5",
  muted: "#737373",
  danger: "#e11d48",
  bg: "#ffffff",
};

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  h1: { fontSize: 26, fontWeight: "700", marginBottom: 8 },
  p: { fontSize: 15, color: colors.muted, marginBottom: 16 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    minHeight: 48,
    backgroundColor: colors.brand,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  buttonText: { color: colors.brandText, fontWeight: "700", fontSize: 15 },
  outlineButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  error: { color: colors.danger, marginBottom: 12 },
});
