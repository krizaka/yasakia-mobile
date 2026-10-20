import { BatchIcon, ChatIcon, HomeIcon, ImageIcon, IntroIcon } from "@krizaka/icons/native";
import { TabBar } from "@krizaka/ui/native";
import { Redirect, Slot, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { View } from "react-native";

import { useAuth } from "@/lib/auth";
import { i18n, LocaleProvider, type Key, useSay } from "@/lib/i18n";
import { currentEntry, hrefOf, type NavId, USER_NAV } from "@/lib/nav";

const ICONS: Record<NavId, (color: string) => React.ReactNode> = {
  dashboard: (color) => <HomeIcon color={color} />,
  talk: (color) => <ChatIcon color={color} />,
  photos: (color) => <ImageIcon color={color} />,
  batch: (color) => <BatchIcon color={color} />,
  myIntros: (color) => <IntroIcon color={color} />,
};

/** The five destinations of the web console, from `lib/nav.ts` (the data), in the order of the journey. */
function Tabs({ locale }: { locale: string }) {
  const { say } = useSay();
  const router = useRouter();
  const current = currentEntry(usePathname());
  return (
    <TabBar<NavId>
      aria-label={say("tabs.label")}
      items={USER_NAV.map((entry) => ({ value: entry.id, label: say(`tabs.${entry.id}` as Key), icon: (_on: boolean, color: string) => ICONS[entry.id](color) }))}
      value={current.id}
      onValueChange={(next) => router.replace(hrefOf(locale, USER_NAV.find((e) => e.id === next) ?? USER_NAV[0]))}
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
