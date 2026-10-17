import { z } from "zod";

/** What the Yasakia API answers — parsed at the boundary, the screens get typed values. Never a score. */
export const SignedIn = z.object({ token: z.string().min(10), account: z.object({ id: z.string(), email: z.string(), locale: z.enum(["en", "fr"]) }) });

export const AgentState = z.enum(["ONBOARDING", "DISCOVERY", "WAITING_POOL", "BATCH_READY", "BATCH_OPEN", "DEBRIEF_DUE"]);
export const Agent = z.object({
  state: AgentState,
  messages: z.array(z.object({ id: z.string(), role: z.enum(["USER", "AGENT", "SYSTEM"]), content: z.string(), createdAt: z.string() })),
  portrait: z.object({ self: z.string(), seeking: z.string() }).nullable(),
  waiting: z.boolean().optional(),
});
export type AgentData = z.infer<typeof Agent>;
export const AgentAnswer = z.object({ agent: Agent });

export const Decision = z.enum(["INTERESTED", "PASS", "TELL_ME_MORE"]);
export type DecisionValue = z.infer<typeof Decision>;
export const Person = z.object({
  id: z.string(),
  rank: z.number(),
  name: z.string(),
  about: z.string(),
  reasons: z.object({ forYou: z.array(z.string()), forThem: z.array(z.string()) }),
  fictional: z.boolean(),
  decision: Decision.nullable(),
  lookingFor: z.string().nullable().optional(),
});
export type PersonData = z.infer<typeof Person>;
export const Batch = z.object({ id: z.string(), status: z.enum(["OPEN", "DEBRIEF_DUE"]), openedAt: z.string(), expiresAt: z.string(), people: z.array(Person) });
export type BatchData = z.infer<typeof Batch>;
export const CurrentBatch = z.object({ batch: Batch.nullable() });
export const Answered = z.object({ decision: Decision, lookingFor: z.string().nullable(), introId: z.string().nullable(), debriefDue: z.boolean() });
