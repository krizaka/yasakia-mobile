import { defineKeys, krizakaFetch, useMutation, useQuery, useQueryClient } from "@krizaka/query";
import { Badge, Button, Card, CardBody, CardTitle, EmptyState, Header, Screen, Txt } from "@krizaka/ui/native";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { errorKey } from "@/lib/api";
import { type Key, useSay } from "@/lib/i18n";
import { AgentAnswer, Answered, CurrentBatch, type DecisionValue, type PersonData } from "@/lib/types";

import { agentKeys } from "./talk";

const batchKeys = defineKeys("batch", { current: () => ["current"] });

function PersonAnswer({ batchId, person, open }: { batchId: string; person: PersonData; open: boolean }) {
  const { say } = useSay();
  const client = useQueryClient();
  const answer = useMutation({
    mutationFn: (decision: DecisionValue) => krizakaFetch(`/api/batches/${batchId}/items/${person.id}/decision`, { method: "POST", json: { decision }, schema: Answered }),
    onSettled: () => Promise.all([client.invalidateQueries({ queryKey: batchKeys.current() }), client.invalidateQueries({ queryKey: agentKeys.view() })]),
  });
  const final = person.decision === "INTERESTED" || person.decision === "PASS";
  return (
    <View style={{ gap: 8 }}>
      {person.lookingFor ? (
        <>
          <Txt variant="label">{say("batch.lookingFor")}</Txt>
          <Txt tone="secondary">{person.lookingFor}</Txt>
        </>
      ) : null}
      {person.decision === "INTERESTED" ? <Badge tone="success" dot>{say("batch.saidYes")}</Badge> : person.decision === "PASS" ? <Badge>{say("batch.passed")}</Badge> : null}
      {answer.data?.introId ? <Txt tone="success">{say("batch.introOpened")}</Txt> : null}
      {!final && open ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button size="sm" label={say("batch.interested")} loading={answer.isPending && answer.variables === "INTERESTED"} disabled={answer.isPending} onPress={() => answer.mutate("INTERESTED")} />
          {person.decision !== "TELL_ME_MORE" ? <Button size="sm" variant="secondary" label={say("batch.tellMeMore")} disabled={answer.isPending} onPress={() => answer.mutate("TELL_ME_MORE")} /> : null}
          <Button size="sm" variant="ghost" label={say("batch.pass")} disabled={answer.isPending} onPress={() => answer.mutate("PASS")} />
        </View>
      ) : null}
      {answer.isError ? <Txt tone="danger">{say(`errors.${errorKey(answer.error)}` as Key)}</Txt> : null}
    </View>
  );
}

/** The batch: three to five people who fit both ways, why you two in words, and the three answers. Never a score. */
export default function BatchScreen() {
  const { say, locale } = useSay();
  const router = useRouter();
  const client = useQueryClient();
  const agent = useQuery({ queryKey: agentKeys.view(), queryFn: ({ signal }) => krizakaFetch("/api/agent", { signal, schema: AgentAnswer }).then((r) => r.agent) });
  const current = useQuery({ queryKey: batchKeys.current(), queryFn: ({ signal }) => krizakaFetch("/api/batches/current", { signal, schema: CurrentBatch }).then((r) => r.batch) });
  const look = useMutation({
    mutationFn: () => krizakaFetch("/api/batches", { method: "POST", json: { locale } }),
    onSettled: () => Promise.all([client.invalidateQueries({ queryKey: batchKeys.current() }), client.invalidateQueries({ queryKey: agentKeys.view() })]),
  });
  const batch = current.data;
  const state = agent.data?.state;
  return (
    <Screen scroll header={<Header title={say("batch.title")} subtitle={say("batch.lead")} />}>
      {batch ? (
        <View style={{ gap: 12 }}>
          <Txt tone="secondary">{say("batch.noScore")}</Txt>
          {batch.status === "DEBRIEF_DUE" ? <Txt tone="accent">{say("batch.debriefDue")}</Txt> : null}
          {batch.people.map((p) => (
            <Card.Root key={p.id}>
              <CardBody style={{ gap: 8 }}>
                <CardTitle>{p.name || say("common.someone")}</CardTitle>
                {p.fictional ? <Badge tone="warning" size="sm">{say("batch.fictional")}</Badge> : null}
                {p.about ? <Txt tone="secondary">{p.about}</Txt> : null}
                <Txt variant="label">{say("batch.whyYou")}</Txt>
                {p.reasons.forYou.map((r) => (
                  <Txt key={r} tone="secondary">
                    {`• ${r}`}
                  </Txt>
                ))}
                <Txt variant="label">{say("batch.whyThem")}</Txt>
                {p.reasons.forThem.map((r) => (
                  <Txt key={r} tone="secondary">
                    {`• ${r}`}
                  </Txt>
                ))}
                <PersonAnswer batchId={batch.id} person={p} open={batch.status === "OPEN"} />
              </CardBody>
            </Card.Root>
          ))}
        </View>
      ) : state === "WAITING_POOL" ? (
        <EmptyState
          title={say("batch.readyTitle")}
          description={look.isError ? say(`errors.${errorKey(look.error)}` as Key) : say("batch.readyDescription")}
          action={<Button label={look.isPending ? say("batch.looking") : say("batch.look")} loading={look.isPending} onPress={() => look.mutate()} />}
        />
      ) : state === "ONBOARDING" ? (
        <EmptyState title={say("batch.talkFirstTitle")} description={say("batch.talkFirstDescription")} action={<Button label={say("tabs.talk")} onPress={() => router.replace(`/app/${locale}/talk`)} />} />
      ) : (
        <EmptyState title={say("batch.emptyTitle")} description={say("batch.emptyDescription")} />
      )}
    </Screen>
  );
}
