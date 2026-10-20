import { canContinue, checkKey, isChecking, isInformation, MAX_PHOTO_BYTES, ordered, pickProblem, roomLeft } from "@/lib/photos";
import type { PhotoCheckData } from "@/lib/types";

describe("a photo is told before it is uploaded", () => {
  it("accepts JPEG, PNG and WebP up to 10 MB", () => {
    for (const mimeType of ["image/jpeg", "image/png", "image/webp"]) expect(pickProblem({ mimeType, fileSize: 1_000_000 }, 0, 6)).toBeNull();
    expect(pickProblem({ mimeType: "image/jpeg", fileSize: MAX_PHOTO_BYTES }, 0, 6)).toBeNull();
  });
  it("refuses another type, a photo over 10 MB, and a seventh photo", () => {
    expect(pickProblem({ mimeType: "image/heic", fileSize: 10 }, 0, 6)).toBe("wrongType");
    expect(pickProblem({ mimeType: null, fileSize: 10 }, 0, 6)).toBe("wrongType");
    expect(pickProblem({ mimeType: "image/jpeg", fileSize: MAX_PHOTO_BYTES + 1 }, 0, 6)).toBe("tooLarge");
    expect(pickProblem({ mimeType: "image/jpeg", fileSize: 10 }, 6, 6)).toBe("full");
  });
  it("counts the room left, never below zero", () => {
    expect(roomLeft(4, 6)).toBe(2);
    expect(roomLeft(7, 6)).toBe(0);
  });
});

describe("the check of the set, in words", () => {
  const view = (over: Partial<PhotoCheckData>): PhotoCheckData => ({ state: "PASSED", comparison: "OFF", verified: true, needsCheck: false, rules: { minPhotos: 4, maxPhotos: 6, minFacePhotos: 2 }, counts: { photos: 4, facePhotos: 2 }, photos: [], blockers: [], ...over });
  it("says « checking » for a waiting photo only while the set is being checked", () => {
    expect(checkKey("PENDING", "CHECKING")).toBe("CHECKING");
    expect(checkKey("PENDING", "UNCHECKED")).toBe("CHECKING");
    expect(checkKey("PENDING", "UNAVAILABLE")).toBe("PENDING");
    expect(checkKey("FACE", "CHECKING")).toBe("FACE");
  });
  it("asks again while it is under way, and only then", () => {
    expect(isChecking("CHECKING")).toBe(true);
    expect(isChecking("UNCHECKED")).toBe(true);
    for (const s of ["EMPTY", "PASSED", "FAILED", "UNAVAILABLE"] as const) expect(isChecking(s)).toBe(false);
    expect(isChecking(undefined)).toBe(false);
  });
  it("opens the batch only once the whole set has passed", () => {
    expect(canContinue(view({ verified: true }))).toBe(true);
    expect(canContinue(view({ verified: false, state: "FAILED" }))).toBe(false);
    expect(canContinue(undefined)).toBe(false);
  });
  it("tells information from what stops the set", () => {
    expect(isInformation("UNVERIFIED")).toBe(true);
    expect(isInformation("GROUP_PHOTO")).toBe(true);
    expect(isInformation("SCREENSHOT")).toBe(false);
  });
  it("orders by position and leaves the uploading ones out", () => {
    const rows = [
      { id: "c", position: 2, status: "APPROVED" },
      { id: "x", position: 0, status: "UPLOADING" },
      { id: "a", position: 0, status: "APPROVED" },
      { id: "b", position: 1, status: "REJECTED" },
    ];
    expect(ordered(rows).map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
});
