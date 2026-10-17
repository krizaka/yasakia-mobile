import Constants from "expo-constants";

/**
 * The app's environment — one module. Build-time values only (Expo inlines `process.env.EXPO_PUBLIC_*`), named by
 * bounded context (krizaka/.github#46): `EXPO_PUBLIC_APP_URL` is the Yasakia API the app talks to (the development
 * deployment by default). A malformed value fails at start, never later.
 */
export function appUrlFrom(raw: string | undefined): string {
  const value = raw?.trim() || "https://dev.yasakia.com";
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("EXPO_PUBLIC_APP_URL must be an absolute http(s) URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("EXPO_PUBLIC_APP_URL must be an absolute http(s) URL");
  return value.replace(/\/$/, "");
}

export const APP_URL = appUrlFrom(process.env.EXPO_PUBLIC_APP_URL);
/** The version the app runs, from app.json (the build), never typed twice. */
export const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";
