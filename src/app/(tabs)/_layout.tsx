import React from "react";
import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useCustomization } from "../../lib/config";

function TabIcon({ label, focused }: { label: string; focused: boolean; color?: any }) {
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  const { config } = useCustomization();
  const accentColor = config.theme.accentColor || "#10b981";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#09090b",
          borderTopColor: "#27272a",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: "#71717a",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Talk",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="💬" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="batch"
        options={{
          title: "Batch",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="🎯" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="intros"
        options={{
          title: "Intros",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="🤝" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Beacon",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="📍" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
