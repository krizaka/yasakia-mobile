import { closedKey, isLive, isOpen, mediaReadable, newClientId, SIGNAL_TONE, writable } from "@/lib/intros";
import { AuthenticitySignal } from "@/lib/types";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

const now = new Date("2026-10-20T12:00:00Z");
const base = { state: "OPEN" as const, expiresAt: "2026-10-25T12:00:00Z", frozen: false };

describe("an introduction's rules, the web's", () => {
  it("is writable while open and inside its days, or continued", () => {
    expect(writable(base, now)).toBe(true);
    expect(writable({ ...base, state: "CONTINUED", expiresAt: "2020-01-01T00:00:00Z" }, now)).toBe(true);
  });
  it("is not writable when faded, closed, past its days, or paused by a report", () => {
    expect(writable({ ...base, state: "FADED" }, now)).toBe(false);
    expect(writable({ ...base, state: "CLOSED" }, now)).toBe(false);
    expect(writable({ ...base, expiresAt: "2026-10-19T00:00:00Z" }, now)).toBe(false);
    expect(writable({ ...base, frozen: true }, now)).toBe(false);
    expect(writable({ ...base, state: "CONTINUED", frozen: true }, now)).toBe(false);
  });
  it("offers « Continue » only while open and inside its days", () => {
    expect(isOpen(base, now)).toBe(true);
    expect(isOpen({ ...base, state: "CONTINUED" }, now)).toBe(false);
    expect(isOpen({ ...base, expiresAt: "2026-10-19T00:00:00Z" }, now)).toBe(false);
  });
  it("says why the composer is closed, and reads a live one again", () => {
    expect(closedKey({ frozen: true })).toBe("frozen");
    expect(closedKey({ frozen: false })).toBe("closed");
    expect(isLive("OPEN") && isLive("CONTINUED")).toBe(true);
    expect(isLive("FADED") || isLive("CLOSED")).toBe(false);
  });
  it("gives every send attempt its own id, long enough for the server", () => {
    const a = newClientId(1_000, () => 0.123);
    const b = newClientId(1_000, () => 0.987);
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(8);
    expect(a.length).toBeLessThanOrEqual(64);
  });
  it("shows a media message to its reader only once approved, or to its sender while checked", () => {
    expect(mediaReadable({ mine: false, media: { status: "APPROVED" } })).toBe(true);
    expect(mediaReadable({ mine: false, media: { status: "PENDING" } })).toBe(false);
    expect(mediaReadable({ mine: true, media: { status: "PENDING" } })).toBe(true);
    expect(mediaReadable({ mine: true, media: { status: "REJECTED" } })).toBe(false);
    expect(mediaReadable({ mine: true, media: null })).toBe(false);
  });
});

describe("the authenticity signal — four words, never a number, never a verdict", () => {
  it("has exactly the web's four values, each with a tone, a label and a hint in both languages", () => {
    expect(AuthenticitySignal.options).toEqual(["HAND", "UNSURE", "LIKELY_GENERATED", "TOO_SHORT"]);
    for (const k of AuthenticitySignal.options) {
      expect(SIGNAL_TONE[k]).toBeTruthy();
      for (const m of [en, fr]) {
        expect(m.intros.authenticity[k].label).toBeTruthy();
        expect(m.intros.authenticity[k].hint).toBeTruthy();
      }
    }
    for (const m of [en, fr]) expect(m.intros.authenticity.canBeWrong).toBeTruthy();
  });
  it("never writes for the person: no message offers a draft, a suggestion or a reply", () => {
    const words = /suggest|draft|reply for|write for|answer for|propos(e|ition) de réponse|écris à ma place|brouillon|à ta place/i;
    const flat = (o: unknown): string[] => (typeof o === "string" ? [o] : Object.values(o as object).flatMap(flat));
    const say = flat(en.intros).concat(flat(fr.intros));
    for (const s of say.filter((s) => words.test(s))) expect(s).toMatch(/writes nothing|n’écrit rien|never writes|ne lit jamais|never reads/i);
    expect(en.intros.typedByYou).toMatch(/writes nothing for you/);
    expect(fr.intros.typedByYou).toMatch(/n’écrit rien à ta place/);
  });
});
