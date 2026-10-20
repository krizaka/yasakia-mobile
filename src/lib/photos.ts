import type { PhotoCheckData } from "./types";

/**
 * The photos' rules on the phone, pure — the web's (`apps/web/lib/photo-rules.ts`, `PhotosView`): 4 to 6 photos, at least 2 where the
 * face is the subject, JPEG, PNG or WebP up to 10 MB, checked by Orazaka; nothing is edited here (no crop, no filter), nothing is
 * a score. The server's rule set is the source (`rules` in the check's answer); these are what the phone tells before it uploads.
 */
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // @fixed: the server's limit (packages/media MAX_PHOTO_BYTES), mirrored to tell before the upload

export type PickProblem = "wrongType" | "tooLarge" | "full";

/** What is wrong with a picked photo before any byte leaves the phone, or null. */
export function pickProblem(pick: { mimeType?: string | null; fileSize?: number | null }, held: number, max: number): PickProblem | null {
  if (held >= max) return "full";
  const type = pick.mimeType?.toLowerCase() ?? "";
  if (!(PHOTO_TYPES as readonly string[]).includes(type)) return "wrongType";
  if ((pick.fileSize ?? 0) > MAX_PHOTO_BYTES) return "tooLarge";
  return null;
}

/** How many more photos fit. */
export const roomLeft = (held: number, max: number): number => Math.max(0, max - held);

/** The wording of a photo's check: while the set is being checked a waiting photo says « checking ». */
export function checkKey(check: PhotoCheckData["photos"][number]["check"], state: PhotoCheckData["state"]): "PENDING" | "CHECKING" | "FACE" | "GROUP" | "NO_FACE" {
  return check === "PENDING" && (state === "CHECKING" || state === "UNCHECKED") ? "CHECKING" : check;
}

/** The checks that are said without stopping the person. */
export const isInformation = (code: string): boolean => code === "UNVERIFIED" || code === "GROUP_PHOTO";

/** Whether the check is still under way (the screen asks again). */
export const isChecking = (state: PhotoCheckData["state"] | undefined): boolean => state === "CHECKING" || state === "UNCHECKED";

/** « Continue to my batch » is open only once the whole set has passed Orazaka's check. */
export const canContinue = (view: PhotoCheckData | undefined): boolean => view?.verified === true;

/** Photos in the order of their position, the ones still uploading left out. */
export function ordered<T extends { position: number; status: string }>(photos: readonly T[]): T[] {
  return photos.filter((p) => p.status !== "UPLOADING").sort((a, b) => a.position - b.position);
}
