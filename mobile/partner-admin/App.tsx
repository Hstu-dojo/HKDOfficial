import { useCallback, useEffect, useState } from "react";
import appConfig from "./app.json";
import {
  Alert,
  AppState,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ApiError, Client, request, sessionStore } from "./src/api";
import { apiOrigin } from "./src/model";
import { PartnerUser, Session } from "./src/types";
import AttendanceScreen from "./src/AttendanceScreen";
import StudentsScreen from "./src/StudentsScreen";
import PortalScreen from "./src/PortalScreen";
import { portalGroups } from "./src/portal";
import { Action, colors, ErrorBanner, Field, Loading, styles } from "./src/ui";
const tabs = [
  { name: "Home", icon: "home-outline" },
  { name: "Attendance", icon: "checkbox-outline" },
  { name: "Students", icon: "people-outline" },
  { name: "More", icon: "grid-outline" },
] as const;
export default function App() {
  return (
    <SafeAreaProvider>
      <Workspace />
    </SafeAreaProvider>
  );
}
function Workspace() {
  const [session, setSession] = useState<Session | null>(null),
    [restoring, setRestoring] = useState(true),
    [origin] = useState(appConfig.expo.extra.apiOrigin || "https://www.hstuma.com"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [tab, setTab] = useState("Home"),
    [dirty, setDirty] = useState(false),
    [portal, setPortal] = useState<{ path: string; title: string } | null>(
      null,
    ),
    [retry, setRetry] = useState(0);
  const expire = useCallback(() => {
    void sessionStore.clear();
    setSession(null);
    setPortal(null);
    setDirty(false);
    setTab("Home");
    setError("Your session expired. Sign in again.");
  }, []);
  useEffect(() => {
    let canceled = false;
    setRestoring(true);
    sessionStore
      .read()
      .then(async (stored) => {
        if (!stored) return;
        if (new Date(stored.expiresAt).getTime() <= Date.now()) {
          await sessionStore.clear();
          return;
        }
        try {
          const data = await request<{ user: PartnerUser }>(
            stored.origin,
            "/api/partner-admin/session",
            stored.token,
          );
          if (!canceled) setSession({ ...stored, user: data.user });
        } catch (e) {
          if (e instanceof ApiError && [401, 403].includes(e.status)) {
            await sessionStore.clear();
          } else if (!canceled) {
            setSession(stored);
            setError(
              "Could not verify your session. Connect to the internet and retry.",
            );
          }
        }
      })
      .catch(() => setError("Could not restore your session. Sign in again."))
      .finally(() => !canceled && setRestoring(false));
    return () => {
      canceled = true;
    };
  }, [retry]);
  const api = useCallback<Client>(
    async (path, body) => {
      if (!session) throw Error("Sign in first.");
      try {
        return await request(session.origin, path, session.token, body);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) expire();
        throw e;
      }
    },
    [session, expire],
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && session)
        void request(
          session.origin,
          "/api/partner-admin/session",
          session.token,
        ).catch((e) => {
          if (e instanceof ApiError && [401, 403].includes(e.status)) expire();
        });
    });
    return () => subscription.remove();
  }, [session, expire]);
  const changeTab = useCallback(
    (next: string) => {
      if (dirty)
        Alert.alert("Unsaved attendance", "Discard this register's changes?", [
          { text: "Keep editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setDirty(false);
              setTab(next);
            },
          },
        ]);
      else setTab(next);
    },
    [dirty],
  );
  useEffect(() => {
    if (portal) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (tab !== "Home") {
          changeTab("Home");
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [tab, changeTab, portal]);
  async function login() {
    setBusy(true);
    setError("");
    try {
      const host = apiOrigin(origin, __DEV__);
      const result = await request<{
        token?: string;
        expiresAt: string;
        user: PartnerUser;
      }>(host, "/api/partner-admin/login", undefined, {
        email: email.trim(),
        password,
        client: "mobile",
      });
      if (!result.token)
        throw Error(
          "The website needs the mobile authentication update deployed before this app can sign in.",
        );
      const next = {
        token: result.token,
        expiresAt: result.expiresAt,
        user: result.user,
        origin: host,
      };
      await sessionStore.save(next);
      setSession(next);
      setPassword("");
      setTab("Home");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function logout() {
    Alert.alert("Sign out", "Sign out of this partner-admin account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          if (session)
            await request(
              session.origin,
              "/api/partner-admin/logout",
              session.token,
              {},
            ).catch(() => {});
          await sessionStore.clear();
          setSession(null);
          setPortal(null);
          setDirty(false);
          setTab("Home");
          setError("");
        },
      },
    ]);
  }
  const openPortal = useCallback(
    (path: string, title: string) => setPortal({ path, title }),
    [],
  );
  return (
    <SafeAreaView style={styles.page} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      {restoring ? (
        <Loading />
      ) : !session ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.content,
              { flexGrow: 1, justifyContent: "center" },
            ]}
          >
            <View style={[styles.pill, { alignSelf: "flex-start" }]}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                KAIZEN · PARTNER ADMIN
              </Text>
            </View>
            <Text style={[styles.title, { fontSize: 34, marginTop: 12 }]}>
              Your dojo,{"\n"}within reach.
            </Text>
            <Text style={styles.muted}>
              Sign in with your existing partner-admin account.
            </Text>
            <View style={[styles.card, { marginTop: 16 }]}>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
              />
              <ErrorBanner message={error} />
              <Action
                title={busy ? "Signing in…" : "Sign in"}
                disabled={busy || !email.trim() || !password}
                onPress={login}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : portal ? (
        <PortalScreen
          session={session}
          path={portal.path}
          title={portal.title}
          onClose={() => setPortal(null)}
          onExpired={expire}
        />
      ) : (
        <>
          <View
            style={[
              styles.row,
              {
                paddingHorizontal: 20,
                paddingVertical: 12,
                backgroundColor: "white",
                borderBottomWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <Image
              source={require("./assets/icon.png")}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
              accessibilityLabel="Kaizen Karate Academy"
            />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.label}>
                {session.user.partnerName}
              </Text>
              <Text style={styles.muted}>{session.user.name}</Text>
            </View>
            <Pressable
              accessibilityLabel="Sign out"
              onPress={logout}
              style={{ padding: 8 }}
            >
              <Ionicons name="log-out-outline" size={23} color={colors.ink} />
            </Pressable>
          </View>
          {error && (
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <ErrorBanner
                message={error}
                onRetry={() => {
                  setError("");
                  setRetry((n) => n + 1);
                }}
              />
            </View>
          )}
          {tab === "Attendance" ? (
            <AttendanceScreen api={api} onDirty={setDirty} />
          ) : tab === "Students" ? (
            <StudentsScreen api={api} openPortal={openPortal} />
          ) : (
            <ScrollView contentContainerStyle={styles.content}>
              {tab === "Home" ? (
                <>
                  <Text style={styles.title}>
                    Welcome, {session.user.name.split(" ")[0]}.
                  </Text>
                  <Text style={styles.muted}>
                    Manage your branch and keep training on track.
                  </Text>
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                        padding: 24,
                      },
                    ]}
                  >
                    <Ionicons name="checkbox-outline" size={32} color="white" />
                    <Text style={[styles.title, { color: "white" }]}>
                      Ready for class?
                    </Text>
                    <Text style={{ color: "#e8ddff", lineHeight: 21 }}>
                      Pick a course and mark your students with a tap.
                    </Text>
                    <Action
                      title="Take attendance →"
                      secondary
                      onPress={() => changeTab("Attendance")}
                    />
                  </View>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Action
                        title="Students"
                        secondary
                        icon="people-outline"
                        onPress={() => changeTab("Students")}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Action
                        title="Billing"
                        secondary
                        icon="receipt-outline"
                        onPress={() =>
                          openPortal(
                            "/partner-admin/portal/monthly-billing",
                            "Monthly billing",
                          )
                        }
                      />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Your partner portal</Text>
                  <Text style={styles.muted}>
                    All your organization tools, securely connected to the same
                    system.
                  </Text>
                </>
              )}
              {portalGroups.map((group) => (
                <View key={group.title} style={styles.card}>
                  <Text style={styles.heading}>{group.title}</Text>
                  {group.items.map((item) => (
                    <Pressable
                      key={item.path}
                      accessibilityRole="button"
                      onPress={() => openPortal(item.path, item.name)}
                      style={[styles.row, { paddingVertical: 12 }]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={colors.primary}
                      />
                      <Text style={[styles.body, { flex: 1 }]}>
                        {item.name}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color={colors.muted}
                      />
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "white",
              borderTopWidth: 1,
              borderColor: colors.border,
              paddingTop: 10,
              paddingBottom: 8,
            }}
          >
            {tabs.map((item) => (
              <Pressable
                key={item.name}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === item.name }}
                onPress={() => changeTab(item.name)}
                style={{ flex: 1, alignItems: "center", gap: 4, minHeight: 48 }}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={tab === item.name ? colors.primary : colors.muted}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: tab === item.name ? "700" : "400",
                    color: tab === item.name ? colors.primary : colors.muted,
                  }}
                >
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
