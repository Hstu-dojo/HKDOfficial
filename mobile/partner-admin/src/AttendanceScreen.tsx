import React, { useEffect, useState } from "react";
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
import { Client } from "./api";
import { statuses } from "./types";
import { businessDate, csv, rate, shiftDate } from "./model";
import { createAttendanceHook } from "../shared/controller";
import { attendanceCopy } from "../shared/attendance";
import { partnerDesign } from "../shared/design";
import AttendanceSummary from "./AttendanceSummary";
import { Action, colors, ErrorBanner, Field, Loading, styles } from "./ui";
const statusColors = partnerDesign.attendanceColors;
const useAttendance = createAttendanceHook(React);
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
  const [newLabel, setNewLabel] = useState(""),
    [coursePicker, setCoursePicker] = useState(false),
    [datePicker, setDatePicker] = useState(false);
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
  async function exportMonth() {
    const file = new File(Paths.cache, `attendance-${date.slice(0, 7)}.csv`);
    try {
      file.write(csv(sessions));
      if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Share monthly attendance",
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
  return (
    <View style={styles.page}>
      <FlatList
        data={loading ? [] : visible}
        keyExtractor={(r) => r.profileId}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <View>
              <Text style={styles.title}>{attendanceCopy.title}</Text>
              <Text style={styles.muted}>
                Your course. Your students. A few taps.
              </Text>
            </View>
            <ErrorBanner message={error} onRetry={() => change(retry)} />
            <View style={styles.card}>
              <Pressable
                accessibilityRole="button"
                onPress={() => !saving && setCoursePicker(true)}
              >
                <Text style={styles.label}>Course</Text>
                <Text style={[styles.heading, { marginTop: 6 }]}>
                  {courses.find((c) => c.id === courseId)?.name ||
                    "Choose course"}{" "}
                  ▾
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
                  <Text style={styles.heading}>{date}</Text>
                  <Text style={[styles.muted, { textAlign: "center" }]}>
                    Choose date
                  </Text>
                </Pressable>
                <Action
                  title="›"
                  secondary
                  disabled={date >= businessDate() || saving}
                  onPress={() => change(() => setDate(shiftDate(date, 1)))}
                />
              </View>
            </View>
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
                    style={{ color: label === value ? "white" : colors.ink }}
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
              <Text style={[styles.heading, { color: colors.primary }]}>
                {rate(sessions.flatMap((s) => s.records)) ?? "—"}
                {sessions.length ? "%" : ""}
              </Text>
            </View>
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
                  width: 10,
                  height: 10,
                  borderRadius: 5,
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
                  disabled={!canWrite || saving || !active.has(item.profileId)}
                  onPress={() => mark(item.profileId, status)}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor:
                      item.status === status
                        ? statusColors[status]
                        : colors.border,
                    backgroundColor:
                      item.status === status ? statusColors[status] : "white",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: item.status === status ? "white" : colors.ink,
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
                  : "No active enrolled students for this course and date. Check enrollment and monthly activity in the portal."}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          !loading ? (
            <View style={{ gap: 16, marginTop: 16 }}>
              <AttendanceSummary sessions={sessions} />
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
              <Text style={styles.muted}>{attendanceCopy.rateHelp}</Text>
              <View style={styles.card}>
                <Text style={styles.heading}>
                  This month · {date.slice(0, 7)}
                </Text>
                <Text style={styles.muted}>
                  {sessions.length} saved sessions
                </Text>
                {sessions.map((session) => (
                  <Pressable
                    key={session.id}
                    onPress={() =>
                      change(() => {
                        setDate(session.date);
                        setLabel(session.label);
                      })
                    }
                    style={{ paddingVertical: 10 }}
                  >
                    <Text style={styles.body}>
                      {session.date} · {session.label} →
                    </Text>
                  </Pressable>
                ))}
                <Action
                  title="Share attendance CSV"
                  secondary
                  onPress={exportMonth}
                  disabled={!sessions.length}
                  icon="share-outline"
                />
              </View>
              <View style={styles.card}>
                <Text style={styles.heading}>Student summary</Text>
                {monthly.map(({ student, records }) => (
                  <View
                    key={student.profileId}
                    style={{ gap: 4, paddingVertical: 8 }}
                  >
                    <Text style={styles.label}>{student.name}</Text>
                    <Text style={styles.muted}>
                      {
                        records.filter((r) =>
                          ["present", "late"].includes(r.status),
                        ).length
                      }{" "}
                      attended ·{" "}
                      {records.filter((r) => r.status === "absent").length}{" "}
                      absent · {rate(records) ?? "—"}%
                    </Text>
                  </View>
                ))}
                {!monthly.length && (
                  <Text style={styles.muted}>
                    Save a register to see your monthly summary.
                  </Text>
                )}
              </View>
            </View>
          ) : null
        }
      />
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
                  `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`,
                ),
              );
          }}
        />
      )}
    </View>
  );
}
