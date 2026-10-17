import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { ConfigProvider } from "../lib/config";
import { LiveProvider } from "../lib/live";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ConfigProvider>
        <LiveProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#09090b" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="intro/[id]"
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: "#09090b" },
                headerTintColor: "#f4f4f5",
                title: "Introduction",
              }}
            />
          </Stack>
        </LiveProvider>
      </ConfigProvider>
    </SafeAreaProvider>
  );
}
