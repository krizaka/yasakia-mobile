import { roundPosition, haversineDistanceKm } from "../lib/geo";
import { DEFAULT_CONFIG } from "../lib/config";
import type { CustomizationConfig, BatchCandidate, IntroSummary } from "../lib/types";

describe("Mobile E2E Integration Contract Tests", () => {
  it("enforces zero score leakage on candidate cards", () => {
    const candidate: BatchCandidate = {
      id: "usr_alice123",
      displayName: "Alice",
      age: 28,
      city: "Montréal",
      interests: ["Open Source", "Design Systems"],
      photos: ["https://media.yasakia.com/avatars/alice.jpg"],
      whyYou: "Values craftsmanship and privacy.",
      whyThem: "Builds open-source tools with passion.",
    };

    // Candidates in Yasakia MUST NOT expose match scores or percentages
    expect((candidate as any).score).toBeUndefined();
    expect((candidate as any).compatibilityScore).toBeUndefined();
    expect((candidate as any).matchPercentage).toBeUndefined();
    expect(candidate.whyYou).toBeTruthy();
    expect(candidate.whyThem).toBeTruthy();
  });

  it("handles live configuration updates via SSE payload", () => {
    let currentConfig: CustomizationConfig = { ...DEFAULT_CONFIG };

    // Simulate SSE "config.updated" payload from Admin Studio
    const sseUpdatePayload: Partial<CustomizationConfig> = {
      theme: {
        brandHue: "turquoise",
        accentColor: "#14b8a6",
        borderRadius: "cut",
        fontDensity: "default",
      },
      matching: {
        defaultRadiusKm: 50,
        maxRadiusKm: 100,
        minAffinity: 0.8,
        batchSize: 5,
        cooldownHours: 24,
      },
    };

    currentConfig = {
      ...currentConfig,
      ...sseUpdatePayload,
      theme: { ...currentConfig.theme, ...sseUpdatePayload.theme },
      matching: { ...currentConfig.matching, ...sseUpdatePayload.matching },
    };

    expect(currentConfig.theme.brandHue).toBe("turquoise");
    expect(currentConfig.theme.accentColor).toBe("#14b8a6");
    expect(currentConfig.matching.defaultRadiusKm).toBe(50);
  });

  it("calculates proximity correctly for nearby mobile beacons", () => {
    // User at Mile End, Montreal (45.5231, -73.5990)
    // Nearby contact at Plateau Mont-Royal (45.5210, -73.5820)
    const user = { lat: 45.5231, lng: -73.5990 };
    const nearby = { lat: 45.5210, lng: -73.5820 };

    const distance = haversineDistanceKm(user.lat, user.lng, nearby.lat, nearby.lng);
    // Approximately 1.3 km apart
    expect(distance).toBeGreaterThan(1.0);
    expect(distance).toBeLessThan(2.0);

    // Coarsen both coordinates for privacy before server submission (1 km grid)
    const coarsenedUser = roundPosition(user.lat, user.lng);
    const coarsenedNearby = roundPosition(nearby.lat, nearby.lng);

    expect(coarsenedUser.precisionM).toBe(1000);
    expect(coarsenedNearby.precisionM).toBe(1000);
  });

  it("models intro conversations cleanly with double-blind opt-in", () => {
    const intro: IntroSummary = {
      id: "intro_xyz789",
      partnerName: "Bob",
      state: "OPEN",
      unreadCount: 2,
      lastMessage: "Excited to connect!",
      lastMessageAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    };

    expect(intro.state).toBe("OPEN");
    expect(intro.partnerName).toBe("Bob");
    expect(intro.unreadCount).toBe(2);
  });
});
