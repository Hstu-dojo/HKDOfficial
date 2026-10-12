import { useEffect, useState } from "react";
import { FlatList, Modal, ScrollView, Text, View } from "react-native";
import { Client } from "./api";
import { Action, ErrorBanner, Field, Loading, styles } from "./ui";
type Member = {
  id: string;
  fullNameEnglish: string | null;
  userName: string | null;
  memberNumber: string;
  email: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  beltRank: string;
  fatherName: string | null;
  motherName: string | null;
  institute: string | null;
  address: string | null;
};
export default function StudentsScreen({
  api,
  openPortal,
}: {
  api: Client;
  openPortal: (path: string, title: string) => void;
}) {
  const [members, setMembers] = useState<Member[]>([]),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<Member | null>(null),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setQuery(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    let canceled = false;
    setLoading(true);
    setError("");
    api<{
      members: Member[];
      pagination: { totalPages: number; total: number };
    }>(
      `/api/partner-portal/members?page=${page}&limit=25&search=${encodeURIComponent(query)}`,
    )
      .then((data) => {
        if (canceled) return;
        setMembers(data.members);
        setPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      })
      .catch((e) => !canceled && setError(e.message))
      .finally(() => !canceled && setLoading(false));
    return () => {
      canceled = true;
    };
  }, [api, page, query, retry]);
  return (
    <View style={styles.page}>
      <FlatList
        data={loading ? [] : members}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <Text style={styles.title}>Students</Text>
            <Text style={styles.muted}>
              {total} members in your organization
            </Text>
            <Action
              title="Quick enroll / manage documents"
              secondary
              icon="person-add-outline"
              onPress={() =>
                openPortal(
                  "/partner-admin/portal/members",
                  "Members & quick enrollment",
                )
              }
            />
            <Field
              placeholder="Search names, email or member number"
              value={search}
              onChangeText={setSearch}
            />
            <ErrorBanner
              message={error}
              onRetry={() => setRetry((n) => n + 1)}
            />
            {loading && <Loading />}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.heading}>
              {item.fullNameEnglish || item.userName || item.memberNumber}
            </Text>
            <Text style={styles.muted}>
              {item.memberNumber} · {item.beltRank.replaceAll("_", " ")} belt
            </Text>
            <Text style={styles.muted}>
              {item.email || item.phoneNumber || "Contact not recorded"}
            </Text>
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <Text
                style={{
                  color: item.isActive ? "#157552" : "#727180",
                  fontWeight: "600",
                }}
              >
                {item.isActive ? "Active" : "Inactive"}
              </Text>
              <Action
                title="View details"
                secondary
                onPress={() => setSelected(item)}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.muted, { marginTop: 24 }]}>
              No matching students.
            </Text>
          ) : null
        }
        ListFooterComponent={
          <View
            style={[
              styles.row,
              { justifyContent: "space-between", marginTop: 18 },
            ]}
          >
            <Action
              title="Previous"
              secondary
              disabled={page <= 1 || loading}
              onPress={() => setPage((n) => n - 1)}
            />
            <Text style={styles.muted}>
              {page} / {Math.max(pages, 1)}
            </Text>
            <Action
              title="Next"
              secondary
              disabled={page >= pages || loading}
              onPress={() => setPage((n) => n + 1)}
            />
          </View>
        }
      />
      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: 52 }]}
        >
          {selected && (
            <>
              <Text style={styles.title}>
                {selected.fullNameEnglish ||
                  selected.userName ||
                  selected.memberNumber}
              </Text>
              <View style={styles.card}>
                {[
                  ["Member number", selected.memberNumber],
                  ["Email", selected.email],
                  ["Phone", selected.phoneNumber],
                  ["Father", selected.fatherName],
                  ["Mother", selected.motherName],
                  ["Institution", selected.institute],
                  ["Address", selected.address],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <View key={label}>
                      <Text style={styles.muted}>{label}</Text>
                      <Text style={styles.body}>{value}</Text>
                    </View>
                  ))}
              </View>
              <Action
                title="Enrollment & documents in portal"
                onPress={() => {
                  setSelected(null);
                  openPortal(
                    "/partner-admin/portal/members",
                    "Student records & documents",
                  );
                }}
              />
              <Action
                title="Close"
                secondary
                onPress={() => setSelected(null)}
              />
            </>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}
