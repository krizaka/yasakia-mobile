/**
 * The person's destinations, as data — the same five, in the same order and under the same addresses as the web console
 * (`apps/web/lib/console-nav.ts` of krizaka/yasakia, `docs/UX_DECISIONS.md` §1). Structure only: the words are the
 * `tabs.<id>` messages. `lib/__tests__` holds its shape (at most five, the journey's order). The account is a utility, never a tab.
 */
export const NAV_IDS = ["dashboard", "talk", "photos", "batch", "myIntros"] as const;
export type NavId = (typeof NAV_IDS)[number];

export interface NavEntry {
  id: NavId;
  /** The address under `/app/<locale>`; the empty string is the home. */
  href: string;
}

export const USER_NAV: readonly NavEntry[] = [
  { id: "dashboard", href: "" },
  { id: "talk", href: "/talk" },
  { id: "photos", href: "/photos" },
  { id: "batch", href: "/batch" },
  { id: "myIntros", href: "/intros" },
];

/** The entry a path belongs to (an introduction's thread belongs to « Introductions »), the home when none. */
export function currentEntry(path: string): NavEntry {
  const rest = path.replace(/^\/app\/[a-z]{2}(?=\/|$)/, "").replace(/\/$/, "");
  let best: NavEntry = USER_NAV[0];
  for (const entry of USER_NAV) {
    if (entry.href !== "" && (rest === entry.href || rest.startsWith(`${entry.href}/`))) best = entry;
  }
  return best;
}

export const hrefOf = (locale: string, entry: NavEntry): string => `/app/${locale}${entry.href}`;
