import React from "react";
import { Text, View } from "react-native";
import { createAttendanceSummaryUI } from "../shared/summary-ui";
import { partnerDesign } from "../shared/design";
function Grid({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: partnerDesign.spacing.gap,
      }}
    >
      {children}
    </View>
  );
}
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <View
      style={{
        width: "48%",
        flexGrow: 1,
        borderWidth: 1,
        borderColor: partnerDesign.colors.border,
        backgroundColor: "white",
        padding: partnerDesign.spacing.card,
        borderRadius: partnerDesign.radius.card,
        gap: 8,
      }}
    >
      <Text
        style={{
          fontSize: partnerDesign.typography.label,
          color: partnerDesign.colors.muted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: partnerDesign.typography.metric,
          fontWeight: "700",
          color: partnerDesign.colors.ink,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
export default createAttendanceSummaryUI(React.createElement, { Grid, Metric });
