"use client";
import React from "react";
import { createAttendanceSummaryUI } from "@partner-shared/summary-ui";
import { partnerDesign } from "@partner-shared/design";
function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4"
      style={{ gap: partnerDesign.spacing.gap }}
    >
      {children}
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="border bg-card"
      style={{
        padding: partnerDesign.spacing.card,
        borderRadius: partnerDesign.radius.card,
      }}
    >
      <p
        className="text-muted-foreground"
        style={{ fontSize: partnerDesign.typography.label }}
      >
        {label}
      </p>
      <p
        className="mt-2 font-semibold"
        style={{ fontSize: partnerDesign.typography.metric }}
      >
        {value}
      </p>
    </div>
  );
}
export default createAttendanceSummaryUI(React.createElement, { Grid, Metric });
