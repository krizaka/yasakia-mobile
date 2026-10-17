import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useCustomization } from "../lib/config";
import { useLive } from "../lib/live";

export function Header() {
  const { config } = useCustomization();
  const { connected, nearbyCount } = useLive();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View
          style={[
            styles.logoMark,
            { backgroundColor: config.theme.accentColor || "#10b981" },
          ]}
        >
          <Text style={styles.logoText}>🥷</Text>
        </View>
        <View>
          <Text style={styles.appName}>{config.branding.appName}</Text>
          <Text style={styles.tagline} numberOfLines={1}>
            {config.branding.tagline}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.badge}>
          <View
            style={[
              styles.dot,
              { backgroundColor: connected ? "#10b981" : "#71717a" },
            ]}
          />
          <Text style={styles.badgeText}>
            {connected ? `${nearbyCount} nearby` : "offline"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#27272a",
    backgroundColor: "#09090b",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 18,
  },
  appName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#f4f4f5",
  },
  tagline: {
    fontSize: 11,
    color: "#a1a1aa",
    maxWidth: 180,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#18181b",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    color: "#d4d4d8",
    fontWeight: "500",
  },
});
