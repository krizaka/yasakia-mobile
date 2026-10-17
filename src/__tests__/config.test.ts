import { DEFAULT_CONFIG } from "../lib/config";

describe("Customization & Dynamic Branding", () => {
  it("provides valid default tokens and theme settings", () => {
    expect(DEFAULT_CONFIG.theme.brandHue).toBe("emerald");
    expect(DEFAULT_CONFIG.theme.accentColor).toBe("#10b981");
    expect(DEFAULT_CONFIG.branding.appName).toBe("Yasakia");
    expect(DEFAULT_CONFIG.matching.defaultRadiusKm).toBe(25);
    expect(DEFAULT_CONFIG.matching.minAffinity).toBeGreaterThan(0);
    expect(DEFAULT_CONFIG.matching.minAffinity).toBeLessThanOrEqual(1);
  });

  it("includes dynamic taxonomy and feature flags", () => {
    expect(DEFAULT_CONFIG.taxonomy.interests.length).toBeGreaterThan(3);
    expect(DEFAULT_CONFIG.featureFlags.proximityAlertsEnabled).toBe(true);
    expect(DEFAULT_CONFIG.featureFlags.voiceNotesEnabled).toBe(true);
  });
});
