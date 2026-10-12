import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Client } from "./api";
import { statuses } from "./types";
import {
  businessDate,
  csv,
  formatDayName,
  formatMonthLabel,
  rate,
  shiftDate,
  shiftMonth,
  studentPerformance,
} from "./model";
import { createAttendanceHook } from "../shared/controller";
import { attendanceCopy } from "../shared/attendance";
import { partnerDesign } from "../shared/design";
import AttendanceSummary from "./AttendanceSummary";
import { Action, colors, ErrorBanner, Field, Loading, styles } from "./ui";

const statusColors = partnerDesign.attendanceColors;
const useAttendance = createAttendanceHook(React);

type ViewMode = "day" | "month";
type MonthFilter = "all" | "regular" | "attention" | "at_risk";

export default function AttendanceScreen({
  api,
  onDirty,
}: {
  api: Client;
  onDirty: (dirty: boolean) => void;
}) {
  const {
    courses,
    courseId,
    setCourseId,
    date,
    setDate,
    label,
    setLabel,
    sessions,
    students,
    records: rows,
    notes,
    setNotes,
    version,
    dirty,
    loading,
    busy: saving,
    error,
    setError,
    message,
    search,
    setSearch,
    canWrite,
    active,
    visible,
    marked,
    monthly,
    mark,
    markAllPresent,
    setStudentNote,
    save,
    retry,
  } = useAttendance(api);

  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [newLabel, setNewLabel] = useState("");
  const [coursePicker, setCoursePicker] = useState(false);
  const [datePicker, setDatePicker] = useState(false);
  const [monthSearch, setMonthSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState<MonthFilter>("all");

  useEffect(() => {
    onDirty(dirty);
    return () => onDirty(false);
  }, [dirty, onDirty]);

  function change(action: () => void) {
    if (dirty)
      Alert.alert("Unsaved register", "Discard your attendance changes?", [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: action },
      ]);
    else action();
  }

  const currentCourse = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId],
  );

  async function exportMonth() {
    const courseName = currentCourse?.name || "Course Attendance";
    const monthKey = date.slice(0, 7);
    const file = new File(Paths.cache, `attendance-${monthKey}.csv`);
    try {
      file.write(csv(sessions, courseName));
      if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: `Share ${formatMonthLabel(date)} attendance`,
        });
      else
        Alert.alert(
          "Sharing unavailable",
          "Sharing is unavailable on this device.",
        );
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function exportDay() {
    const courseName = currentCourse?.name || "Course Attendance";
    const daySessions = sessions.filter((s) => s.date === date);
    if (!daySessions.length) {
      Alert.alert("No records", "No saved register found for this date to export.");
      return;
    }
    const file = new File(Paths.cache, `attendance-${date}-${label}.csv`);
    try {
      file.write(csv(daySessions, courseName));
      if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: `Share ${date} attendance`,
        });
      else
        Alert.alert(
          "Sharing unavailable",
          "Sharing is unavailable on this device.",
        );
    } catch (e: any) {
      setError(e.message);
    }
  }

  // Monthly filtered and calculated metrics
  const monthlyMetrics = useMemo(() => {
    const allRows = sessions.flatMap((s) => s.records);
    const overallRate = rate(allRows);
    const attendedCount = allRows.filter(
      (r) => r.status === "present" || r.status === "late",
    ).length;
    const regularCount = monthly.filter(
      (m) => (rate(m.records) ?? 0) >= 80,
    ).length;
    const atRiskCount = monthly.filter(
      (m) => (rate(m.records) ?? 0) < 60,
    ).length;
    return {
      sessionCount: sessions.length,
      studentCount: monthly.length,
      overallRate,
      attendedCount,
      regularCount,
      atRiskCount,
    };
  }, [sessions, monthly]);

  const filteredMonthly = useMemo(() => {
    return monthly.filter(({ student, records }) => {
      const query = monthSearch.trim().toLowerCase();
      const matchesSearch = query
        ? `${student.name} ${student.memberNumber}`.toLowerCase().includes(query)
        : true;
      if (!matchesSearch) return false;

      const studentRate = rate(records);
      if (monthFilter === "regular")
        return studentRate !== null && studentRate >= 80;
      if (monthFilter === "attention")
        return studentRate !== null && studentRate < 80 && studentRate >= 50;
      if (monthFilter === "at_risk")
        return studentRate === null || studentRate < 50;
      return true;
    });
  }, [monthly, monthSearch, monthFilter]);

  const isCurrentMonth =
    date.slice(0, 7) >= businessDate().slice(0, 7);

  return (
    <View style={styles.page}>
      {/* Top Header & View Switcher */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          backgroundColor: colors.background,
          gap: 12,
        }}
      >
        <View>
          <Text style={styles.title}>{attendanceCopy.title}</Text>
          <Text style={styles.muted}>
            {viewMode === "day"
              ? "Your course. Your students. A few taps."
              : `Monthly overview & analytics · ${formatMonthLabel(date)}`}
          </Text>
        </View>

        {/* View Switcher Tabs */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#eee7ff",
            borderRadius: 14,
            padding: 4,
            gap: 4,
          }}
        >
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: viewMode === "day" }}
            onPress={() => change(() => setViewMode("day"))}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: viewMode === "day" ? "white" : "transparent",
            }}
          >
            <Ionicons
              name="checkbox-outline"
              size={17}
              color={viewMode === "day" ? colors.primary : colors.muted}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: viewMode === "day" ? colors.primary : colors.muted,
              }}
            >
              Daily Register
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: viewMode === "month" }}
            onPress={() => change(() => setViewMode("month"))}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: viewMode === "month" ? "white" : "transparent",
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={17}
              color={viewMode === "month" ? colors.primary : colors.muted}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: viewMode === "month" ? colors.primary : colors.muted,
              }}
            >
              Month View
            </Text>
          </Pressable>
        </View>

        <ErrorBanner message={error} onRetry={() => change(retry)} />
      </View>

      {/* VIEW MODE: DAY REGISTER */}
      {viewMode === "day" ? (
        <FlatList
          data={loading ? [] : visible}
          keyExtractor={(r) => r.profileId}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingTop: 4 }]}
          ListHeaderComponent={
            <View style={{ gap: 16 }}>
              {/* Course & Date Picker Card */}
              <View style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => !saving && setCoursePicker(true)}
                >
                  <Text style={styles.label}>Course</Text>
                  <Text style={[styles.heading, { marginTop: 6 }]}>
                    {currentCourse?.name || "Choose course"} ▾
                  </Text>
                </Pressable>
                <View style={styles.divider} />
                <View style={[styles.row, { justifyContent: "space-between" }]}>
                  <Action
                    title="‹"
                    secondary
                    disabled={saving}
                    onPress={() => change(() => setDate(shiftDate(date, -1)))}
                  />
                  <Pressable onPress={() => !saving && setDatePicker(true)}>
                    <Text style={styles.heading}>
                      {date} ({formatDayName(date)})
                    </Text>
                    <Text style={[styles.muted, { textAlign: "center" }]}>
                      Tap to choose date
                    </Text>
                  </Pressable>
                  <Action
                    title="›"
                    secondary
                    disabled={date >= businessDate() || saving}
                    onPress={() => change(() => setDate(shiftDate(date, 1)))}
                  />
                </View>
                {date !== businessDate() && (
                  <Pressable
                    onPress={() => change(() => setDate(businessDate()))}
                    style={{ alignSelf: "center", paddingTop: 4 }}
                  >
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: "600",
                        fontSize: 12,
                      }}
                    >
                      Return to today
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Sessions Selector & Add Session */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {[
                  ...new Set([
                    "Training",
                    ...sessions
                      .filter((s) => s.date === date)
                      .map((s) => s.label),
                    label,
                  ]),
                ].map((value) => (
                  <Pressable
                    key={value}
                    disabled={saving}
                    onPress={() => change(() => setLabel(value))}
                    style={[
                      styles.pill,
                      label === value && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={{
                        color: label === value ? "white" : colors.ink,
                        fontWeight: label === value ? "700" : "500",
                      }}
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field
                    value={newLabel}
                    onChangeText={setNewLabel}
                    placeholder="New session (e.g. Evening)"
                    maxLength={80}
                  />
                </View>
                <Action
                  title="Add"
                  secondary
                  disabled={!newLabel.trim() || saving}
                  onPress={() =>
                    change(() => {
                      setLabel(newLabel.trim());
                      setNewLabel("");
                    })
                  }
                />
              </View>

              {/* Register Progress Banner */}
              <View
                style={[
                  styles.card,
                  styles.row,
                  { justifyContent: "space-between" },
                ]}
              >
                <View>
                  <Text style={styles.heading}>
                    {marked} / {rows.length} marked
                  </Text>
                  <Text style={styles.muted}>
                    {version ? "Saved register" : "New register"} ·{" "}
                    {students.length} active
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={[
                      styles.heading,
                      { color: colors.primary, fontSize: 20 },
                    ]}
                  >
                    {rate(sessions.flatMap((s) => s.records)) ?? "—"}
                    {sessions.length ? "%" : ""}
                  </Text>
                  <Text style={[styles.muted, { fontSize: 11 }]}>
                    Month rate
                  </Text>
                </View>
              </View>

              {/* Search & Bulk Action */}
              <Field
                placeholder={attendanceCopy.search}
                value={search}
                onChangeText={setSearch}
              />
              <Action
                title={attendanceCopy.bulk}
                secondary
                icon="checkmark-done"
                disabled={!canWrite || saving || loading || !students.length}
                onPress={markAllPresent}
              />

              {message && (
                <Text
                  accessibilityRole="alert"
                  style={{ color: "#157552", fontWeight: "600" }}
                >
                  {message}
                </Text>
              )}
              {loading && <Loading />}
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { marginTop: 12 }]}>
              <View style={[styles.row, { justifyContent: "space-between" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heading}>{item.name}</Text>
                  <Text style={styles.muted}>
                    {item.memberNumber}
                    {!active.has(item.profileId) ? " · Historical" : ""}
                  </Text>
                </View>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: statusColors[item.status],
                  }}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {statuses.map((status) => (
                  <Pressable
                    key={status}
                    accessibilityRole="button"
                    accessibilityLabel={`${status} for ${item.name}`}
                    accessibilityState={{
                      selected: item.status === status,
                      disabled:
                        !canWrite || saving || !active.has(item.profileId),
                    }}
                    disabled={
                      !canWrite || saving || !active.has(item.profileId)
                    }
                    onPress={() => mark(item.profileId, status)}
                    style={{
                      flex: 1,
                      minHeight: 46,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor:
                        item.status === status
                          ? statusColors[status]
                          : colors.border,
                      backgroundColor:
                        item.status === status
                          ? statusColors[status]
                          : "white",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color:
                          item.status === status ? "white" : colors.ink,
                      }}
                    >
                      {status[0].toUpperCase() + status.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Field
                placeholder="Optional student note"
                value={item.notes}
                maxLength={300}
                editable={canWrite && !saving && active.has(item.profileId)}
                onChangeText={(value) => setStudentNote(item.profileId, value)}
              />
            </View>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={[styles.card, { marginTop: 16 }]}>
                <Text style={styles.muted}>
                  {search
                    ? "No students match your search."
                    : "No active enrolled students for this course and date."}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            !loading ? (
              <View style={{ gap: 16, marginTop: 16 }}>
                <Field
                  label="Session notes"
                  value={notes}
                  onChangeText={setNotes}
                  editable={canWrite && !saving}
                  multiline
                  maxLength={1000}
                />
                <Action
                  title={saving ? "Saving…" : attendanceCopy.save}
                  icon="cloud-upload-outline"
                  onPress={save}
                  disabled={!canWrite || saving || !rows.length}
                />

                {/* Quick actions for exporting Day CSV & Jumping to Month View */}
                <View style={[styles.row, { gap: 8 }]}>
                  <View style={{ flex: 1 }}>
                    <Action
                      title="Share day CSV"
                      secondary
                      icon="share-outline"
                      disabled={!sessions.some((s) => s.date === date)}
                      onPress={exportDay}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Action
                      title="Month overview →"
                      secondary
                      icon="calendar-outline"
                      onPress={() => change(() => setViewMode("month"))}
                    />
                  </View>
                </View>

                <Text style={styles.muted}>{attendanceCopy.rateHelp}</Text>
              </View>
            ) : null
          }
        />
      ) : (
        /* VIEW MODE: MONTHLY OVERVIEW */
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingTop: 4 }]}
        >
          {/* Month & Course Selector Card */}
          <View style={styles.card}>
            <Pressable
              accessibilityRole="button"
              onPress={() => !saving && setCoursePicker(true)}
            >
              <Text style={styles.label}>Course</Text>
              <Text style={[styles.heading, { marginTop: 6 }]}>
                {currentCourse?.name || "Choose course"} ▾
              </Text>
            </Pressable>
            <View style={styles.divider} />
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <Action
                title="‹"
                secondary
                disabled={saving}
                onPress={() => change(() => setDate(shiftMonth(date, -1)))}
              />
              <View style={{ alignItems: "center" }}>
                <Text style={[styles.heading, { fontSize: 18 }]}>
                  {formatMonthLabel(date)}
                </Text>
                <Text style={[styles.muted, { textAlign: "center", fontSize: 12 }]}>
                  {sessions.length} {sessions.length === 1 ? "session" : "sessions"} recorded
                </Text>
              </View>
              <Action
                title="›"
                secondary
                disabled={isCurrentMonth || saving}
                onPress={() => change(() => setDate(shiftMonth(date, 1)))}
              />
            </View>
            {!isCurrentMonth && (
              <Pressable
                onPress={() => change(() => setDate(businessDate()))}
                style={{ alignSelf: "center", paddingTop: 4 }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "600",
                    fontSize: 12,
                  }}
                >
                  Return to current month ({formatMonthLabel(businessDate())})
                </Text>
              </Pressable>
            )}
          </View>

          {/* Monthly KPI Overview Grid */}
          <AttendanceSummary sessions={sessions} />

          {/* Quick Metrics Highlights Card */}
          <View style={styles.card}>
            <Text style={styles.heading}>Monthly performance breakdown</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 8,
              }}
            >
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#157552",
                  }}
                >
                  {monthlyMetrics.regularCount}
                </Text>
                <Text style={[styles.muted, { fontSize: 11 }]}>
                  Regular (≥80%)
                </Text>
              </View>
              <View
                style={{
                  width: 1,
                  backgroundColor: colors.border,
                  height: 36,
                }}
              />
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: colors.primary,
                  }}
                >
                  {monthlyMetrics.studentCount}
                </Text>
                <Text style={[styles.muted, { fontSize: 11 }]}>
                  Total enrolled
                </Text>
              </View>
              <View
                style={{
                  width: 1,
                  backgroundColor: colors.border,
                  height: 36,
                }}
              />
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#c03648",
                  }}
                >
                  {monthlyMetrics.atRiskCount}
                </Text>
                <Text style={[styles.muted, { fontSize: 11 }]}>
                  At Risk (&lt;60%)
                </Text>
              </View>
            </View>

            {/* Export CSV Action */}
            <Action
              title={`Share ${formatMonthLabel(date)} report (CSV)`}
              secondary
              icon="share-outline"
              disabled={!sessions.length}
              onPress={exportMonth}
            />
          </View>

          {/* Student Monthly Roster & Breakdown */}
          <View style={styles.card}>
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <Text style={styles.heading}>Student monthly breakdown</Text>
              <Text style={[styles.muted, { fontWeight: "600" }]}>
                {filteredMonthly.length} of {monthly.length}
              </Text>
            </View>

            {/* Search Input for Month View */}
            <Field
              placeholder="Search student or member ID…"
              value={monthSearch}
              onChangeText={setMonthSearch}
            />

            {/* Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {[
                { key: "all", label: `All (${monthly.length})` },
                {
                  key: "regular",
                  label: `Regular ≥80% (${monthlyMetrics.regularCount})`,
                },
                {
                  key: "attention",
                  label: `Needs Attention (${monthly.length - monthlyMetrics.regularCount - monthlyMetrics.atRiskCount})`,
                },
                {
                  key: "at_risk",
                  label: `At Risk &lt;60% (${monthlyMetrics.atRiskCount})`,
                },
              ].map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setMonthFilter(f.key as MonthFilter)}
                  style={[
                    styles.pill,
                    monthFilter === f.key && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: monthFilter === f.key ? "700" : "500",
                      color:
                        monthFilter === f.key ? "white" : colors.ink,
                    }}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Students List */}
            {filteredMonthly.map(({ student, records }) => {
              const studentRate = rate(records);
              const present = records.filter(
                (r) => r.status === "present",
              ).length;
              const late = records.filter((r) => r.status === "late").length;
              const absent = records.filter(
                (r) => r.status === "absent",
              ).length;
              const excused = records.filter(
                (r) => r.status === "excused",
              ).length;
              const attended = present + late;
              const perf = studentPerformance(studentRate);

              // Find if student has any notes in this month
              const studentNotes = records
                .filter((r) => r.notes?.trim())
                .map((r) => r.notes?.trim());

              return (
                <View
                  key={student.profileId}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: "#faf9fd",
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 10,
                  }}
                >
                  {/* Top Name and Rating */}
                  <View
                    style={[
                      styles.row,
                      { justifyContent: "space-between" },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.heading, { fontSize: 16 }]}>
                        {student.name}
                      </Text>
                      <Text style={styles.muted}>
                        {student.memberNumber}
                        {!active.has(student.profileId) ? " · Historical" : ""}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 12,
                        backgroundColor: perf.badgeBg,
                      }}
                    >
                      <Text
                        style={{
                          color: perf.color,
                          fontWeight: "700",
                          fontSize: 12,
                        }}
                      >
                        {studentRate !== null ? `${studentRate}% · ` : ""}
                        {perf.label}
                      </Text>
                    </View>
                  </View>

                  {/* Attendance Progress Bar */}
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#e8e5f0",
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${studentRate ?? 0}%`,
                        backgroundColor: perf.color,
                      }}
                    />
                  </View>

                  {/* Class Breakdown Chips */}
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: colors.ink,
                      }}
                    >
                      {attended} / {sessions.length} attended
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>·</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: statusColors.present,
                        fontWeight: "600",
                      }}
                    >
                      P: {present}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: statusColors.late,
                        fontWeight: "600",
                      }}
                    >
                      L: {late}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: statusColors.absent,
                        fontWeight: "600",
                      }}
                    >
                      A: {absent}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: statusColors.excused,
                        fontWeight: "600",
                      }}
                    >
                      E: {excused}
                    </Text>
                  </View>

                  {/* Chronological Mini Session Indicators */}
                  {records.length > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 6,
                        paddingTop: 2,
                      }}
                    >
                      {sessions
                        .slice()
                        .reverse()
                        .map((s) => {
                          const r = s.records.find(
                            (rec) => rec.profileId === student.profileId,
                          );
                          const st = r?.status || "unmarked";
                          const dayNum = s.date.slice(8);
                          return (
                            <View
                              key={s.id}
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                                backgroundColor:
                                  st === "present"
                                    ? "#e3f5ec"
                                    : st === "late"
                                      ? "#fff2df"
                                      : st === "absent"
                                        ? "#ffe7ea"
                                        : "#f0eff6",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: "700",
                                  color: statusColors[st],
                                }}
                              >
                                {dayNum} ({st[0].toUpperCase()})
                              </Text>
                            </View>
                          );
                        })}
                    </View>
                  )}

                  {/* Student Remarks Excerpt */}
                  {studentNotes.length > 0 && (
                    <Text
                      style={[
                        styles.muted,
                        {
                          fontSize: 12,
                          fontStyle: "italic",
                          paddingTop: 2,
                        },
                      ]}
                    >
                      Remarks: &ldquo;{studentNotes[studentNotes.length - 1]}&rdquo;
                    </Text>
                  )}
                </View>
              );
            })}

            {!filteredMonthly.length && (
              <Text style={styles.muted}>
                {monthSearch
                  ? "No students match this filter."
                  : "No attendance data recorded yet for this month. Switch to Daily Register to start marking!"}
              </Text>
            )}
          </View>

          {/* Monthly Recorded Sessions Archive */}
          <View style={styles.card}>
            <Text style={styles.heading}>
              Recorded sessions in {formatMonthLabel(date)}
            </Text>
            <Text style={styles.muted}>
              Tap any session to open and edit its daily register
            </Text>

            {sessions.map((session) => {
              const presentCount = session.records.filter(
                (r) => r.status === "present" || r.status === "late",
              ).length;
              const sessionRate = rate(session.records);

              return (
                <Pressable
                  key={session.id}
                  onPress={() =>
                    change(() => {
                      setDate(session.date);
                      setLabel(session.label);
                      setViewMode("day");
                    })
                  }
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ gap: 2, flex: 1 }}>
                    <Text style={[styles.body, { fontWeight: "700" }]}>
                      {session.date} ({formatDayName(session.date)}) ·{" "}
                      {session.label}
                    </Text>
                    <Text style={styles.muted}>
                      {presentCount} / {session.records.length} attended ·{" "}
                      {sessionRate ?? "—"}%
                      {session.notes ? ` · Note: ${session.notes}` : ""}
                    </Text>
                  </View>
                  <View style={[styles.row, { gap: 4 }]}>
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      Edit
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={colors.primary}
                    />
                  </View>
                </Pressable>
              );
            })}

            {!sessions.length && (
              <Text style={styles.muted}>
                No sessions saved for {formatMonthLabel(date)}.
              </Text>
            )}
          </View>

          {loading && <Loading />}
        </ScrollView>
      )}

      {/* Course Modal Picker */}
      <Modal
        visible={coursePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setCoursePicker(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#0006",
          }}
        >
          <View style={[styles.card, { maxHeight: "80%", paddingBottom: 32 }]}>
            <Text style={styles.heading}>Choose course</Text>
            <ScrollView>
              {courses.map((course) => (
                <Pressable
                  key={course.id}
                  onPress={() => {
                    setCoursePicker(false);
                    change(() => setCourseId(course.id));
                  }}
                  style={{
                    paddingVertical: 18,
                    borderBottomWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={styles.body}>
                    {course.name}
                    {!course.isActive ? " (history only)" : ""}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Action
              title="Close"
              secondary
              onPress={() => setCoursePicker(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker Dialog */}
      {datePicker && (
        <DateTimePicker
          value={new Date(date + "T12:00:00")}
          mode="date"
          maximumDate={new Date()}
          onChange={(_, selected) => {
            setDatePicker(Platform.OS === "ios");
            if (selected)
              change(() =>
                setDate(
                  `${selected.getFullYear()}-${String(
                    selected.getMonth() + 1,
                  ).padStart(2, "0")}-${String(selected.getDate()).padStart(
                    2,
                    "0",
                  )}`,
                ),
              );
          }}
        />
      )}
    </View>
  );
}
