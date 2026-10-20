import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import IntroThread from "@/app/app/[locale]/intros/[id]";
import IntrosScreen from "@/app/app/[locale]/intros/index";

import { fakeApi, renderScreen } from "@/test-utils/harness";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn() }), useLocalSearchParams: () => ({ id: "i1", locale: "en" }) }));
jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(async () => null) }));

const future = new Date(Date.now() + 5 * 86_400_000).toISOString();
const msg = (id: string, mine: boolean, body: string, signal: string | null) => ({ id, mine, body, createdAt: "2026-10-20T12:00:00Z", kind: "TEXT", media: null, signal });
const detail = (over: object = {}) => ({
  intro: {
    id: "i1",
    state: "OPEN",
    openedAt: "2026-10-19T12:00:00Z",
    expiresAt: future,
    frozen: false,
    continuedByMe: false,
    continuedByThem: false,
    them: { name: "Alex", about: "Likes cooking.", fictional: true },
    messages: [msg("m1", false, "Salut ! J’ai vu que tu aimes cuisiner.", "HAND"), msg("m2", true, "Merci, et toi ?", "TOO_SHORT"), msg("m3", false, "Bonjour, je suis ravi de faire votre connaissance et de discuter.", "LIKELY_GENERATED")],
    ...over,
  },
});

describe("the introductions list", () => {
  it("lists the people, live first, and opens a thread", async () => {
    fakeApi({ "/api/intros": { intros: [{ id: "i1", state: "OPEN", name: "Alex", fictional: true, openedAt: "2026-10-19T00:00:00Z", expiresAt: future, messages: 3, lastMessageAt: "2026-10-20T12:00:00Z" }] } });
    await renderScreen(<IntrosScreen />);
    await fireEvent.press(await screen.findByText("Alex"));
    expect(mockPush).toHaveBeenCalledWith("/app/en/intros/i1");
  });
  it("says what happens when there is none", async () => {
    fakeApi({ "/api/intros": { intros: [] } });
    await renderScreen(<IntrosScreen />);
    expect(await screen.findByText("No introduction yet")).toBeTruthy();
  });
});

describe("an introduction's thread — humans talk, each message has its authenticity signal", () => {
  it("carries a signal word on every text message, as on the web, and never a number", async () => {
    fakeApi({ "/api/intros/i1": detail() });
    await renderScreen(<IntroThread />);
    expect(await screen.findByText("Salut ! J’ai vu que tu aimes cuisiner.")).toBeTruthy();
    expect(screen.getByText("Written by hand")).toBeTruthy();
    expect(screen.getByText("Too short to judge")).toBeTruthy();
    expect(screen.getByText("Probably generated")).toBeTruthy();
    expect(screen.getAllByTestId("authenticity-mark")).toHaveLength(3);
    expect(screen.queryByText(/\d+\s?%/)).toBeNull();
  });
  it("explains the mark when pressed, and says it can be wrong", async () => {
    fakeApi({ "/api/intros/i1": detail() });
    await renderScreen(<IntroThread />);
    await fireEvent.press((await screen.findAllByTestId("authenticity-mark"))[2]);
    expect(screen.getByText(/The text reads like machine text/)).toBeTruthy();
    expect(screen.getAllByText(/This signal can be wrong/).length).toBeGreaterThan(0);
  });
  it("says the AI writes nothing and never reads the conversation", async () => {
    fakeApi({ "/api/intros/i1": detail() });
    await renderScreen(<IntroThread />, "fr");
    expect(await screen.findByText(/n’écrit rien à ta place/)).toBeTruthy();
    expect(screen.getByText(/Ton agent ne lit jamais cette conversation/)).toBeTruthy();
  });
  it("sends what the person typed, with the composer's counters and one id per attempt", async () => {
    const { calls } = fakeApi({ "/api/intros/i1": detail(), "POST /api/intros/i1/messages": { message: {} } });
    await renderScreen(<IntroThread />);
    const input = await screen.findByPlaceholderText("Write a message");
    await fireEvent.changeText(input, "H");
    await fireEvent.changeText(input, "Hé");
    await fireEvent.changeText(input, "Hél");
    await fireEvent.press(screen.getByLabelText("Send"));
    await waitFor(() => expect(calls.some((c) => c.method === "POST" && c.path === "/api/intros/i1/messages")).toBe(true));
    const sent = calls.find((c) => c.method === "POST")!.body as { body: string; clientId: string; signals: { typedChars: number; pastedChars: number } };
    expect(sent.body).toBe("Hél");
    expect(sent.clientId.length).toBeGreaterThanOrEqual(8);
    expect(sent.signals).toMatchObject({ typedChars: 3, pastedChars: 0 });
    expect(Object.keys(sent).sort()).toEqual(["body", "clientId", "signals"]);
  });
  it("closes the composer with the reason when the introduction is over or paused", async () => {
    fakeApi({ "/api/intros/i1": detail({ state: "FADED" }) });
    await renderScreen(<IntroThread />);
    expect(await screen.findByText("This introduction is over.")).toBeTruthy();
  });
  it("shows why a photo message was refused to its sender, with the reasons in words", async () => {
    const m = { id: "m9", mine: true, body: "", createdAt: "2026-10-20T12:00:00Z", kind: "PHOTO", media: { kind: "PHOTO", status: "REJECTED", durationMs: null, codes: ["SEXUAL_CONTENT"] }, signal: null };
    fakeApi({ "/api/intros/i1": detail({ messages: [m] }) });
    await renderScreen(<IntroThread />);
    expect(await screen.findByText("This was not sent — it did not pass the safety check:")).toBeTruthy();
    expect(screen.getByText("• nudity or sexual content")).toBeTruthy();
  });
  it("offers « Continue » while open, and posts it", async () => {
    const { calls } = fakeApi({ "/api/intros/i1": detail(), "POST /api/intros/i1/continue": { state: "OPEN" } });
    await renderScreen(<IntroThread />);
    await fireEvent.press(await screen.findByText("Continue"));
    await waitFor(() => expect(calls.some((c) => c.path === "/api/intros/i1/continue")).toBe(true));
  });
});
