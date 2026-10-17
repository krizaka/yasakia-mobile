import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import type { CustomizationConfig } from "./types";

export const DEFAULT_CONFIG: CustomizationConfig = {
  theme: {
    brandHue: "emerald",
    accentColor: "#10b981",
    borderRadius: "rounded",
    fontDensity: "default",
  },
  branding: {
    appName: "Yasakia",
    tagline: "Talk first. Meet nearby without catalogue or score.",
  },
  matching: {
    defaultRadiusKm: 25,
    maxRadiusKm: 50,
    minAffinity: 0.65,
    batchSize: 3,
    cooldownHours: 24,
  },
  taxonomy: {
    interests: ["Architecture", "Music", "Coffee", "Cinema", "Reading", "Hiking", "Art", "Design"],
    values: ["Honesty", "Curiosity", "Kindness", "Patience"],
    intents: ["LONG_TERM", "FRIENDSHIP_FIRST"],
  },
  featureFlags: {
    voiceNotesEnabled: true,
    instantMatchesEnabled: true,
    proximityAlertsEnabled: true,
    debriefRequired: true,
  },
};

const CONFIG_CACHE_KEY = "yasakia_client_config";

export interface ConfigContextValue {
  config: CustomizationConfig;
  version: number;
  reloadConfig: () => Promise<void>;
  updateConfigLocally: (newConfig: CustomizationConfig, ver: number) => void;
}

const ConfigContext = createContext<ConfigContextValue>({
  config: DEFAULT_CONFIG,
  version: 1,
  reloadConfig: async () => {},
  updateConfigLocally: () => {},
});

export function ConfigProvider({ children, apiBase = "http://10.0.2.2:3000" }: { children: React.ReactNode; apiBase?: string }) {
  const [config, setConfig] = useState<CustomizationConfig>(DEFAULT_CONFIG);
  const [version, setVersion] = useState<number>(1);

  const fetchRemoteConfig = async () => {
    try {
      const res = await fetch(`${apiBase}/api/config/client`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config && typeof data.version === "number") {
          setConfig(data.config);
          setVersion(data.version);
          await SecureStore.setItemAsync(CONFIG_CACHE_KEY, JSON.stringify(data)).catch(() => {});
        }
      }
    } catch {
      // Fallback to cached config or default
      try {
        const cached = await SecureStore.getItemAsync(CONFIG_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setConfig(parsed.config);
          setVersion(parsed.version);
        }
      } catch {
        // Keep default
      }
    }
  };

  useEffect(() => {
    void fetchRemoteConfig();
  }, [apiBase]);

  const updateConfigLocally = (newConfig: CustomizationConfig, ver: number) => {
    setConfig(newConfig);
    setVersion(ver);
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        version,
        reloadConfig: fetchRemoteConfig,
        updateConfigLocally,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useCustomization() {
  return useContext(ConfigContext);
}
