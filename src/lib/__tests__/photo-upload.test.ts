import { PickRefused, uploadPhoto, type UploadDeps } from "@/lib/photo-upload";

const deps = (over: Partial<UploadDeps> = {}) => {
  const calls: string[] = [];
  const d: UploadDeps = {
    api: async (path, init) => {
      calls.push(`${init?.method ?? "GET"} ${path}`);
      return path === "/api/me/photos" ? { photo: { id: "p1" }, upload: { url: "https://dev.yasakia.com/api/uploads/photos/p1?expires=1&signature=s" } } : {};
    },
    read: async () => ({ blob: new Blob(["x"]), size: 1234 }),
    put: async (url) => {
      calls.push(`PUT ${new URL(url).pathname}`);
      return { ok: true };
    },
    ...over,
  };
  return { d, calls };
};

describe("a photo goes up as it was picked, in the server's three steps", () => {
  it("declares, sends the bytes to the signed URL, then completes", async () => {
    const { d, calls } = deps();
    await expect(uploadPhoto({ uri: "file:///a.jpg", mimeType: "image/jpeg", fileSize: 1234 }, 0, 6, d)).resolves.toBe("p1");
    expect(calls).toEqual(["POST /api/me/photos", "PUT /api/uploads/photos/p1", "PUT /api/me/photos/p1/complete"]);
  });
  it("declares the real size of the bytes, and the type as picked (no re-encoding here)", async () => {
    let declared: unknown;
    const { d } = deps({ api: async (path, init) => { if (path === "/api/me/photos") declared = init?.json; return { photo: { id: "p1" }, upload: { url: "https://x.test/u" } }; } });
    await uploadPhoto({ uri: "file:///a.png", mimeType: "image/png", fileSize: null }, 1, 6, d);
    expect(declared).toEqual({ contentType: "image/png", bytes: 1234 });
  });
  it("refuses a wrong type or a seventh photo before any call", async () => {
    const { d, calls } = deps();
    await expect(uploadPhoto({ uri: "u", mimeType: "image/gif", fileSize: 1 }, 0, 6, d)).rejects.toMatchObject({ problem: "wrongType" });
    await expect(uploadPhoto({ uri: "u", mimeType: "image/jpeg", fileSize: 1 }, 6, 6, d)).rejects.toMatchObject({ problem: "full" });
    expect(calls).toEqual([]);
  });
  it("refuses bytes over 10 MB once read, without declaring them", async () => {
    const { d, calls } = deps({ read: async () => ({ blob: new Blob(["x"]), size: 11 * 1024 * 1024 }) });
    await expect(uploadPhoto({ uri: "u", mimeType: "image/jpeg" }, 0, 6, d)).rejects.toBeInstanceOf(PickRefused);
    expect(calls).toEqual([]);
  });
  it("does not complete when the signed upload failed", async () => {
    const { d, calls } = deps({ put: async () => ({ ok: false }) });
    await expect(uploadPhoto({ uri: "u", mimeType: "image/webp", fileSize: 5 }, 0, 6, d)).rejects.toMatchObject({ problem: "failed" });
    expect(calls).toEqual(["POST /api/me/photos"]);
  });
});
