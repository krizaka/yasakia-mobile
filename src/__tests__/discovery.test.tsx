import { DiscoveryProvider } from "@krizaka/discovery/react";
import { signManifest } from "@krizaka/discovery/sign";
import type { ManifestBody, ServiceEntry } from "@krizaka/discovery";
import { configureKrizakaFetch } from "@krizaka/query";
import { ThemeProvider } from "@krizaka/ui/native";
import { render, screen, waitFor } from "@testing-library/react-native";
import { generateKeyPairSync } from "crypto";
import fs from "fs";
import path from "path";
import { Text } from "react-native";

import { DiscoveryGate } from "@/components/DiscoveryGate";
import { setUpApi } from "@/lib/api";
import { BAKED_ADDRESSES, createAppDiscovery, discovery, LEGACY_ADDRESSES, UPDATE_URL, yasakiaUrl } from "@/lib/config";
import { LocaleProvider } from "@/lib/i18n";

jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(async () => undefined), deleteItemAsync: jest.fn(async () => undefined) }));
jest.mock("@krizaka/query", () => ({ ...jest.requireActual("@krizaka/query"), configureKrizakaFetch: jest.fn() }));

const ROOT = path.resolve(__dirname, "../..");
const key = (() => {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  return {
    seed: privateKey.export({ format: "der", type: "pkcs8" }).subarray(-32).toString("base64"),
    publicKey: publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("base64"),
  };
})();

const entry = (over: Partial<ServiceEntry> = {}): ServiceEntry => ({ apiBase: "https://dev.yasakia.com", webBase: "https://dev.yasakia.com", minAppVersion: "0.1.0", latestAppVersion: "0.1.0", status: "ok", ...over });
const manifest = (over: Partial<ServiceEntry> = {}, issuedAt = "2026-10-21T12:00:00Z") => {
  const body: ManifestBody = { schemaVersion: 1, keyId: "k1", issuedAt, services: { yasakia: { dev: entry(over) } } };
  return JSON.stringify(signManifest(body, key.seed));
};
const memory = () => {
  const data = new Map<string, string>();
  return { getItem: async (k: string) => data.get(k) ?? null, setItem: async (k: string, v: string) => void data.set(k, v), removeItem: async (k: string) => void data.delete(k) };
};
const serving = (get: () => string) => (async () => ({ ok: true, status: 200, text: async () => get() })) as unknown as typeof fetch;
const make = (get: () => string, appVersion = "0.1.0") => createAppDiscovery({ fetch: serving(get), publicKeys: { k1: key.publicKey }, storage: memory(), appVersion });

describe("no hard-coded backend address (krizaka/.github#120, ADR-003)", () => {
  const files = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  it("keeps the hosts in lib/config.ts only, and every EAS profile free of one", () => {
    const offenders = files(path.join(ROOT, "src"))
      .filter((f) => /\.(ts|tsx)$/.test(f) && !/__tests__|test-utils/.test(f) && !f.endsWith(path.join("lib", "config.ts")))
      .filter((f) => /https?:\/\/(?:dev|www)\.yasakia\.com/.test(fs.readFileSync(f, "utf8")));
    expect(offenders.map((f) => f.replace(ROOT, ""))).toEqual([]);
    expect(fs.readFileSync(path.join(ROOT, "eas.json"), "utf8")).not.toMatch(/yasakia\.com/);
  });
  it("bakes the dev site as the default and the legacy address until the manifest says otherwise", () => {
    expect(BAKED_ADDRESSES.apiBase).toBe("https://dev.yasakia.com");
    expect(LEGACY_ADDRESSES.apiBase).toBe("https://dev.yasakia.com");
    expect(yasakiaUrl()).toBe("https://dev.yasakia.com");
    expect(discovery.getService("yasakia").source).toBe("default");
  });
  it("sends the update screen to TestFlight and the EAS builds while the app is not in the stores", () => {
    const app = JSON.parse(fs.readFileSync(path.join(ROOT, "app.json"), "utf8")) as { expo: { owner: string; slug: string } };
    expect(UPDATE_URL.ios).toBe("itms-beta://");
    expect(UPDATE_URL.android).toBe(`https://expo.dev/accounts/${app.expo.owner}/projects/${app.expo.slug}/builds`);
  });
});

describe("the live switch: a manifest edit moves the app without a rebuild", () => {
  it("follows the API address when the manifest is re-issued", async () => {
    let current = manifest();
    const d = make(() => current);
    await d.start();
    expect(d.getService("yasakia")).toMatchObject({ apiBase: "https://dev.yasakia.com", source: "live" });
    current = manifest({ apiBase: "https://api.yasakia.com" }, "2026-10-21T13:00:00Z");
    await d.refresh();
    expect(d.getService("yasakia")).toMatchObject({ apiBase: "https://api.yasakia.com" });
  });

  it("refuses an address off the allow-list even when signed", async () => {
    const d = make(() => manifest({ apiBase: "https://attacker.example.net" }));
    await d.start();
    expect(d.getService("yasakia")).toMatchObject({ apiBase: "https://dev.yasakia.com", source: "default" });
  });

  it("points the API client at the discovered address, and again whenever the manifest moves it", async () => {
    const configure = configureKrizakaFetch as jest.Mock;
    let current = manifest();
    const d = make(() => current);
    configure.mockClear();
    setUpApi(d);
    setUpApi(d); // idempotent
    expect(configure).toHaveBeenCalledTimes(1);
    expect(configure.mock.calls[0][0]).toMatchObject({ baseUrl: "https://dev.yasakia.com" });
    current = manifest({ apiBase: "https://api.yasakia.com" }, "2026-10-21T13:00:00Z");
    await d.start();
    expect(configure.mock.calls.at(-1)?.[0]).toMatchObject({ baseUrl: "https://api.yasakia.com" });
    current = manifest({ apiBase: "https://other.yasakia.com" }, "2026-10-21T14:00:00Z");
    await d.refresh();
    expect(configure.mock.calls.at(-1)?.[0]).toMatchObject({ baseUrl: "https://other.yasakia.com" });
  });
});

describe("the gate the manifest raises", () => {
  const shown = async (get: () => string, appVersion = "0.1.0") => {
    const d = make(get, appVersion);
    await render(
      <ThemeProvider>
        <LocaleProvider value="en">
          <DiscoveryProvider discovery={d} refreshEveryMs={0}>
            <DiscoveryGate>
              <Text>the app</Text>
            </DiscoveryGate>
          </DiscoveryProvider>
        </LocaleProvider>
      </ThemeProvider>,
    );
  };

  it("shows the app when the build is current", async () => {
    await shown(() => manifest());
    expect(await screen.findByText("the app")).toBeTruthy();
  });

  it("replaces the app with the update screen below minAppVersion, with the manifest's message", async () => {
    await shown(() => manifest({ minAppVersion: "2.0.0", latestAppVersion: "2.1.0", message: { en: "Please update.", fr: "Mettez à jour." } }));
    expect(await screen.findByText("Update Yasakia to continue")).toBeTruthy();
    expect(screen.getByText("Please update.")).toBeTruthy();
    expect(screen.getByText("Version 2.1.0")).toBeTruthy();
    expect(screen.queryByText("the app")).toBeNull();
  });

  it("replaces the app with the maintenance screen and its message", async () => {
    await shown(() => manifest({ status: "maintenance", message: { en: "Back at noon.", fr: "De retour à midi." } }));
    await waitFor(() => expect(screen.getByText("Yasakia is under maintenance")).toBeTruthy());
    expect(screen.getByText("Back at noon.")).toBeTruthy();
  });
});
