import React, { createContext, useContext, useEffect, useState } from "react";
import EventSource from "react-native-sse";
import * as Notifications from "expo-notifications";
import { API_BASE_URL, getAuthToken } from "./api";
import { useCustomization } from "./config";

export interface LiveContextValue {
  connected: boolean;
  nearbyCount: number;
}

const LiveContext = createContext<LiveContextValue>({
  connected: false,
  nearbyCount: 0,
});

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [nearbyCount, setNearbyCount] = useState(0);
  const { reloadConfig } = useCustomization();

  useEffect(() => {
    let es: EventSource | null = null;
    let active = true;

    async function connect() {
      const token = await getAuthToken();
      if (!active) return;

      const url = `${API_BASE_URL}/api/realtime`;
      es = new EventSource(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      es.addEventListener("open", () => {
        if (active) setConnected(true);
      });

      es.addEventListener("error", () => {
        if (active) setConnected(false);
      });

      es.addEventListener("message", (event) => {
        if (!event.data) return;
        try {
          const payload = JSON.parse(event.data);
          switch (payload.type) {
            case "config.updated":
              void reloadConfig();
              break;
            case "location.nearby":
              if (typeof payload.count === "number") {
                setNearbyCount(payload.count);
              }
              break;
            case "batch.ready":
              void Notifications.scheduleNotificationAsync({
                content: {
                  title: "Yasakia",
                  body: "Your daily batch is ready. 3 people who fit both ways.",
                },
                trigger: null,
              });
              break;
            case "intro.opened":
              void Notifications.scheduleNotificationAsync({
                content: {
                  title: "New Introduction",
                  body: "You both expressed mutual interest. Say hello!",
                },
                trigger: null,
              });
              break;
            case "intro.message":
              void Notifications.scheduleNotificationAsync({
                content: {
                  title: "New Message",
                  body: "A new message arrived in your introduction.",
                },
                trigger: null,
              });
              break;
          }
        } catch (e) {
          console.warn("[live] failed to parse event:", e);
        }
      });
    }

    void connect();

    return () => {
      active = false;
      if (es) {
        es.close();
      }
    };
  }, [reloadConfig]);

  return (
    <LiveContext.Provider value={{ connected, nearbyCount }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() {
  return useContext(LiveContext);
}
