import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCustomization } from "../lib/config";
import type { CoarseLocation } from "../lib/types";

interface Props {
  location: CoarseLocation | null;
  nearbyCount: number;
  onRefreshLocation: () => Promise<void>;
  loading?: boolean;
}

export function LocationRadar({
  location,
  nearbyCount,
  onRefreshLocation,
  loading,
}: Props) {
  const { config } = useCustomization();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Geospatial Proximity Beacon</Text>
          <Text style={styles.subtitle}>
            Loi 25 privacy-coarsened to 1.0 km. Live telemetry via Redis GEO.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, { borderColor: config.theme.accentColor }]}
          onPress={onRefreshLocation}
          disabled={loading}
        >
          <Text style={[styles.refreshText, { color: config.theme.accentColor }]}>
            {loading ? "…" : "Ping GPS"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Grid Location</Text>
          <Text style={styles.metricValue}>
            {location ? `${location.lat}°N, ${location.lng}°W` : "Awaiting fix…"}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Active Nearby</Text>
          <Text style={[styles.metricValue, { color: config.theme.accentColor }]}>
            {nearbyCount} members
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Search Radius</Text>
          <Text style={styles.metricValue}>{config.matching.defaultRadiusKm} km</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f4f4f5",
  },
  subtitle: {
    fontSize: 12,
    color: "#a1a1aa",
    marginTop: 2,
    maxWidth: 220,
  },
  refreshBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#09090b",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  metricItem: {
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 11,
    color: "#a1a1aa",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f4f4f5",
  },
});
