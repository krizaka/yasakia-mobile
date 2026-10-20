import { configureKrizakaFetch, KrizakaQueryProvider } from "@krizaka/query";
import { ThemeProvider } from "@krizaka/ui/native";
import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LocaleProvider, type Locale } from "@/lib/i18n";

export interface Call {
  method: string;
  path: string;
  body: unknown;
}

/** The API, faked at its edge: a route table answered as JSON, every call recorded. Nothing else is mocked. */
export function fakeApi(routes: Record<string, unknown | ((call: Call) => unknown)>) {
  const calls: Call[] = [];
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "https://dev.test");
    const call: Call = { method: init?.method ?? "GET", path: url.pathname, body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined };
    calls.push(call);
    const hit = routes[`${call.method} ${call.path}`] ?? routes[call.path];
    if (hit === undefined) return new Response(JSON.stringify({ code: "NOT_FOUND" }), { status: 404, headers: { "content-type": "application/json" } });
    const body = typeof hit === "function" ? (hit as (c: Call) => unknown)(call) : hit;
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  configureKrizakaFetch({ baseUrl: "https://dev.test", getToken: async () => "token-for-tests", fetch: fetchFn });
  return { calls };
}

export async function renderScreen(ui: ReactElement, locale: Locale = "en") {
  return await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
      <ThemeProvider>
        <LocaleProvider value={locale}>
          <KrizakaQueryProvider>{ui}</KrizakaQueryProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}
