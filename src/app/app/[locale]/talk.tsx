import { defineKeys, krizakaFetch, useMutation, useQuery, useQueryClient } from "@krizaka/query";
import { Button, Card, CardBody, CardTitle, Header, MessageBubble, MessageComposer, Screen, Txt, TypingIndicator } from "@krizaka/ui/native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { errorKey } from "@/lib/api";
import { type Key, useSay } from "@/lib/i18n";
import { AgentAnswer } from "@/lib/types";

export const agentKeys = defineKeys("agent", { view: () => ["view"] });
/** While the agent works on a turn, the conversation is read again this often. */
const FOLLOW_MS = 2500; // @fixed: interface refresh rate, not a business parameter

/** Talk first: the conversation with the agent, then the portrait it wrote — in words, both ways, never a score. */
export default function Talk() {
  const { say, locale } = useSay();
  const router = useRouter();
  const client = useQueryClient();
  const [draft, setDraft] = useState("");
  const query = useQuery({
    queryKey: agentKeys.view(),
    queryFn: ({ signal }) => krizakaFetch("/api/agent", { signal, schema: AgentAnswer }).then((r) => r.agent),
    refetchInterval: (q) => (q.state.data?.state === "ONBOARDING" && q.state.data.waiting ? FOLLOW_MS : false),
  });
  const send = useMutation({
    mutationFn: (content: string) => krizakaFetch("/api/agent/messages", { method: "POST", json: { content, locale } }),
    onSuccess: () => setDraft(""),
    onSettled: () => client.invalidateQueries({ queryKey: agentKeys.view() }),
  });
  const agent = query.data;
  const closed = agent ? agent.state !== "ONBOARDING" : true;
  const submit = () => {
    const content = draft.trim();
    if (content && !send.isPending && !closed) send.mutate(content);
  };
  return (
    <Screen
      scroll
      keyboard
      header={<Header title={say("talk.title")} subtitle={say("talk.lead")} />}
      footer={<MessageComposer value={draft} onValueChange={setDraft} onSend={submit} placeholder={say("talk.placeholder")} sendLabel={say("talk.send")} disabledReason={closed ? say("talk.closed") : undefined} maxLength={1500} />}
    >
      <View accessibilityRole="list" style={{ gap: 8 }}>
        {agent?.messages.map((m) => (
          <MessageBubble key={m.id} mine={m.role === "USER"} text={m.content} />
        ))}
        {send.isPending || agent?.waiting ? <TypingIndicator label={say("talk.thinking")} /> : null}
      </View>
      {send.isError ? <Txt tone="danger">{say(`errors.${errorKey(send.error)}` as Key)}</Txt> : null}
      {agent?.portrait ? (
        <Card.Root style={{ marginTop: 16 }}>
          <CardBody style={{ gap: 8 }}>
            <CardTitle>{say("talk.portraitTitle")}</CardTitle>
            <Txt variant="label">{say("talk.portraitSelf")}</Txt>
            <Txt tone="secondary">{agent.portrait.self}</Txt>
            <Txt variant="label">{say("talk.portraitSeeking")}</Txt>
            <Txt tone="secondary">{agent.portrait.seeking}</Txt>
            <Button label={say("talk.toBatch")} onPress={() => router.replace(`/app/${locale}/batch`)} />
          </CardBody>
        </Card.Root>
      ) : null}
    </Screen>
  );
}
