import { chunkedStorage, createDiscovery, type DiscoveryOptions, KRIZAKA_HOST_SUFFIXES, KRIZAKA_MANIFEST_URLS, KRIZAKA_PUBLIC_KEYS } from "@krizaka/discovery";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

/**
 * The app's environment — one module. Where the Yasakia API lives is NOT a build-time constant: the app asks the signed
 * manifest on krizaka.com (`@krizaka/discovery`, krizaka/.github ADR-003), so moving it never needs a store release.
 * Build-time inputs, named by bounded context (krizaka/.github#46), for local work only (no EAS profile sets them):
 *   EXPO_PUBLIC_APP_URL   an API address that wins over discovery (a machine on the network, a tunnel)
 *   EXPO_PUBLIC_APP_ENV   `dev` (default) | `prod`: which entry of the manifest this build follows
 * A malformed value fails at start, never later.
 */
export function appUrlOverrideFrom(raw: string | undefined): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("EXPO_PUBLIC_APP_URL must be an absolute http(s) URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("EXPO_PUBLIC_APP_URL must be an absolute http(s) URL");
  return value.replace(/\/$/, "");
}

export function appEnvironmentFrom(raw: string | undefined): "dev" | "prod" {
  const value = raw?.trim() || "dev";
  if (value !== "dev" && value !== "prod") throw new Error("EXPO_PUBLIC_APP_ENV must be dev or prod");
  return value;
}

/** The version the app runs, from app.json (the build), never typed twice. */
export const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";

/** Baked in the build: the addresses used until a verified manifest says otherwise (the manifest's own values at build time). */
export const BAKED_ADDRESSES = { apiBase: "https://dev.yasakia.com", webBase: "https://dev.yasakia.com" } as const;
/** The address hard-coded before discovery existed: the last resort. */
export const LEGACY_ADDRESSES = { apiBase: "https://dev.yasakia.com", webBase: "https://dev.yasakia.com" } as const;

/** Where an update is while the app is distributed through TestFlight and EAS (the stores' pages replace these at launch). */
export const UPDATE_URL = { ios: "itms-beta://", android: "https://expo.dev/accounts/oussamaabid/projects/yasakia/builds" } as const;

/** Builds the app's discovery client; tests pass their own fetch, storage and keys. */
export function createAppDiscovery(options: Partial<DiscoveryOptions> = {}) {
  const override = appUrlOverrideFrom(process.env.EXPO_PUBLIC_APP_URL);
  return createDiscovery({
    environment: appEnvironmentFrom(process.env.EXPO_PUBLIC_APP_ENV),
    appVersion: APP_VERSION,
    manifestUrls: KRIZAKA_MANIFEST_URLS,
    publicKeys: KRIZAKA_PUBLIC_KEYS,
    allowedHostSuffixes: [...KRIZAKA_HOST_SUFFIXES, "yasakia.com"],
    defaults: { yasakia: BAKED_ADDRESSES },
    legacy: { yasakia: LEGACY_ADDRESSES },
    ...(override ? { overrides: { yasakia: { apiBase: override, webBase: override } } } : {}),
    // The Keychain / Keystore, in pieces under their per-value limit. The document is signed: what is read back is verified again.
    storage: chunkedStorage({
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    }),
    ...options,
  });
}

export const discovery = createAppDiscovery();

/** The Yasakia API: what the manifest says now. Read at each use, never kept. */
export const yasakiaUrl = (): string => discovery.getService("yasakia").apiBase;
