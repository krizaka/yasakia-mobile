import { Loader } from "@krizaka/ui/native";
import { Redirect } from "expo-router";

import { useAuth } from "@/lib/auth";
import { deviceLocale, i18n } from "@/lib/i18n";

/** The entry: the talk when signed in (the first thing Yasakia asks is to talk), the sign-in otherwise. */
export default function Index() {
  const { state } = useAuth();
  if (state.status === "loading") return <Loader label={i18n.translator(deviceLocale())("common.loading")} />;
  return <Redirect href={state.status === "signedIn" ? `/app/${deviceLocale()}` : "/sign-in"} />;
}
