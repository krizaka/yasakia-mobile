import { ComposerTracker, PASTE_AT } from "@/lib/composer-signals";

describe("how a message arrives — counters only, as on the web", () => {
  it("measures nothing until a character arrives", () => {
    expect(new ComposerTracker().snapshot(1000)).toBeUndefined();
  });
  it("counts typed characters and the time from the first to the send", () => {
    const t = new ComposerTracker();
    t.change("H", 1000);
    t.change("He", 1200);
    t.change("Hey", 1400);
    expect(t.snapshot(3000)).toEqual({ typedMs: 2000, typedChars: 3, pastedChars: 0, pasteEvents: 0, deletions: 0 });
  });
  it("counts a deletion, not as typing", () => {
    const t = new ComposerTracker();
    t.change("Hey", 0);
    t.change("He", 10);
    expect(t.snapshot(20)).toMatchObject({ typedChars: 3, deletions: 1 });
  });
  it("reads a long arrival in one change as a paste, a suggested word as typing", () => {
    const t = new ComposerTracker();
    t.change("Salut ", 0);
    t.change(`Salut ${"x".repeat(PASTE_AT + 1)}`, 5);
    t.change(`Salut ${"x".repeat(PASTE_AT + 1)} bonjour`, 9);
    expect(t.snapshot(10)).toMatchObject({ pastedChars: PASTE_AT + 1, pasteEvents: 1, typedChars: 6 + 8 });
  });
  it("starts again after a send", () => {
    const t = new ComposerTracker();
    t.change("Hey", 0);
    t.reset();
    expect(t.snapshot(5)).toBeUndefined();
    t.change("Yo", 100);
    expect(t.snapshot(150)).toMatchObject({ typedChars: 2, typedMs: 50 });
  });
  it("keeps no text and no keystroke: only five counters", () => {
    const t = new ComposerTracker();
    t.change("secret", 0);
    expect(Object.keys(t.snapshot(1)!).sort()).toEqual(["deletions", "pasteEvents", "pastedChars", "typedChars", "typedMs"]);
  });
});
