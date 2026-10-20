import { defineKeys, krizakaFetch, useMutation, useQueries, useQuery, useQueryClient } from "@krizaka/query";
import { Badge, Button, Card, CardBody, CardTitle, Header, Loader, PhotoGrid, Screen, Txt, type GridPhoto } from "@krizaka/ui/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { errorKey } from "@/lib/api";
import { type Key, useSay } from "@/lib/i18n";
import { canContinue, checkKey, isChecking, isInformation, ordered, roomLeft } from "@/lib/photos";
import { PickRefused, uploadPhoto } from "@/lib/photo-upload";
import { OwnPhotos, PhotoCheckAnswer, type PhotoCheckData, SignedPhoto } from "@/lib/types";

export const photoKeys = defineKeys("photos", { list: () => ["list"], check: () => ["check"], url: (id: string) => ["url", id] });
/** While Orazaka checks the set, the answer is asked again this often. */
const CHECK_POLL_MS = 2000; // @fixed: interface refresh rate, not a business parameter

/**
 * The photos: the person's own, 4 to 6 with at least 2 of the face, each checked by Orazaka — the status and, when it is refused, the
 * reason, in words (never a score). Nothing is edited here: a photo goes up as it was picked and the server only strips its metadata.
 * The photos are private to the person until the whole set has passed; then only the people of their batches see them.
 */
export default function PhotosScreen() {
  const { say, locale } = useSay();
  const router = useRouter();
  const client = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);

  const list = useQuery({ queryKey: photoKeys.list(), queryFn: ({ signal }) => krizakaFetch("/api/me/photos", { signal, schema: OwnPhotos }).then((r) => r.photos) });
  const check = useQuery({
    queryKey: photoKeys.check(),
    queryFn: ({ signal }) => krizakaFetch("/api/me/photos/check", { signal, schema: PhotoCheckAnswer }).then((r) => r.check),
    refetchInterval: (q) => (isChecking(q.state.data?.state) ? CHECK_POLL_MS : false),
  });
  const photos = ordered(list.data ?? []);
  const urls = useQueries({
    queries: photos.map((p) => ({
      queryKey: photoKeys.url(p.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => krizakaFetch(`/api/photos/${p.id}?w=480`, { signal, schema: SignedPhoto }).then((r) => r.photo.url),
      staleTime: 240_000, // @fixed: the signed URL lives 300 seconds
    })),
  });
  const view = check.data;
  const rules = view?.rules ?? { minPhotos: 4, maxPhotos: 6, minFacePhotos: 2 };
  const refresh = () => Promise.all([client.invalidateQueries({ queryKey: photoKeys.list() }), client.invalidateQueries({ queryKey: photoKeys.check() })]);

  const add = useMutation({
    mutationFn: async (picks: ImagePicker.ImagePickerAsset[]) => {
      let held = photos.length;
      for (const pick of picks) {
        await uploadPhoto(pick, held, rules.maxPhotos, {
          api: (path, init) => krizakaFetch(path, init as never) as Promise<unknown>,
          read: async (uri) => {
            const blob = await (await fetch(uri)).blob();
            return { blob, size: blob.size };
          },
          put: (url, init) => fetch(url, init),
        });
        held += 1;
      }
    },
    onSettled: refresh,
  });
  const remove = useMutation({ mutationFn: (id: string) => krizakaFetch(`/api/me/photos/${id}`, { method: "DELETE" }), onSettled: refresh });
  const reorder = useMutation({ mutationFn: (order: string[]) => krizakaFetch("/api/me/photos", { method: "PATCH", json: { order } }), onSettled: refresh });
  const agree = useMutation({ mutationFn: () => krizakaFetch("/api/me/photos/consent", { method: "PUT", json: { version: "2026-10" } }), onSettled: refresh });
  const withdraw = useMutation({ mutationFn: () => krizakaFetch("/api/me/photos/consent", { method: "DELETE" }), onSettled: refresh });
  const recheck = useMutation({ mutationFn: () => krizakaFetch("/api/me/photos/check", { method: "POST" }), onSettled: refresh });

  const choose = async () => {
    setNotice(null);
    const room = roomLeft(photos.length, rules.maxPhotos);
    if (room === 0) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: room,
        allowsEditing: false, // nothing is edited: the photo goes as it was picked
        quality: 1,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled) return;
      await add.mutateAsync(result.assets.slice(0, room));
    } catch (error) {
      setNotice(error instanceof PickRefused ? say(`photos.upload.${error.problem === "full" ? "failed" : error.problem}` as Key) : say(`errors.${errorKey(error)}` as Key));
    }
  };

  const grid: GridPhoto[] = photos.map((p, i) => ({ id: p.id, uri: urls[i]?.data ?? "", alt: say("photos.grid.photo", { position: i + 1 }) }));
  const onValueChange = (next: GridPhoto[]) => {
    if (next.length < grid.length) {
      const gone = grid.find((g) => !next.some((n) => n.id === g.id));
      if (gone) remove.mutate(gone.id);
    } else reorder.mutate(next.map((n) => n.id));
  };
  const busy = add.isPending || remove.isPending || reorder.isPending;
  const state = view?.state ?? "EMPTY";
  const placeholders = { min: rules.minPhotos, max: rules.maxPhotos, faces: rules.minFacePhotos };
  const counts = view?.counts ?? { photos: photos.length, facePhotos: 0 };

  return (
    <Screen scroll header={<Header title={say("photos.title")} subtitle={say("photos.lead", placeholders)} />}>
      <View style={{ gap: 16 }}>
        <PhotoGrid
          value={grid}
          onValueChange={onValueChange}
          onAdd={roomLeft(photos.length, rules.maxPhotos) > 0 && !busy ? () => void choose() : undefined}
          slots={rules.maxPhotos}
          required={rules.minPhotos}
          labels={{
            add: say("photos.grid.add"),
            main: say("photos.grid.main"),
            photo: (position) => say("photos.grid.photo", { position }),
            makeMain: say("photos.grid.makeMain"),
            moveEarlier: say("photos.grid.moveEarlier"),
            moveLater: say("photos.grid.moveLater"),
            remove: say("photos.grid.remove"),
            cancel: say("photos.grid.cancel"),
          }}
        />
        {add.isPending ? <Loader label={say("photos.upload.working")} /> : null}
        {notice ? (
          <Txt tone="danger" accessibilityRole="alert">
            {notice}
          </Txt>
        ) : null}
        {remove.isError ? <Txt tone="danger">{say("photos.removeFailed")}</Txt> : null}
        {reorder.isError ? <Txt tone="danger">{say("photos.reorderFailed")}</Txt> : null}

        {view?.comparison === "NEEDS_CONSENT" ? (
          <Card.Root>
            <CardBody style={{ gap: 8 }}>
              <CardTitle>{say("photos.consent.title")}</CardTitle>
              <Txt tone="secondary">{say("photos.consent.lead")}</Txt>
              <Txt tone="secondary">{say("photos.consent.purpose")}</Txt>
              <Txt tone="secondary">{say("photos.consent.nothingKept")}</Txt>
              <Txt tone="secondary">{say("photos.consent.optional")}</Txt>
              <Button label={say("photos.consent.accept")} loading={agree.isPending} onPress={() => agree.mutate()} />
              {agree.isError ? <Txt tone="danger">{say(`errors.${errorKey(agree.error)}` as Key)}</Txt> : null}
            </CardBody>
          </Card.Root>
        ) : null}

        <Card.Root>
          <CardBody style={{ gap: 8 }}>
            <CardTitle>{say(`photos.state.${state}`)}</CardTitle>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }} accessibilityLiveRegion="polite">
              <Badge tone={counts.photos >= rules.minPhotos ? "success" : "neutral"} dot>
                {say("photos.counts", { count: counts.photos, min: rules.minPhotos, max: rules.maxPhotos })}
              </Badge>
              <Badge tone={counts.facePhotos >= rules.minFacePhotos ? "success" : "neutral"} dot>
                {say("photos.faceCount", { count: counts.facePhotos, min: rules.minFacePhotos })}
              </Badge>
              {isChecking(view?.state) ? <Loader label={say("photos.status.CHECKING")} /> : null}
            </View>
            <Blockers view={view} placeholders={placeholders} />
            <PerPhoto view={view} />
            {state === "UNAVAILABLE" || state === "FAILED" ? <Button size="sm" variant="secondary" label={say("photos.retry")} loading={recheck.isPending} onPress={() => recheck.mutate()} /> : null}
            <Button label={say("photos.continue")} disabled={!canContinue(view)} onPress={() => router.replace(`/app/${locale}/batch`)} />
            {canContinue(view) ? null : <Txt tone="secondary" variant="caption">{say("photos.continueHint")}</Txt>}
          </CardBody>
        </Card.Root>

        <Card.Root>
          <CardBody style={{ gap: 8 }}>
            <CardTitle>{say("photos.privacy.title")}</CardTitle>
            <Txt tone="secondary">{say("photos.privacy.intro")}</Txt>
            {(["faces", "same", "questions", "not"] as const).map((n) => (
              <Txt key={n} tone="secondary">{`• ${say(`photos.privacy.items.${n}`)}`}</Txt>
            ))}
            <Txt tone="secondary">{say(`photos.privacy.comparison.${view?.comparison ?? "OFF"}`)}</Txt>
            {view?.comparison === "ON" ? <Button size="sm" variant="ghost" label={say("photos.consent.withdraw")} loading={withdraw.isPending} onPress={() => withdraw.mutate()} /> : null}
            <Txt tone="secondary">{say("photos.privacy.limits")}</Txt>
          </CardBody>
        </Card.Root>
      </View>
    </Screen>
  );
}

/** What stops the set, in words (only when it failed): add photos, replace the screenshots… */
function Blockers({ view, placeholders }: { view: PhotoCheckData | undefined; placeholders: { min: number; max: number; faces: number } }) {
  const { say } = useSay();
  if (!view || view.state !== "FAILED") return null;
  return (
    <View style={{ gap: 4 }} testID="photo-blockers">
      {view.blockers.map((b) => (
        <Txt key={b.code} tone="secondary">{`• ${say(`photos.blocker.${b.code}` as Key, placeholders)}`}</Txt>
      ))}
    </View>
  );
}

/** Each photo with the live answer of Orazaka's check — « face detected », « several faces » — and the reasons it gives. */
function PerPhoto({ view }: { view: PhotoCheckData | undefined }) {
  const { say } = useSay();
  if (!view) return null;
  return (
    <View style={{ gap: 8 }}>
      {view.photos.map((p, i) => (
        <View key={p.id} style={{ gap: 2 }} testID={`photo-check-${i + 1}`}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <Txt variant="label">{say("photos.grid.photo", { position: i + 1 })}</Txt>
            <Badge tone={p.check === "FACE" ? "success" : "neutral"}>{say(`photos.status.${checkKey(p.check, view.state)}`)}</Badge>
          </View>
          {p.findings.map((code) => (
            <Txt key={code} variant="caption" tone={isInformation(code) ? "secondary" : "danger"}>
              {say(`photos.finding.${code}` as Key)}
            </Txt>
          ))}
        </View>
      ))}
    </View>
  );
}
