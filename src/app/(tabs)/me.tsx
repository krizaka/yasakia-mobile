import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../lib/api";
import { Header } from "../../components/Header";
import { LocationRadar } from "../../components/LocationRadar";
import { useCustomization } from "../../lib/config";
import { getCurrentCoarseLocation, startLocationSubscription } from "../../lib/geo";
import { useLive } from "../../lib/live";
import type { CoarseLocation } from "../../lib/types";

export default function MeScreen() {
  const { config, version, reloadConfig } = useCustomization();
  const { nearbyCount } = useLive();
  const [location, setLocation] = useState<CoarseLocation | null>({
    lat: 45.52,
    lng: -73.58,
    precisionM: 1000,
  });
  const [syncingLocation, setSyncingLocation] = useState(false);

  // Sync location to backend
  const syncLocation = async (coords: CoarseLocation) => {
    setLocation(coords);
    try {
      await api.updateLocation(coords);
    } catch {
      // Swallows error during offline simulation
    }
  };

  const handlePingGps = async () => {
    setSyncingLocation(true);
    try {
      const loc = await getCurrentCoarseLocation();
      if (loc) {
        await syncLocation(loc);
      }
    } finally {
      setSyncingLocation(false);
    }
  };

  // Setup location watcher
  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    void startLocationSubscription((newLoc) => {
      void syncLocation(newLoc);
    }).then((s) => {
      sub = s;
    });

    return () => {
      if (sub) sub.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Geospatial Beacon & Settings</Text>
          <Text style={styles.screenSub}>
            Live location updates feeding Redis GEO & PostGIS spatial clusters.
          </Text>
        </View>

        {/* Location Radar Component */}
        <LocationRadar
          location={location}
          nearbyCount={nearbyCount}
          onRefreshLocation={handlePingGps}
          loading={syncingLocation}
        />

        {/* Dynamic Admin Customization Inspector */}
        <View style={styles.studioCard}>
          <View style={styles.studioHeader}>
            <Text style={styles.studioTitle}>Active Studio Parameters</Text>
            <View style={[styles.versionBadge, { backgroundColor: config.theme.accentColor }]}>
              <Text style={styles.versionText}>Studio v{version}</Text>
            </View>
          </View>

          <View style={styles.paramGrid}>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Brand Hue</Text>
              <Text style={styles.paramValue}>{config.theme.brandHue}</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Border Radius</Text>
              <Text style={styles.paramValue}>{config.theme.borderRadius}</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Default Radius</Text>
              <Text style={styles.paramValue}>{config.matching.defaultRadiusKm} km</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Max Radius</Text>
              <Text style={styles.paramValue}>{config.matching.maxRadiusKm} km</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Min Affinity</Text>
              <Text style={styles.paramValue}>{config.matching.minAffinity}</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Batch Size</Text>
              <Text style={styles.paramValue}>{config.matching.batchSize} / day</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.reloadBtn, { borderColor: config.theme.accentColor }]}
            onPress={reloadConfig}
          >
            <Text style={[styles.reloadText, { color: config.theme.accentColor }]}>
              Pull Latest Admin Overrides
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy & Governance Invariants */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>Loi 25 & Zero-Score Guarantee</Text>
          <Text style={styles.privacyText}>
            • Exact coordinates are never transmitted or stored (1.0 km rounding).
          </Text>
          <Text style={styles.privacyText}>
            • Compatibility is expressed strictly in bilateral prose, never as a number.
          </Text>
          <Text style={styles.privacyText}>
            • Telemetry is pseudonymized with HMAC-SHA256 prior to data processing.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  container: {
    padding: 16,
    gap: 16,
  },
  titleRow: {
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f4f4f5",
  },
  screenSub: {
    fontSize: 13,
    color: "#a1a1aa",
    marginTop: 2,
  },
  studioCard: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 16,
    gap: 12,
  },
  studioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studioTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f4f4f5",
  },
  versionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  versionText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  paramGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  paramItem: {
    width: "48%",
    backgroundColor: "#09090b",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  paramLabel: {
    fontSize: 10,
    color: "#a1a1aa",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  paramValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f4f4f5",
  },
  reloadBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  reloadText: {
    fontSize: 13,
    fontWeight: "600",
  },
  privacyCard: {
    backgroundColor: "#09090b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 16,
    gap: 6,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f4f4f5",
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 12,
    color: "#a1a1aa",
    lineHeight: 18,
  },
});
