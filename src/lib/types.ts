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

/** The nav: see `lib/nav.ts`. Photos — what the owner sees of a photo (never a URL: `GET /api/photos/{id}` signs one). */
export const OwnPhoto = z.object({ id: z.string(), position: z.number(), status: z.string() });
export type OwnPhotoData = z.infer<typeof OwnPhoto>;
export const OwnPhotos = z.object({ photos: z.array(OwnPhoto) });
export const SignedPhoto = z.object({ photo: z.object({ url: z.string() }) });

export const PhotoCode = z.enum(["FACE_MISMATCH", "MINOR_LIKELY", "TEXT_OR_CONTACT", "SCREENSHOT", "UNVERIFIED", "GROUP_PHOTO", "TOO_FEW_PHOTOS", "TOO_MANY_PHOTOS", "TOO_FEW_FACE_PHOTOS"]);
export type PhotoCodeValue = z.infer<typeof PhotoCode>;
export const CheckState = z.enum(["EMPTY", "UNCHECKED", "CHECKING", "PASSED", "FAILED", "UNAVAILABLE"]);
export const PhotoCheck = z.object({
  state: CheckState,
  comparison: z.enum(["OFF", "NEEDS_CONSENT", "ON"]),
  verified: z.boolean(),
  needsCheck: z.boolean(),
  rules: z.object({ minPhotos: z.number(), maxPhotos: z.number(), minFacePhotos: z.number() }),
  counts: z.object({ photos: z.number(), facePhotos: z.number() }),
  photos: z.array(z.object({ id: z.string(), check: z.enum(["PENDING", "FACE", "GROUP", "NO_FACE"]), faceCount: z.number(), findings: z.array(PhotoCode) })),
  blockers: z.array(z.object({ code: PhotoCode, photos: z.array(z.string()) })),
});
export type PhotoCheckData = z.infer<typeof PhotoCheck>;
export const PhotoCheckAnswer = z.object({ check: PhotoCheck });

/** Introductions — two people said yes; humans talk, the AI writes nothing. */
export const IntroState = z.enum(["OPEN", "CONTINUED", "FADED", "CLOSED"]);
export type IntroStateValue = z.infer<typeof IntroState>;
export const IntroSummary = z.object({ id: z.string(), state: IntroState, name: z.string(), fictional: z.boolean(), openedAt: z.string(), expiresAt: z.string(), messages: z.number(), lastMessageAt: z.string().nullable() });
export type IntroSummaryData = z.infer<typeof IntroSummary>;
export const IntroList = z.object({ intros: z.array(IntroSummary) });

/** One of four words, never a number: a signal that can be wrong, never a verdict (it never holds a message back). */
export const AuthenticitySignal = z.enum(["HAND", "UNSURE", "LIKELY_GENERATED", "TOO_SHORT"]);
export type AuthenticitySignalValue = z.infer<typeof AuthenticitySignal>;
export const MediaView = z.object({ kind: z.enum(["PHOTO", "VIDEO", "AUDIO"]), status: z.enum(["UPLOADING", "PENDING", "APPROVED", "REJECTED", "GONE"]), durationMs: z.number().nullable(), codes: z.array(z.string()) });
export const IntroMessage = z.object({
  id: z.string(),
  mine: z.boolean(),
  body: z.string(),
  createdAt: z.string(),
  kind: z.enum(["TEXT", "PHOTO", "VIDEO", "AUDIO"]),
  media: MediaView.nullable(),
  signal: AuthenticitySignal.nullable(),
});
export type IntroMessageData = z.infer<typeof IntroMessage>;
export const IntroDetail = z.object({
  id: z.string(),
  state: IntroState,
  openedAt: z.string(),
  expiresAt: z.string(),
  frozen: z.boolean(),
  continuedByMe: z.boolean(),
  continuedByThem: z.boolean(),
  them: z.object({ name: z.string(), about: z.string(), fictional: z.boolean() }),
  messages: z.array(IntroMessage),
});
export type IntroDetailData = z.infer<typeof IntroDetail>;
export const IntroAnswer = z.object({ intro: IntroDetail });
export const SignedMedia = z.object({ media: z.object({ url: z.string(), posterUrl: z.string().nullable() }) });
