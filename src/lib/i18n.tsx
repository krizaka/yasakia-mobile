import { createI18n, type MessageKey } from "@krizaka/i18n";
import { createContext, useContext, useMemo } from "react";

import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

/**
 * Every user-facing string lives in `src/messages/{en,fr}.json` (`npm run lint` checks them with `krizaka-i18n check`);
 * `en.json` is the reference and types the keys, so a key missing from `fr.json` fails to compile.
 */
export type Locale = "en" | "fr";
export type Messages = typeof en;
export type Key = MessageKey<Messages>;
export const i18n = createI18n<Messages, Locale>({ en, fr }, { defaultLocale: "en" });

/** The device's language, when Yasakia speaks it (English otherwise). */
export function deviceLocale(): Locale {
  return i18n.asLocale(Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2));
}

const LocaleContext = createContext<Locale>("en");
export const LocaleProvider = LocaleContext.Provider;

/** `say("talk.title")`, in the screen's language (the `[locale]` of its route, the device's elsewhere). */
export function useSay() {
  const locale = useContext(LocaleContext);
  return useMemo(() => ({ locale, say: i18n.translator(locale) }), [locale]);
}
