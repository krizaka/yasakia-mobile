import * as SecureStore from "expo-secure-store";

/** The bearer token of the signed-in person, in the device's secure store (Keychain / Keystore), cached in memory. */
const KEY = "yasakia.session";
let cached: string | null | undefined;

export async function readToken(): Promise<string | null> {
  if (cached === undefined) cached = await SecureStore.getItemAsync(KEY);
  return cached;
}

export async function saveToken(token: string): Promise<void> {
  cached = token;
  await SecureStore.setItemAsync(KEY, token);
}

export async function forgetToken(): Promise<void> {
  cached = null;
  await SecureStore.deleteItemAsync(KEY);
}
