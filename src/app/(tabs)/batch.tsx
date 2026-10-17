import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../lib/api";
import { BatchDeck } from "../../components/BatchDeck";
import { Header } from "../../components/Header";
import type { BatchCandidate, BatchDecision } from "../../lib/types";

const DEMO_BATCH: BatchCandidate[] = [
  {
    id: "cand-1",
    displayName: "Camille",
    age: 29,
    city: "Montreal, Plateau",
    whyYou: "You both value slow weekend coffees, independent bookstore visits, and direct honest conversations.",
    whyThem: "Camille seeks someone grounded with an analytical mind who appreciates design and architecture.",
    photos: [],
    interests: ["Reading", "Architecture", "Coffee", "Cinema"],
  },
  {
    id: "cand-2",
    displayName: "Alexandre",
    age: 31,
    city: "Montreal, Mile End",
    whyYou: "Shared focus on creative independence and curiosity about how complex distributed systems work.",
    whyThem: "Alexandre looks for someone passionate who enjoys quiet dinners and thoughtful debate.",
    photos: [],
    interests: ["Design", "Art", "Music", "Hiking"],
  },
];

export default function BatchScreen() {
  const [candidates, setCandidates] = useState<BatchCandidate[]>(DEMO_BATCH);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadBatch() {
      try {
        const data = await api.getCurrentBatch();
        if (data && data.candidates && data.candidates.length > 0) {
          setCandidates(data.candidates);
        }
      } catch {
        // Fallback to demo batch
      }
    }
    void loadBatch();
  }, []);

  const handleDecision = async (candidateId: string, decision: BatchDecision) => {
    setLoading(true);
    try {
      await api.submitDecision(candidateId, decision);
    } catch {
      // Local optimistic update
    } finally {
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header />
      <View style={styles.content}>
        <BatchDeck
          candidates={candidates}
          onDecision={handleDecision}
          loading={loading}
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
  content: {
    flex: 1,
  },
});
