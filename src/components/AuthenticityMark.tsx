import { Badge, Txt } from "@krizaka/ui/native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { SIGNAL_TONE } from "@/lib/intros";
import { useSay } from "@/lib/i18n";
import type { AuthenticitySignalValue } from "@/lib/types";

/**
 * The small indicator above a message, shown to both people: three honest words and a fourth for texts too short — a SIGNAL, never a
 * verdict and never a number (the AI-likelihood of the web, `AuthenticityMark`). Pressing it says what it means and that it can be
 * wrong. It never held a message back; while it is being read the mark says so.
 */
export function AuthenticityMark({ signal }: { signal: AuthenticitySignalValue | null }) {
  const { say } = useSay();
  const [open, setOpen] = useState(false);
  const key = signal ?? "PENDING";
  const label = say(`intros.authenticity.${key}.label`);
  const hint = `${say(`intros.authenticity.${key}.hint`)} ${say("intros.authenticity.canBeWrong")}`;
  return (
    <View style={{ gap: 4, alignItems: "flex-start" }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}. ${hint}`} accessibilityState={{ expanded: open }} testID="authenticity-mark" hitSlop={8} onPress={() => setOpen((o) => !o)}>
        <Badge tone={signal ? SIGNAL_TONE[signal] : "neutral"} size="sm" dot={signal === "HAND" || signal === "LIKELY_GENERATED"}>
          {label}
        </Badge>
      </Pressable>
      {open ? (
        <Txt variant="caption" tone="secondary">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}
