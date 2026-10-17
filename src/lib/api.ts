import * as SecureStore from "expo-secure-store";
import type {
  AgentMessage,
  BatchCandidate,
  BatchDecision,
  CoarseLocation,
  IntroMessage,
  IntroSummary,
  UserProfile,
  UserPortrait,
} from "./types";

const TOKEN_KEY = "yasakia_auth_token";
// On Android Emulator, 10.0.2.2 maps to the host machine's localhost (dev server port 3000)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";

export async function getAuthToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set("content-type", "application/json");
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `API error: ${res.status}`);
  }

  return (await res.json()) as T;
}

export const api = {
  // Account & Location
  async getMe(): Promise<UserProfile> {
    return request<UserProfile>("/api/me");
  },

  async updateLocation(coords: CoarseLocation): Promise<{ success: boolean }> {
    return request<{ success: boolean }>("/api/me/location", {
      method: "PUT",
      body: JSON.stringify(coords),
    });
  },

  async getNearbyCount(lat: number, lng: number, radiusKm = 25): Promise<{ nearbyCount: number }> {
    return request<{ nearbyCount: number }>(`/api/geo/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
  },

  // Conversational Agent (Talk-first)
  async getAgentThread(): Promise<{ messages: AgentMessage[]; portrait: UserPortrait | null }> {
    return request<{ messages: AgentMessage[]; portrait: UserPortrait | null }>("/api/agent");
  },

  async sendAgentMessage(content: string, locale = "en"): Promise<{ reply: AgentMessage; portrait?: UserPortrait }> {
    return request<{ reply: AgentMessage; portrait?: UserPortrait }>("/api/agent/messages", {
      method: "POST",
      body: JSON.stringify({ content, locale }),
    });
  },

  // Daily Batch
  async getCurrentBatch(): Promise<{ candidates: BatchCandidate[]; expiresAt: string } | null> {
    try {
      return await request<{ candidates: BatchCandidate[]; expiresAt: string }>("/api/batches/current");
    } catch {
      return null;
    }
  },

  async submitDecision(candidateId: string, decision: BatchDecision): Promise<{ status: string }> {
    return request<{ status: string }>("/api/batches/decisions", {
      method: "POST",
      body: JSON.stringify({ candidateId, decision }),
    });
  },

  // Introductions
  async getIntros(): Promise<IntroSummary[]> {
    return request<IntroSummary[]>("/api/intros");
  },

  async getIntroMessages(introId: string): Promise<IntroMessage[]> {
    return request<IntroMessage[]>(`/api/intros/${introId}/messages`);
  },

  async sendIntroMessage(introId: string, content: string): Promise<IntroMessage> {
    return request<IntroMessage>(`/api/intros/${introId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },
};
