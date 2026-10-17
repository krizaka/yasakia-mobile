import { appStateResume, useAppConfig } from "@krizaka/app-config/react";
import { KrizakaQueryProvider } from "@krizaka/query";
import { brands } from "@krizaka/tokens/native";
import { ThemeProvider, Toaster, useTheme } from "@krizaka/ui/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppGate } from "@/components/AppGate";
import { appConfig, setUpApi } from "@/lib/api";
import { AuthProvider } from "@/lib/auth";
import { deviceLocale, i18n, LocaleProvider } from "@/lib/i18n";

setUpApi();
const resume = appStateResume(AppState);

/** The app: the Yasakia theme over the Krizaka roles, the app-version gate, the session, then the screens. */
function Root() {
  const { theme, scheme } = useTheme();
  const version = useAppConfig(appConfig, resume);
  const decision = version.upgradeRequired ? { kind: "force" as const, config: version.upgradeRequired } : version.decision;
  return (
    <AppGate decision={decision} onDismiss={version.dismissSoft} onRetry={version.refresh}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.surface0 } }} />
      <Toaster closeLabel={i18n.translator(deviceLocale())("common.close")} />
    </AppGate>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider overrides={brands.yasakia}>
        <LocaleProvider value={deviceLocale()}>
          <KrizakaQueryProvider>
            <AuthProvider>
              <Root />
            </AuthProvider>
          </KrizakaQueryProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
