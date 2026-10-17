import React, { useEffect, useState } from "react";
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
import { useLocalSearchParams } from "expo-router";
import { api } from "../../lib/api";
import { useCustomization } from "../../lib/config";
import type { IntroMessage } from "../../lib/types";

export default function IntroChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { config } = useCustomization();
  const [messages, setMessages] = useState<IntroMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const msgs = await api.getIntroMessages(id);
        if (msgs && msgs.length > 0) {
          setMessages(msgs);
        }
      } catch {
        // Fallback demo intro conversation
        setMessages([
          {
            id: "m-1",
            introId: id,
            senderId: "partner",
            content: "Hi! Nice to connect. Your agent's note about quiet cafes resonated with me.",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);
      }
    }
    void load();
  }, [id]);

  const handleSend = async () => {
    if (!input.trim() || sending || !id) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    const localMsg: IntroMessage = {
      id: `local-${Date.now()}`,
      introId: id,
      senderId: "me",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, localMsg]);

    try {
      await api.sendIntroMessage(id, content);
    } catch {
      // Optimistic local fallback during testing
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: IntroMessage }) => {
    const isMe = item.senderId === "me";
    return (
      <View style={[styles.bubbleWrap, isMe ? styles.myWrap : styles.theirWrap]}>
        <View
          style={[
            styles.bubble,
            isMe
              ? [styles.myBubble, { backgroundColor: config.theme.accentColor }]
              : styles.theirBubble,
          ]}
        >
          <Text style={[styles.msgText, isMe ? styles.myText : styles.theirText]}>
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
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Write a message…"
          placeholderTextColor="#71717a"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: config.theme.accentColor },
            (!input.trim() || sending) && styles.sendDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendBtnText}>{sending ? "…" : "Send"}</Text>
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
  list: {
    padding: 16,
    gap: 8,
  },
  bubbleWrap: {
    flexDirection: "row",
    marginVertical: 4,
  },
  myWrap: {
    justifyContent: "flex-end",
  },
  theirWrap: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: "#27272a",
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myText: {
    color: "#ffffff",
  },
  theirText: {
    color: "#f4f4f5",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#27272a",
    backgroundColor: "#18181b",
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#09090b",
    borderRadius: 20,
    paddingHorizontal: 16,
    color: "#f4f4f5",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  sendBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
});
