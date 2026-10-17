import { BatchIcon, ChatIcon } from "@krizaka/icons/native";
import { TabBar } from "@krizaka/ui/native";
import { Redirect, Slot, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { View } from "react-native";

import { useAuth } from "@/lib/auth";
import { i18n, LocaleProvider, useSay } from "@/lib/i18n";

type Tab = "talk" | "batch";

function Tabs({ locale }: { locale: string }) {
  const { say } = useSay();
  const router = useRouter();
  const path = usePathname();
  const value: Tab = path.endsWith("/batch") ? "batch" : "talk";
  return (
    <TabBar<Tab>
      aria-label={say("tabs.label")}
      items={[
        { value: "talk", label: say("tabs.talk"), icon: (_on, color) => <ChatIcon color={color} /> },
        { value: "batch", label: say("tabs.batch"), icon: (_on, color) => <BatchIcon color={color} /> },
      ]}
      value={value}
      onValueChange={(next) => router.replace(`/app/${locale}/${next}`)}
    />
  );
}

/**
 * The person's space, under the same addresses as the web (`/app/{en|fr}/…`): a universal link to dev.yasakia.com opens
 * the same screen here (krizaka/.github#81). The language is the address's.
 */
export default function SpaceLayout() {
  const { locale: raw } = useLocalSearchParams<{ locale: string }>();
  const locale = i18n.asLocale(raw);
  const { state } = useAuth();
  if (state.status === "signedOut") return <Redirect href="/sign-in" />;
  return (
    <LocaleProvider value={locale}>
      <View style={{ flex: 1 }}>
        <Slot />
        <Tabs locale={locale} />
      </View>
    </LocaleProvider>
  );
}
