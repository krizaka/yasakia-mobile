import { krizakaFetch, useQuery } from "@krizaka/query";
import { Badge, Loader, Txt } from "@krizaka/ui/native";
import { Image, View } from "react-native";

import { type Key, useSay } from "@/lib/i18n";
import { mediaReadable } from "@/lib/intros";
import { type IntroMessageData, SignedMedia } from "@/lib/types";

const seconds = (ms: number | null) => (ms === null ? "" : `${Math.floor(ms / 60_000)}:${String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0")}`);

/**
 * A photo, a video or a voice message in the thread — shown as it was sent, never edited. Its file is read through a URL signed for
 * this reader (300 s); the other person never sees it before Orazaka's safety check approved it, and the sender sees where it stands
 * — « checking », or why it was refused (codes, worded here). Photos show here; video and voice play on the web for now.
 */
export function MediaMessage({ introId, message }: { introId: string; message: IntroMessageData }) {
  const { say } = useSay();
  const media = message.media;
  const readable = mediaReadable(message);
  const signed = useQuery({
    queryKey: ["intro", introId, "media", message.id],
    queryFn: ({ signal }) => krizakaFetch(`/api/intros/${introId}/media/${message.id}`, { signal, schema: SignedMedia }).then((r) => r.media),
    enabled: readable && media?.kind === "PHOTO",
    staleTime: 240_000, // @fixed: the signed URL lives 300 seconds
  });
  if (!media) return null;
  const title = say(`intros.media.title.${media.kind}` as Key, { duration: seconds(media.durationMs) });
  if (media.status === "REJECTED") {
    return (
      <View style={{ gap: 4 }} accessibilityRole="alert">
        <Txt tone="danger">{say("intros.media.refused")}</Txt>
        {media.codes.map((code) => (
          <Txt key={code} tone="danger" variant="caption">{`• ${say(`intros.media.codes.${code}` as Key)}`}</Txt>
        ))}
      </View>
    );
  }
  if (media.status === "GONE") return <Txt tone="secondary">{say("intros.media.gone")}</Txt>;
  return (
    <View style={{ gap: 8, maxWidth: 260 }}>
      {message.mine && media.status === "PENDING" ? (
        <Badge tone="neutral" size="sm">
          {say("intros.media.checking")}
        </Badge>
      ) : null}
      {media.kind === "PHOTO" ? (
        signed.data ? (
          <Image source={{ uri: signed.data.url }} accessibilityLabel={title} style={{ width: 240, height: 300, borderRadius: 8 }} resizeMode="cover" />
        ) : signed.isError ? (
          <Txt tone="secondary">{say("intros.media.unavailable")}</Txt>
        ) : (
          <Loader label={title} />
        )
      ) : (
        <>
          <Txt>{title}</Txt>
          <Txt tone="secondary" variant="caption">
            {say("intros.media.onWeb")}
          </Txt>
        </>
      )}
    </View>
  );
}
