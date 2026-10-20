import { render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { AuthProvider, useAuth } from "@/lib/auth";

jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(async () => Promise.reject(new Error("keychain unavailable"))), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));

function Status() {
  return <Text>{useAuth().state.status}</Text>;
}

describe("the session", () => {
  it("is signed out, not an endless loader, when the secure store cannot be read", async () => {
    await render(
      <AuthProvider>
        <Status />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("signedOut")).toBeTruthy());
  });
});
