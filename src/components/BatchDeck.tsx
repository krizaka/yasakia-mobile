import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCustomization } from "../lib/config";
import type { BatchCandidate, BatchDecision } from "../lib/types";

interface Props {
  candidates: BatchCandidate[];
  onDecision: (candidateId: string, decision: BatchDecision) => void;
  loading?: boolean;
}

export function BatchDeck({ candidates, onDecision, loading }: Props) {
  const { config } = useCustomization();

  if (candidates.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Batch Open</Text>
        <Text style={styles.emptyDescription}>
          Your agent is exploring the nearby community to assemble candidates who fit you both ways.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Daily Bilateral Batch</Text>
        <Text style={styles.bannerSub}>
          Words, never a score. Curated by your agent within {config.matching.defaultRadiusKm} km.
        </Text>
      </View>

      {candidates.map((person) => (
        <View key={person.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.personName}>
                {person.displayName}, {person.age}
              </Text>
              <Text style={styles.personCity}>{person.city}</Text>
            </View>
          </View>

          {/* Bilateral Explanations */}
          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>Why you two:</Text>
            <Text style={styles.reasonText}>{person.whyYou}</Text>
          </View>

          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>And why you, for them:</Text>
            <Text style={styles.reasonText}>{person.whyThem}</Text>
          </View>

          {/* Interests Tags */}
          {person.interests?.length > 0 && (
            <View style={styles.tagsRow}>
              {person.interests.map((tag) => (
                <View key={tag} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.passBtn]}
              onPress={() => onDecision(person.id, "PASS")}
              disabled={loading}
            >
              <Text style={styles.passBtnText}>Pass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.moreBtn]}
              onPress={() => onDecision(person.id, "TELL_ME_MORE")}
              disabled={loading}
            >
              <Text style={styles.moreBtnText}>Tell Me More</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.interestedBtn,
                { backgroundColor: config.theme.accentColor },
              ]}
              onPress={() => onDecision(person.id, "INTERESTED")}
              disabled={loading}
            >
              <Text style={styles.interestedBtnText}>Interested</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  banner: {
    paddingVertical: 8,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f4f4f5",
  },
  bannerSub: {
    fontSize: 13,
    color: "#a1a1aa",
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f4f4f5",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  personName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f4f4f5",
  },
  personCity: {
    fontSize: 13,
    color: "#a1a1aa",
  },
  reasonBox: {
    backgroundColor: "#09090b",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#a1a1aa",
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 13,
    color: "#e4e4e7",
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagBadge: {
    backgroundColor: "#27272a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: "#d4d4d8",
  },
  actionBar: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  passBtn: {
    backgroundColor: "#27272a",
  },
  passBtnText: {
    color: "#a1a1aa",
    fontSize: 13,
    fontWeight: "600",
  },
  moreBtn: {
    borderWidth: 1,
    borderColor: "#3f3f46",
    backgroundColor: "transparent",
  },
  moreBtnText: {
    color: "#f4f4f5",
    fontSize: 13,
    fontWeight: "600",
  },
  interestedBtn: {
    // color filled via config.theme.accentColor
  },
  interestedBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
