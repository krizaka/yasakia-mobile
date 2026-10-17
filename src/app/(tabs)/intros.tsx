import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { Header } from "../../components/Header";
import { useCustomization } from "../../lib/config";
import type { IntroSummary } from "../../lib/types";

const DEMO_INTROS: IntroSummary[] = [
  {
    id: "intro-1",
    partnerName: "Sophie",
    lastMessage: "I really loved that coffee shop suggestion by the canal!",
    lastMessageAt: "10m ago",
    unreadCount: 1,
    state: "OPEN",
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
  },
  {
    id: "intro-2",
    partnerName: "Julien",
    lastMessage: "Looking forward to hearing about your project.",
    lastMessageAt: "2h ago",
    unreadCount: 0,
    state: "CONTINUED",
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  },
];

export default function IntrosScreen() {
  const router = useRouter();
  const { config } = useCustomization();
  const [intros, setIntros] = useState<IntroSummary[]>(DEMO_INTROS);

  useEffect(() => {
    async function loadIntros() {
      try {
        const list = await api.getIntros();
        if (list && list.length > 0) {
          setIntros(list);
        }
      } catch {
        // Fallback to demo intros
      }
    }
    void loadIntros();
  }, []);

  const renderItem = ({ item }: { item: IntroSummary }) => (
    <TouchableOpacity
      style={styles.introCard}
      onPress={() => router.push(`/intro/${item.id}`)}
    >
      <View style={[styles.avatar, { backgroundColor: config.theme.accentColor }]}>
        <Text style={styles.avatarLetter}>{item.partnerName[0]}</Text>
      </View>

      <View style={styles.infoCol}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{item.partnerName}</Text>
          <Text style={styles.time}>{item.lastMessageAt || "Recently"}</Text>
        </View>
        <Text style={styles.lastMsg} numberOfLines={1}>
          {item.lastMessage || "Introduction open. Say hello!"}
        </Text>
      </View>

      {item.unreadCount > 0 && (
        <View style={[styles.unreadDot, { backgroundColor: config.theme.accentColor }]}>
          <Text style={styles.unreadCount}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header />
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Introductions</Text>
          <Text style={styles.screenSub}>
            Mutual bilateral connections. Free from public profiles or catalogs.
          </Text>
        </View>

        <FlatList
          data={intros}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No open introductions yet.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  titleRow: {
    marginBottom: 16,
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
  listContent: {
    gap: 10,
  },
  introCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f4f4f5",
  },
  time: {
    fontSize: 11,
    color: "#71717a",
  },
  lastMsg: {
    fontSize: 13,
    color: "#a1a1aa",
  },
  unreadDot: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    color: "#71717a",
    fontSize: 14,
  },
});
