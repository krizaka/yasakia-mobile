import { krizakaFetch } from "@krizaka/query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { forgetToken, readToken, saveToken } from "./session";
import { SignedIn } from "./types";

/** Who is signed in: unknown while the token is read from the secure store, then signed in or not. */
type AuthState = { status: "loading" } | { status: "signedOut" } | { status: "signedIn" };

interface Auth {
  state: AuthState;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

/**
 * The session of the app: a bearer token (never a cookie) from `POST /api/auth/password` with `client: "native"` — the
 * e-mail sign-in of krizaka/.github#76 while sign-up is closed on dev. Apple, Google, GitHub and Facebook follow once
 * their OAuth apps exist.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  useEffect(() => {
    // A store that cannot be read (no keychain access) is a signed-out person, never an endless loader.
    void readToken()
      .then((token) => setState(token ? { status: "signedIn" } : { status: "signedOut" }))
      .catch(() => setState({ status: "signedOut" }));
  }, []);
  const signIn = useCallback(async (email: string, password: string) => {
    const answer = await krizakaFetch("/api/auth/password", { method: "POST", json: { email, password, client: "native" }, schema: SignedIn });
    await saveToken(answer.token);
    setState({ status: "signedIn" });
  }, []);
  const signOut = useCallback(async () => {
    await forgetToken();
    setState({ status: "signedOut" });
  }, []);
  const value = useMemo(() => ({ state, signIn, signOut }), [state, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth outside AuthProvider");
  return auth;
}
