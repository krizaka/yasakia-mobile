import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import PhotosScreen from "@/app/app/[locale]/photos";

import { fakeApi, renderScreen } from "@/test-utils/harness";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace, push: jest.fn() }), useLocalSearchParams: () => ({ locale: "en" }) }));
jest.mock("expo-image-picker", () => ({ launchImageLibraryAsync: jest.fn(), UIImagePickerPreferredAssetRepresentationMode: { Compatible: "compatible" } }));
jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(async () => null) }));

const rules = { minPhotos: 4, maxPhotos: 6, minFacePhotos: 2 };
const photo = (n: number, status = "APPROVED") => ({ id: `p${n}`, position: n, status });
const own = { photos: [1, 2, 3, 4].map((n) => photo(n)) };
const signed = (call: { path: string }) => ({ photo: { url: `https://cdn.test${call.path}.jpg` } });

const check = (over: object) => ({
  check: { state: "PASSED", comparison: "OFF", verified: true, needsCheck: false, rules, counts: { photos: 4, facePhotos: 2 }, photos: [1, 2, 3, 4].map((n) => ({ id: `p${n}`, check: n <= 2 ? "FACE" : "NO_FACE", faceCount: n <= 2 ? 1 : 0, findings: [] })), blockers: [], ...over },
});
const routes = (c: object) => ({ "/api/me/photos": own, "/api/me/photos/check": c, "/api/photos/p1": signed, "/api/photos/p2": signed, "/api/photos/p3": signed, "/api/photos/p4": signed });

describe("the photos screen — the web's rules on a phone", () => {
  it("shows 4 of 4 to 6, 2 of the face, each photo's status from Orazaka, and opens the batch once passed", async () => {
    fakeApi(routes(check({})));
    await renderScreen(<PhotosScreen />);
    expect(await screen.findByText("4 of 4 photos at least (6 at most)")).toBeTruthy();
    expect(screen.getByText("2 of 2 photos showing your face")).toBeTruthy();
    expect(screen.getAllByText("Face detected ✓")).toHaveLength(2);
    expect(screen.getAllByText("No face here — fine, but it does not count as a face photo")).toHaveLength(2);
    expect(screen.getByText("Your photos are ready. They can be shown, and your batch can open.")).toBeTruthy();
    await fireEvent.press(screen.getByText("Continue to my batch"));
    expect(mockReplace).toHaveBeenCalledWith("/app/en/batch");
  });

  it("says why a photo is refused — the reason in words, never a score — and keeps the batch closed", async () => {
    fakeApi(
      routes(
        check({
          state: "FAILED",
          verified: false,
          counts: { photos: 4, facePhotos: 1 },
          photos: [
            { id: "p1", check: "FACE", faceCount: 1, findings: [] },
            { id: "p2", check: "NO_FACE", faceCount: 0, findings: ["SCREENSHOT"] },
            { id: "p3", check: "NO_FACE", faceCount: 0, findings: ["TEXT_OR_CONTACT"] },
            { id: "p4", check: "FACE", faceCount: 1, findings: ["MINOR_LIKELY"] },
          ],
          blockers: [{ code: "TOO_FEW_FACE_PHOTOS", photos: [] }, { code: "SCREENSHOT", photos: ["p2"] }],
        }),
      ),
    );
    await renderScreen(<PhotosScreen />);
    expect(await screen.findByText("This looks like a screenshot or a photo of a screen. Choose a real photo.")).toBeTruthy();
    expect(screen.getByText("Something is written over this photo (text, a number, a username). Choose a photo without.")).toBeTruthy();
    expect(screen.getByText("The person here may be under 18. Yasakia is for adults only.")).toBeTruthy();
    expect(screen.getByText("• At least 2 photos must show your face clearly — add one where we see you.")).toBeTruthy();
    expect(screen.getByText("Check again")).toBeTruthy();
    expect(screen.getByText("Available once your photos have passed the check.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue to my batch" }).props.accessibilityState?.disabled).toBe(true);
    expect(screen.queryByText(/score/i)).toBeNull();
  });

  it("says « checking » while Orazaka looks, and in French when asked", async () => {
    fakeApi(routes(check({ state: "CHECKING", verified: false, photos: [1, 2, 3, 4].map((n) => ({ id: `p${n}`, check: "PENDING", faceCount: 0, findings: [] })) })));
    await renderScreen(<PhotosScreen />, "fr");
    expect(await screen.findByText("Vérification de tes photos…")).toBeTruthy();
    expect(screen.getAllByText("Vérification…").length).toBeGreaterThan(0);
  });

  it("asks for the consent before comparing the faces, and sends the version the person agreed to", async () => {
    const { calls } = fakeApi({ ...routes(check({ comparison: "NEEDS_CONSENT" })), "PUT /api/me/photos/consent": {} });
    await renderScreen(<PhotosScreen />);
    await fireEvent.press(await screen.findByText("I agree to the comparison"));
    await waitFor(() => expect(calls.find((c) => c.method === "PUT" && c.path === "/api/me/photos/consent")?.body).toEqual({ version: "2026-10" }));
  });
});
