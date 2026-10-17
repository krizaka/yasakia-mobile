import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCustomization } from "../lib/config";
import type { AgentMessage, UserPortrait } from "../lib/types";

interface Props {
  messages: AgentMessage[];
  portrait: UserPortrait | null;
  onSendMessage: (text: string) => Promise<void>;
  loading?: boolean;
}

export function AgentChat({ messages, portrait, onSendMessage, loading }: Props) {
  const { config } = useCustomization();
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    const text = inputText.trim();
    setInputText("");
    setSending(true);
    try {
      await onSendMessage(text);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: AgentMessage }) => {
    const isUser = item.role === "USER";
    return (
      <View style={[styles.bubbleWrap, isUser ? styles.userWrap : styles.agentWrap]}>
        {!isUser && (
          <View style={[styles.avatarMini, { backgroundColor: config.theme.accentColor }]}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: config.theme.accentColor }]
              : styles.agentBubble,
          ]}
        >
          <Text style={[styles.bubbleText, isUser ? styles.userText : styles.agentText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      {/* Portrait Summary Header */}
      {portrait && (
        <View style={styles.portraitBox}>
          <Text style={styles.portraitTitle}>Your Agent Portrait</Text>
          <Text style={styles.portraitSummary} numberOfLines={2}>
            {portrait.self || "Getting to know you through conversation…"}
          </Text>
        </View>
      )}

      {/* Messages Feed */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        inverted={false}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Speak with your agent in your own words…"
          placeholderTextColor="#71717a"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: config.theme.accentColor },
            (!inputText.trim() || sending) && styles.sendDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          <Text style={styles.sendText}>{sending ? "…" : "Send"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  portraitBox: {
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  portraitTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#a1a1aa",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  portraitSummary: {
    fontSize: 13,
    color: "#f4f4f5",
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  bubbleWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginVertical: 4,
  },
  userWrap: {
    justifyContent: "flex-end",
  },
  agentWrap: {
    justifyContent: "flex-start",
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    backgroundColor: "#27272a",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: "#ffffff",
  },
  agentText: {
    color: "#f4f4f5",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#27272a",
    backgroundColor: "#18181b",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#09090b",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: "#f4f4f5",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  sendButton: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
});
