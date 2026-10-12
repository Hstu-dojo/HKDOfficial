import { useEffect, useRef, useState } from "react";
import { BackHandler, Linking, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { Session } from "./types";
import { portalNavigation } from "./model";
import { Action, colors, ErrorBanner, styles } from "./ui";
export default function PortalScreen({
  session,
  path,
  title,
  onClose,
  onExpired,
}: {
  session: Session;
  path: string;
  title: string;
  onClose: () => void;
  onExpired: () => void;
}) {
  const view = useRef<WebView>(null),
    [canGoBack, setCanGoBack] = useState(false),
    [error, setError] = useState(""),
    [progress, setProgress] = useState(0),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (canGoBack) view.current?.goBack();
        else onClose();
        return true;
      },
    );
    return () => subscription.remove();
  }, [canGoBack, onClose]);
  return (
    <View style={styles.page}>
      <View style={[styles.row, { padding: 12, backgroundColor: "white" }]}>
        <Action
          title="Back"
          secondary
          onPress={() => (canGoBack ? view.current?.goBack() : onClose())}
        />
        <Text numberOfLines={1} style={[styles.label, { flex: 1 }]}>
          {title}
        </Text>
        <Action title="Done" secondary onPress={onClose} />
      </View>
      {progress < 1 && (
        <View style={{ height: 3, backgroundColor: colors.border }}>
          <View
            style={{
              height: 3,
              width: `${Math.max(5, progress * 100)}%`,
              backgroundColor: colors.primary,
            }}
          />
        </View>
      )}
      {error ? (
        <View style={styles.content}>
          <ErrorBanner message={error} />
          <Action
            title="Retry portal"
            onPress={() => {
              setError("");
              setAttempt((n) => n + 1);
            }}
          />
        </View>
      ) : (
        <WebView
          key={attempt}
          ref={view}
          source={{
            uri: `${session.origin}/api/partner-admin/mobile-session?next=${encodeURIComponent(path)}`,
            headers: { Authorization: `Bearer ${session.token}` },
          }}
          incognito
          sharedCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["https://*", "http://*"]}
          mixedContentMode="never"
          allowFileAccess={false}
          setSupportMultipleWindows={false}
          onLoadProgress={({ nativeEvent }) =>
            setProgress(nativeEvent.progress)
          }
          onNavigationStateChange={(state) => {
            setCanGoBack(state.canGoBack);
            try {
              if (new URL(state.url).pathname === "/partner-admin/login")
                onExpired();
            } catch {}
          }}
          onShouldStartLoadWithRequest={(request) => {
            const decision = portalNavigation(request.url, session.origin);
            if (decision === "external") {
              void Linking.openURL(request.url).catch(() =>
                setError("Unable to open this link."),
              );
              return false;
            }
            return decision === "internal";
          }}
          onError={() =>
            setError(
              "The portal could not load. Check your connection and retry.",
            )
          }
          onHttpError={({ nativeEvent }) => {
            if (nativeEvent.statusCode === 401) onExpired();
            else if (nativeEvent.statusCode >= 400)
              setError(
                `The portal returned ${nativeEvent.statusCode}. Retry or update the website backend.`,
              );
          }}
        />
      )}
    </View>
  );
}
