import { KrizakaApiError } from "@krizaka/query";
import { ThemeProvider } from "@krizaka/ui/native";
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppGate } from "@/components/AppGate";
import { errorKey } from "@/lib/api";
import { appUrlFrom } from "@/lib/config";
import { i18n } from "@/lib/i18n";

jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(async () => undefined), deleteItemAsync: jest.fn(async () => undefined) }));

const payload = {
  platform: "ios" as const,
  minSupportedVersion: "1.0.0",
  latestVersion: "1.2.0",
  updateMode: "force" as const,
  storeUrl: null,
  maintenance: { on: false, message: null },
  contract: { min: 1, max: 1, sunset: null },
  flags: {},
  message: null,
  locale: "en",
};
const gate = async (decision: Parameters<typeof AppGate>[0]["decision"]) =>
  await render(
    <ThemeProvider>
      <AppGate decision={decision} onDismiss={() => undefined} onRetry={() => undefined}>
        <Text>the app</Text>
      </AppGate>
    </ThemeProvider>,
  );

describe("the app-version gate (krizaka/.github#75)", () => {
  it("shows the app when nothing is due", async () => {
    await gate({ kind: "ok" });
    expect(screen.getByText("the app")).toBeTruthy();
  });
  it("replaces the app with the update screen when an update is forced", async () => {
    await gate({ kind: "force", config: payload });
    expect(screen.queryByText("the app")).toBeNull();
    expect(screen.getByText("Update Yasakia to continue")).toBeTruthy();
  });
  it("keeps the app under a dismissible prompt for a soft update", async () => {
    await gate({ kind: "soft", config: { ...payload, updateMode: "soft" } });
    expect(screen.getByText("the app")).toBeTruthy();
    expect(screen.getByText("An update is available")).toBeTruthy();
    expect(screen.getByText("Later")).toBeTruthy();
  });
  it("replaces the app with the maintenance screen and its message", async () => {
    await gate({ kind: "maintenance", config: { ...payload, maintenance: { on: true, message: "Back at noon." } } });
    expect(screen.getByText("Yasakia is under maintenance")).toBeTruthy();
    expect(screen.getByText("Back at noon.")).toBeTruthy();
  });
});

describe("the API's answers in words", () => {
  it("reads the server's stable code, else the status", () => {
    expect(errorKey(new KrizakaApiError({ status: 401, body: { code: "INVALID_CREDENTIALS" } } as never))).toBe("INVALID_CREDENTIALS");
    expect(errorKey(new KrizakaApiError({ status: 0 } as never))).toBe("network");
    expect(errorKey(new KrizakaApiError({ status: 503 } as never))).toBe("UNAVAILABLE");
    expect(errorKey(new Error("boom"))).toBe("generic");
  });
  it("has a message for every code it can show, in both languages", () => {
    for (const code of ["INVALID_CREDENTIALS", "network", "UNAVAILABLE", "generic", "NO_FIT_YET", "ALREADY_DECIDED"]) {
      expect(i18n.translator("en")(`errors.${code}` as never)).not.toBe(`errors.${code}`);
      expect(i18n.translator("fr")(`errors.${code}` as never)).not.toBe(`errors.${code}`);
    }
  });
});

describe("the environment", () => {
  it("talks to the development deployment by default and refuses a malformed URL", () => {
    expect(appUrlFrom(undefined)).toBe("https://dev.yasakia.com");
    expect(appUrlFrom("https://example.test/")).toBe("https://example.test");
    expect(() => appUrlFrom("ftp://x")).toThrow();
  });
});
