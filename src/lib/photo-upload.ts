import { type PickProblem, pickProblem } from "./photos";

/** A photo chosen on the phone — the bytes are read from its `uri`, never changed (no crop, no filter, no re-encode here). */
export interface Pick {
  uri: string;
  mimeType?: string | null;
  fileSize?: number | null;
}

export interface UploadDeps {
  /** The API call with the session (`krizakaFetch`). */
  api: (path: string, init?: { method?: string; json?: unknown }) => Promise<unknown>;
  /** Reads the picked file's bytes. */
  read: (uri: string) => Promise<{ blob: Blob; size: number }>;
  /** The raw `fetch`, for the signed URL (its signature is the authorisation: no bearer goes there). */
  put: (url: string, init: { method: "PUT"; headers: Record<string, string>; body: Blob }) => Promise<{ ok: boolean }>;
}

export class PickRefused extends Error {
  constructor(public readonly problem: PickProblem | "failed") {
    super(problem);
  }
}

/**
 * The upload of one photo, in the three steps the server defines (`apps/web/lib/photos.ts`): declare the type and size → a row and
 * a signed upload URL (300 s); PUT the bytes there; complete — the server reads them back, checks they are a picture, strips the
 * metadata (GPS included), stores them on Bunny and hands them to Orazaka's check. Returns the new photo's id.
 */
export async function uploadPhoto(pick: Pick, held: number, max: number, deps: UploadDeps): Promise<string> {
  const problem = pickProblem(pick, held, max);
  if (problem) throw new PickRefused(problem);
  const { blob, size } = await deps.read(pick.uri);
  if (pickProblem({ mimeType: pick.mimeType, fileSize: size }, held, max)) throw new PickRefused("tooLarge");
  const contentType = (pick.mimeType ?? "").toLowerCase();
  const started = (await deps.api("/api/me/photos", { method: "POST", json: { contentType, bytes: size } })) as { photo: { id: string }; upload: { url: string } };
  const put = await deps.put(started.upload.url, { method: "PUT", headers: { "content-type": contentType }, body: blob });
  if (!put.ok) throw new PickRefused("failed");
  await deps.api(`/api/me/photos/${started.photo.id}/complete`, { method: "PUT" });
  return started.photo.id;
}
