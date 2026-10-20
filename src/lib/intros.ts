import type { AuthenticitySignalValue, IntroDetailData, IntroStateValue } from "./types";

/**
 * Introductions on the phone, pure — the web's rules (`intro-rules.ts`, `IntroView`): open for a few days, continued when both say
 * so, faded when the time runs out; one can write only while it is open (or continued) and not paused by a report. Every message is
 * typed by the person who sends it; the AI writes nothing for anyone.
 */

/** Whether the person may write now. */
export function writable(intro: Pick<IntroDetailData, "state" | "expiresAt" | "frozen">, now: Date): boolean {
  if (intro.frozen) return false;
  if (intro.state === "CONTINUED") return true;
  return intro.state === "OPEN" && new Date(intro.expiresAt) > now;
}

/** Still open and inside its days — the « Continue » offer. */
export const isOpen = (intro: Pick<IntroDetailData, "state" | "expiresAt">, now: Date): boolean => intro.state === "OPEN" && new Date(intro.expiresAt) > now;

/** Why the composer is closed, as a message key under `intros.`. */
export const closedKey = (intro: Pick<IntroDetailData, "frozen">): "frozen" | "closed" => (intro.frozen ? "frozen" : "closed");

/** An open or continued introduction is read again while the screen is open. */
export const isLive = (state: IntroStateValue): boolean => state === "OPEN" || state === "CONTINUED";

/** The tone of the authenticity mark: a signal in four words, never a number, never a verdict. */
export const SIGNAL_TONE = { HAND: "success", UNSURE: "neutral", LIKELY_GENERATED: "warning", TOO_SHORT: "neutral" } as const satisfies Record<AuthenticitySignalValue, "success" | "neutral" | "warning">;

/** A fresh id per send attempt: a retry of the same attempt never doubles a message (the server is idempotent per `clientId`). */
export function newClientId(now: number, random: () => number = Math.random): string {
  return `m${now.toString(36)}${Math.floor(random() * 36 ** 8).toString(36).padStart(8, "0")}`;
}

/** Whether a media message is readable by its reader: approved, or the sender's own while it is checked. */
export function mediaReadable(m: { mine: boolean; media: { status: string } | null }): boolean {
  return m.media !== null && (m.media.status === "APPROVED" || (m.mine && m.media.status === "PENDING"));
}
