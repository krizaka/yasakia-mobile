import { krizakaFetch, useMutation, useQuery, useQueryClient } from "@krizaka/query";
import { Badge, Button, Card, CardBody, CardTitle, Header, MessageBubble, MessageComposer, Screen, Txt } from "@krizaka/ui/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { View } from "react-native";

import { AuthenticityMark } from "@/components/AuthenticityMark";
import { MediaMessage } from "@/components/MediaMessage";
import { errorKey } from "@/lib/api";
import { ComposerTracker } from "@/lib/composer-signals";
import { type Key, useSay } from "@/lib/i18n";
import { closedKey, isLive, isOpen, newClientId, writable } from "@/lib/intros";
import { IntroAnswer } from "@/lib/types";

import { introKeys } from "./index";

/** How often an open introduction is read again while the screen is open (the other person's messages). */
const POLL_MS = 8000; // @fixed: interface refresh rate, not a business parameter

/**
 * One introduction: the messages, the composer while it is open — every word is typed by the person, the AI writes nothing and
 * never reads this conversation — and « Continue »: once both said it, it has no end. Each message carries the authenticity
 * signal (one of four words, as on the web). Nothing blocks a message.
 */
export default function IntroThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { say, locale } = useSay();
  const router = useRouter();
  const client = useQueryClient();
  const [draft, setDraft] = useState("");
  const tracker = useRef(new ComposerTracker());
  const attempt = useRef<string | null>(null);

  const query = useQuery({
    queryKey: introKeys.detail(id),
    queryFn: ({ signal }) => krizakaFetch(`/api/intros/${id}`, { signal, schema: IntroAnswer }).then((r) => r.intro),
    refetchInterval: (q) => (q.state.data && isLive(q.state.data.state) ? POLL_MS : false),
  });
  const reread = () => Promise.all([client.invalidateQueries({ queryKey: introKeys.detail(id) }), client.invalidateQueries({ queryKey: introKeys.list() })]);
  const send = useMutation({
    mutationFn: (body: string) => {
      attempt.current ??= newClientId(Date.now()); // a retry of the same attempt never doubles the message
      return krizakaFetch(`/api/intros/${id}/messages`, { method: "POST", json: { body, clientId: attempt.current, signals: tracker.current.snapshot(Date.now()) } });
    },
    onSuccess: async () => {
      attempt.current = null;
      tracker.current.reset();
      setDraft("");
      await reread();
    },
  });
  const cont = useMutation({ mutationFn: () => krizakaFetch(`/api/intros/${id}/continue`, { method: "POST" }), onSuccess: reread });

  const intro = query.data;
  const now = new Date();
  const canWrite = intro ? writable(intro, now) : false;
  const time = new Intl.DateTimeFormat(locale, { timeStyle: "short", dateStyle: "short" });
  const name = intro?.them.name || say("intros.someone");
  const onDraft = (text: string) => {
    tracker.current.change(text, Date.now());
    setDraft(text);
  };
  const submit = () => {
    const body = draft.trim();
    if (body && canWrite && !send.isPending) send.mutate(body);
  };

  return (
    <Screen
      scroll
      keyboard
      header={
        <Header
          size="inline"
          title={intro ? say("intros.with", { name }) : say("common.loading")}
          subtitle={intro ? (isOpen(intro, now) ? say("intros.openUntil", { date: time.format(new Date(intro.expiresAt)) }) : say(`intros.states.${intro.state}`)) : undefined}
          backLabel={say("intros.back")}
          onBack={() => router.replace(`/app/${locale}/intros`)}
        />
      }
      footer={intro ? <MessageComposer value={draft} onValueChange={onDraft} onSend={submit} placeholder={say("intros.placeholder")} sendLabel={say("intros.send")} disabledReason={canWrite ? undefined : say(`intros.${closedKey(intro)}`)} maxLength={2000} /> : undefined}
    >
      {query.isError ? <Txt tone="danger">{say(`errors.${errorKey(query.error)}` as Key)}</Txt> : null}
      {intro ? (
        <View style={{ gap: 12 }}>
          <Txt tone="secondary" variant="caption">
            {say("intros.typedByYou")}
          </Txt>
          <View accessibilityRole="list" style={{ gap: 8 }}>
            {intro.messages.length === 0 ? <Txt tone="secondary">{say("intros.noMessage")}</Txt> : null}
            {intro.messages.map((m) => (
              <View key={m.id} style={{ alignItems: m.mine ? "flex-end" : "flex-start", gap: 4 }}>
                {m.kind === "TEXT" ? (
                  <>
                    <AuthenticityMark signal={m.signal} />
                    <MessageBubble mine={m.mine} text={m.body} time={time.format(new Date(m.createdAt))} />
                  </>
                ) : (
                  <MediaMessage introId={intro.id} message={m} />
                )}
              </View>
            ))}
          </View>
          {send.isError ? <Txt tone="danger" accessibilityRole="alert">{say(`errors.${errorKey(send.error)}` as Key)}</Txt> : null}
          <Card.Root>
            <CardBody style={{ gap: 8 }}>
              <CardTitle>{name}</CardTitle>
              {intro.them.fictional ? <Badge tone="warning" size="sm">{say("intros.fictionalBadge")}</Badge> : null}
              {intro.them.about ? <Txt tone="secondary">{intro.them.about}</Txt> : null}
              <Txt tone="secondary" variant="caption">
                {say("intros.agentNeverReads")}
              </Txt>
              {intro.state === "CONTINUED" ? (
                <Badge tone="success" dot>
                  {say("intros.states.CONTINUED")}
                </Badge>
              ) : isOpen(intro, now) ? (
                <>
                  <Txt tone="secondary">{intro.continuedByMe ? say("intros.waitingForThem", { name }) : say("intros.continueLead")}</Txt>
                  {intro.continuedByMe ? null : <Button size="sm" label={say("intros.continue")} loading={cont.isPending} onPress={() => cont.mutate()} />}
                  {cont.isError ? <Txt tone="danger">{say(`errors.${errorKey(cont.error)}` as Key)}</Txt> : null}
                </>
              ) : null}
            </CardBody>
          </Card.Root>
        </View>
      ) : null}
    </Screen>
  );
}
