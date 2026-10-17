import type { Decision } from "@krizaka/app-config/client";
import { ForceUpdateScreen, MaintenanceScreen, UpdatePrompt, YasakiaMark } from "@krizaka/ui/native";
import { Linking } from "react-native";

import { useSay } from "@/lib/i18n";

/**
 * What the app-version contract decided (krizaka/.github#75): maintenance or a forced update replace the app, a soft
 * update is a prompt the person may dismiss; otherwise the app itself. The texts come from the server when it sends one.
 */
export function AppGate({ decision, onDismiss, onRetry, children }: { decision: Decision; onDismiss: () => void; onRetry: () => void; children: React.ReactNode }) {
  const { say } = useSay();
  const open = (url: string | null) => {
    if (url) void Linking.openURL(url);
  };
  if (decision.kind === "maintenance") {
    return <MaintenanceScreen fill mark={<YasakiaMark size={64} />} title={say("update.maintenanceTitle")} message={decision.config.maintenance.message ?? undefined} retryLabel={say("common.retry")} onRetry={onRetry} />;
  }
  if (decision.kind === "force") {
    const c = decision.config;
    return <ForceUpdateScreen fill mark={<YasakiaMark size={64} />} title={say("update.forceTitle")} message={c.message ?? undefined} versionLabel={say("update.version", { version: c.latestVersion })} updateLabel={say("update.update")} onUpdate={() => open(c.storeUrl)} retryLabel={say("common.retry")} onRetry={onRetry} />;
  }
  return (
    <>
      {children}
      {decision.kind === "soft" ? (
        <UpdatePrompt title={say("update.softTitle")} message={decision.config.message ?? undefined} versionLabel={say("update.version", { version: decision.config.latestVersion })} updateLabel={say("update.update")} onUpdate={() => open(decision.config.storeUrl)} laterLabel={say("update.later")} onLater={onDismiss} />
      ) : null}
    </>
  );
}
