/**
 * How a message arrives, measured on the phone — **counters only**, exactly what the web composer sends (`lib/composer-signals.ts`
 * of krizaka/yasakia): how long from the first character to the send, how many characters were typed and how many came in at
 * once (a paste), the number of deletions. No keystroke is kept, no text. The server reads them with the text's level to make the
 * message's authenticity signal; the signal never holds a message back, and the AI writes nothing for anyone.
 *
 * A phone has no `beforeinput`: each change of the draft is compared with the one before. More than `PASTE_AT` characters
 * arriving in one change is a paste (a keyboard's suggestion is a word, not a sentence).
 */
export const PASTE_AT = 24; // @fixed: characters at once above which a change is a paste, not a typed word or a suggestion

export interface MessageSignals {
  typedMs: number;
  typedChars: number;
  pastedChars: number;
  pasteEvents: number;
  deletions: number;
}

export class ComposerTracker {
  private firstAt: number | null = null;
  private typedChars = 0;
  private pastedChars = 0;
  private pasteEvents = 0;
  private deletions = 0;
  private last = "";

  /** The draft changed from what it was to `next`, at `now` (ms). */
  change(next: string, now: number): void {
    const prev = this.last;
    this.last = next;
    if (next.length < prev.length) {
      this.deletions += 1;
      return;
    }
    const added = next.length - prev.length;
    if (added <= 0) return;
    this.firstAt ??= now;
    if (added > PASTE_AT) {
      this.pastedChars += added;
      this.pasteEvents += 1;
    } else this.typedChars += added;
  }

  /** The counters at the send; undefined when nothing was measured. */
  snapshot(now: number): MessageSignals | undefined {
    if (this.firstAt === null) return undefined;
    return { typedMs: Math.max(0, Math.round(now - this.firstAt)), typedChars: this.typedChars, pastedChars: this.pastedChars, pasteEvents: this.pasteEvents, deletions: this.deletions };
  }

  reset(): void {
    this.firstAt = null;
    this.typedChars = this.pastedChars = this.pasteEvents = this.deletions = 0;
    this.last = "";
  }
}
