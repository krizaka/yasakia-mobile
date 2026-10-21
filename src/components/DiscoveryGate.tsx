import { pickMessage } from "@krizaka/discovery";
import { DiscoveryGate as Gate, DiscoveryProvider, type DiscoveryProviderProps } from "@krizaka/discovery/react";
import { ForceUpdateScreen, MaintenanceScreen, useTheme, YasakiaMark } from "@krizaka/ui/native";
import { AppState, Linking, Platform, View } from "react-native";

import { discovery, UPDATE_URL } from "@/lib/config";
import { useSay } from "@/lib/i18n";

/** The app came back to the foreground → one manifest refresh (a stable function: the provider subscribes once). */
export const onForeground: NonNullable<DiscoveryProviderProps["subscribeForeground"]> = (callback) => {
  const subscription = AppState.addEventListener("change", (state) => state === "active" && callback());
  return () => subscription.remove();
};

/** What the signed manifest decided (krizaka/.github ADR-003): a build below `minAppVersion` or a maintenance window replaces the app. */
export function DiscoveryGate({ children }: { children: React.ReactNode }) {
  const { say, locale } = useSay();
  const retry = () => void discovery.refresh();
  return (
    <Gate
      product="yasakia"
      update={(gate) => (
        <ForceUpdateScreen
          fill
          mark={<YasakiaMark size={64} />}
          title={say("update.forceTitle")}
          message={pickMessage(gate.message, locale)}
          versionLabel={say("update.version", { version: gate.latestAppVersion })}
          updateLabel={say("update.update")}
          onUpdate={() => void Linking.openURL(Platform.OS === "ios" ? UPDATE_URL.ios : UPDATE_URL.android)}
          retryLabel={say("common.retry")}
          onRetry={retry}
        />
      )}
      maintenance={(gate) => (
        <MaintenanceScreen fill mark={<YasakiaMark size={64} />} title={say("update.maintenanceTitle")} message={pickMessage(gate.message, locale)} retryLabel={say("common.retry")} onRetry={retry} />
      )}
    >
      {children}
    </Gate>
  );
}

/** Starts discovery (the cache answers at once; a first launch waits at most a few seconds) and keeps it fresh while the app lives. */
export function Discovery({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <DiscoveryProvider discovery={discovery} subscribeForeground={onForeground} loading={<View style={{ flex: 1, backgroundColor: theme.surface0 }} />}>
      {children}
    </DiscoveryProvider>
  );
}
