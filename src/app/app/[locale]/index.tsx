import { Redirect, useLocalSearchParams } from "expo-router";

/** `/app/{locale}` — the home of the space is the talk. */
export default function SpaceHome() {
  const { locale } = useLocalSearchParams<{ locale: string }>();
  return <Redirect href={`/app/${locale}/talk`} />;
}
