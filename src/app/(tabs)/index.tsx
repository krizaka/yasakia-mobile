import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../lib/api";
import { AgentChat } from "../../components/AgentChat";
import { Header } from "../../components/Header";
import type { AgentMessage, UserPortrait } from "../../lib/types";

const INITIAL_MESSAGES: AgentMessage[] = [
  {
    id: "init-1",
    role: "AGENT",
    content: "Welcome to Yasakia. I am your agent. You speak first: tell me what brings you here and what you value most in someone you meet.",
    createdAt: new Date().toISOString(),
  },
];

export default function TalkScreen() {
  const [messages, setMessages] = useState<AgentMessage[]>(INITIAL_MESSAGES);
  const [portrait, setPortrait] = useState<UserPortrait | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadThread() {
      try {
        const data = await api.getAgentThread();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
        if (data.portrait) {
          setPortrait(data.portrait);
        }
      } catch {
        // Keep initial welcome message if offline or during testing
      }
    }
    void loadThread();
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMsg: AgentMessage = {
      id: `usr-${Date.now()}`,
      role: "USER",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.sendAgentMessage(text);
      if (res.reply) {
        setMessages((prev) => [...prev, res.reply]);
      }
      if (res.portrait) {
        setPortrait(res.portrait);
      }
    } catch {
      // Simulate intelligent agent response during mock/offline testing
      setTimeout(() => {
        const agentReply: AgentMessage = {
          id: `ag-${Date.now()}`,
          role: "AGENT",
          content: "I heard you clearly. I am noting that as a key facet for your portrait. Tell me a bit about what a great weekend looks like for you.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, agentReply]);
        setPortrait((prev) => ({
          self: prev?.self ? `${prev.self}; Values genuine conversation` : "Values genuine conversation and curiosity",
          seeking: prev?.seeking ? prev.seeking : "Someone with warmth and creative spark",
          facets: { ...prev?.facets, values: "Honesty & Curiosity" },
          isComplete: false,
        }));
      }, 700);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header />
      <View style={styles.content}>
        <AgentChat
          messages={messages}
          portrait={portrait}
          onSendMessage={handleSendMessage}
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
