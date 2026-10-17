import { Button, Header, Screen, TextField, Txt, YasakiaMark } from "@krizaka/ui/native";
import { Redirect } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { errorKey } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { deviceLocale, type Key, useSay } from "@/lib/i18n";

/** Sign in by invitation (sign-up is closed on dev): e-mail and password, a bearer token kept in the secure store. */
export default function SignIn() {
  const { say } = useSay();
  const { state, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (state.status === "signedIn") return <Redirect href={`/app/${deviceLocale()}/talk`} />;
  const submit = async () => {
    setProblem(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      setProblem(say(`errors.${errorKey(error)}` as Key));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen scroll keyboard header={<Header title={say("signIn.title")} subtitle={say("signIn.lead")} />}>
      <View style={{ gap: 16 }}>
        <YasakiaMark size={56} animated />
        <TextField label={say("signIn.email")} value={email} onValueChange={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="username" />
        <TextField label={say("signIn.password")} value={password} onValueChange={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={() => void submit()} />
        {problem ? (
          <Txt tone="danger" accessibilityRole="alert">
            {problem}
          </Txt>
        ) : null}
        <Button label={busy ? say("signIn.working") : say("signIn.submit")} loading={busy} disabled={!email || !password || busy} onPress={() => void submit()} />
      </View>
    </Screen>
  );
}
