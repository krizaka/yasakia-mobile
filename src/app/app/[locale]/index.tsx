import { krizakaFetch, useQuery } from "@krizaka/query";
import { Badge, Card, CardBody, CardTitle, Header, Screen, Txt } from "@krizaka/ui/native";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { type Key, useSay } from "@/lib/i18n";
import { AgentAnswer, CurrentBatch, IntroList, PhotoCheckAnswer } from "@/lib/types";

import { agentKeys } from "./talk";
import { introKeys } from "./intros";
import { photoKeys } from "./photos";

/**
 * The person's home after sign-in (the web's dashboard, from the same endpoints): where the agent is with them, their photos, the batch
 * in front of them and the introductions — counts and words only, never a candidate's profile and never a score.
 */
export default function Home() {
  const { say, locale } = useSay();
  const router = useRouter();
  const agent = useQuery({ queryKey: agentKeys.view(), queryFn: ({ signal }) => krizakaFetch("/api/agent", { signal, schema: AgentAnswer }).then((r) => r.agent) });
  const photos = useQuery({ queryKey: photoKeys.check(), queryFn: ({ signal }) => krizakaFetch("/api/me/photos/check", { signal, schema: PhotoCheckAnswer }).then((r) => r.check) });
  const batch = useQuery({ queryKey: ["batch", "current"], queryFn: ({ signal }) => krizakaFetch("/api/batches/current", { signal, schema: CurrentBatch }).then((r) => r.batch) });
  const intros = useQuery({ queryKey: introKeys.list(), queryFn: ({ signal }) => krizakaFetch("/api/intros", { signal, schema: IntroList }).then((r) => r.intros) });
  const go = (path: string) => router.push(`/app/${locale}${path}`);

  const state = agent.data?.state;
  const decided = batch.data?.people.filter((p) => p.decision === "INTERESTED" || p.decision === "PASS").length ?? 0;
  const live = intros.data?.filter((i) => i.state === "OPEN" || i.state === "CONTINUED") ?? [];
  const continued = live.filter((i) => i.state === "CONTINUED").length;
  return (
    <Screen scroll header={<Header title={say("home.title")} subtitle={say("home.lead")} />}>
      <View style={{ gap: 12 }}>
        <Card.Root onPress={() => go("/talk")}>
          <CardBody style={{ gap: 4 }}>
            <Txt variant="label">{say("home.agent")}</Txt>
            <CardTitle>{state ? say(`dashboard.agentState.${state}` as Key) : "…"}</CardTitle>
            {state ? <Txt tone="secondary">{say(`dashboard.agentHint.${state}` as Key)}</Txt> : null}
          </CardBody>
        </Card.Root>
        <Card.Root onPress={() => go("/photos")}>
          <CardBody style={{ gap: 4 }}>
            <Txt variant="label">{say("home.photos")}</Txt>
            <CardTitle>{photos.data ? say("home.photosValue", { count: photos.data.counts.photos, min: photos.data.rules.minPhotos }) : "…"}</CardTitle>
            {photos.data?.verified ? <Badge tone="success" dot>{say("home.photosPassed")}</Badge> : photos.data ? <Txt tone="secondary">{say(`photos.state.${photos.data.state}`)}</Txt> : null}
          </CardBody>
        </Card.Root>
        <Card.Root onPress={() => go("/batch")}>
          <CardBody style={{ gap: 4 }}>
            <Txt variant="label">{say("home.batch")}</Txt>
            <CardTitle>{batch.data ? say("home.batchValue", { count: batch.data.people.length }) : say("home.batchNone")}</CardTitle>
            {batch.data ? <Txt tone="secondary">{say("home.batchHintOpen", { decided, count: batch.data.people.length })}</Txt> : null}
          </CardBody>
        </Card.Root>
        <Card.Root onPress={() => go("/intros")}>
          <CardBody style={{ gap: 4 }}>
            <Txt variant="label">{say("home.intros")}</Txt>
            <CardTitle>{live.length ? say("home.introsValue", { count: live.length }) : say("home.introsNone")}</CardTitle>
            {live.length ? <Txt tone="secondary">{say("home.introsHint", { continued })}</Txt> : null}
          </CardBody>
        </Card.Root>
      </View>
    </Screen>
  );
}
