/**
 * Core types for Yasakia Mobile Client
 * Strictly adhering to Krizaka zero-score invariants and Loi 25 privacy contracts.
 */

export interface CustomizationConfig {
  theme: {
    brandHue: "emerald" | "turquoise" | "violet" | "indigo" | "slate" | "amber";
    accentColor: string;
    borderRadius: "rounded" | "cut" | "pill";
    fontDensity: "compact" | "default" | "relaxed";
  };
  branding: {
    appName: string;
    tagline: string;
  };
  matching: {
    defaultRadiusKm: number;
    maxRadiusKm: number;
    minAffinity: number;
    batchSize: number;
    cooldownHours: number;
  };
  taxonomy: {
    interests: string[];
    values: string[];
    intents: string[];
  };
  featureFlags: {
    voiceNotesEnabled: boolean;
    instantMatchesEnabled: boolean;
    proximityAlertsEnabled: boolean;
    debriefRequired: boolean;
  };
}

export interface ClientConfigPayload {
  version: number;
  config: CustomizationConfig;
}

export interface CoarseLocation {
  lat: number;
  lng: number;
  precisionM: number;
  recordedAt?: string;
}

export type AgentRole = "USER" | "AGENT" | "SYSTEM";

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  createdAt: string;
}

export interface UserPortrait {
  self: string;
  seeking: string;
  facets: Record<string, string>;
  isComplete: boolean;
}

export interface BatchCandidate {
  id: string;
  displayName: string;
  age: number;
  city: string;
  whyYou: string;
  whyThem: string;
  photos: string[];
  interests: string[];
}

export type BatchDecision = "INTERESTED" | "PASS" | "TELL_ME_MORE";

export interface IntroSummary {
  id: string;
  partnerName: string;
  partnerPhoto?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  state: "OPEN" | "CONTINUED" | "FADED" | "CLOSED";
  expiresAt: string;
}

export interface IntroMessage {
  id: string;
  introId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  birthDate: string;
  locale: "en" | "fr";
  location?: CoarseLocation;
}
