import { IntroIcon } from "@krizaka/icons/native";
import { defineKeys, krizakaFetch, useQuery } from "@krizaka/query";
import { ConversationItem, EmptyState, Header, Screen } from "@krizaka/ui/native";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { errorKey } from "@/lib/api";
import { type Key, useSay } from "@/lib/i18n";
import { IntroList } from "@/lib/types";

export const introKeys = defineKeys("intros", { list: () => ["list"], detail: (id: string) => ["detail", id] });

/** My introductions: the people who said yes to me as I said yes to them — the live ones first. */
export default function IntrosScreen() {
  const { say, locale } = useSay();
  const router = useRouter();
  const list = useQuery({ queryKey: introKeys.list(), queryFn: ({ signal }) => krizakaFetch("/api/intros", { signal, schema: IntroList }).then((r) => r.intros) });
  const day = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const intros = list.data ?? [];
  return (
    <Screen scroll header={<Header title={say("intros.title")} subtitle={say("intros.lead")} />}>
      {list.isError ? (
        <EmptyState title={say("intros.emptyTitle")} description={say(`errors.${errorKey(list.error)}` as Key)} />
      ) : intros.length === 0 && !list.isPending ? (
        <EmptyState icon={<IntroIcon />} title={say("intros.emptyTitle")} description={say("intros.emptyDescription")} />
      ) : (
        <View accessibilityRole="list">
          {intros.map((i) => (
            <ConversationItem
              key={i.id}
              name={i.name || say("intros.someone")}
              preview={i.state === "OPEN" ? say("intros.openUntil", { date: day.format(new Date(i.expiresAt)) }) : say(`intros.states.${i.state}`)}
              time={i.lastMessageAt ? day.format(new Date(i.lastMessageAt)) : undefined}
              onPress={() => router.push(`/app/${locale}/intros/${i.id}`)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
