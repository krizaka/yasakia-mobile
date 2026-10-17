import { haversineDistanceKm, roundPosition } from "../lib/geo";

describe("Geospatial & Loi 25 Privacy Invariants", () => {
  it("coarsens exact coordinates to a 1 km grid bucket", () => {
    // Montreal coordinate baseline
    const exactLat = 45.521345;
    const exactLng = -73.582312;

    const rounded = roundPosition(exactLat, exactLng);

    expect(rounded.precisionM).toBe(1000);
    // Rounded latitude must be a multiple of 0.009
    expect(Number((rounded.lat / 0.009).toFixed(4)) % 1).toBeCloseTo(0, 2);
    // Rounded longitude must be a multiple of 0.012
    expect(Number((rounded.lng / 0.012).toFixed(4)) % 1).toBeCloseTo(0, 2);
  });

  it("calculates accurate Haversine distance in kilometers", () => {
    // Montreal (45.5017, -73.5673) to Laval (45.5601, -73.7121) ≈ 13.0 km
    const dist = haversineDistanceKm(45.5017, -73.5673, 45.5601, -73.7121);
    expect(dist).toBeGreaterThan(10);
    expect(dist).toBeLessThan(16);
  });
});
