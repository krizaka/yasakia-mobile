import { createAppConfigClient } from "@krizaka/app-config/client";
import { configureKrizakaFetch, isKrizakaApiError } from "@krizaka/query";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { APP_URL, APP_VERSION } from "./config";
import { deviceLocale } from "./i18n";
import { readToken } from "./session";

/**
 * The app's one way to the API: `krizakaFetch` with the Yasakia base URL and the bearer token, through the app-config
 * client's `fetch` — every request says which app and version it is (`X-Client-*`), and a `426 Upgrade Required` anywhere
 * shows the update screen (krizaka/.github#75).
 */
export const appConfig = createAppConfigClient({
  baseUrl: APP_URL,
  platform: Platform.OS === "ios" ? "ios" : "android",
  version: APP_VERSION,
  language: deviceLocale,
  storage: { getItem: (k) => SecureStore.getItemAsync(k), setItem: (k, v) => void SecureStore.setItemAsync(k, v) },
});

let configured = false;
export function setUpApi(): void {
  if (configured) return;
  configured = true;
  configureKrizakaFetch({ baseUrl: APP_URL, getToken: readToken, fetch: appConfig.fetch });
}

/** The message key (under `errors.`) of a failed call: the server's stable `code`, else what the status says. */
export function errorKey(error: unknown): string {
  if (!isKrizakaApiError(error)) return "generic";
  const code = (error.body as { code?: unknown } | undefined)?.code;
  if (typeof code === "string") return code;
  if (error.status === 0) return "network";
  if (error.status === 401) return "UNAUTHENTICATED";
  if (error.status === 429) return "RATE_LIMITED";
  if (error.status === 503) return "UNAVAILABLE";
  return "generic";
}
