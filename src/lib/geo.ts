import * as Location from "expo-location";
import type { CoarseLocation } from "./types";

/**
 * 1 km coordinate rounding invariant (Loi 25 & Krizaka Privacy Spec).
 * Lat step: 0.009 deg ≈ 1.00 km.
 * Lng step: 0.012 deg ≈ 1.00 km at 45° latitude (Montreal baseline).
 * Coarse coordinates protect person safety; exact GPS coordinates never leave device.
 */
export const LAT_STEP = 0.009;
export const LNG_STEP = 0.012;
export const PRECISION_M = 1000;

export function roundPosition(lat: number, lng: number): CoarseLocation {
  const roundedLat = Math.round(lat / LAT_STEP) * LAT_STEP;
  const roundedLng = Math.round(lng / LNG_STEP) * LNG_STEP;
  return {
    lat: Number(roundedLat.toFixed(5)),
    lng: Number(roundedLng.toFixed(5)),
    precisionM: PRECISION_M,
  };
}

/**
 * Request foreground & background permissions.
 */
export async function requestLocationPermissions(): Promise<boolean> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== "granted") {
    return false;
  }
  return true;
}

/**
 * Get current location and return Loi 25 privacy-coarsened coordinates.
 */
export async function getCurrentCoarseLocation(): Promise<CoarseLocation | null> {
  try {
    const hasPerm = await requestLocationPermissions();
    if (!hasPerm) return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return roundPosition(loc.coords.latitude, loc.coords.longitude);
  } catch (err) {
    console.warn("[geo] Failed to obtain location:", err);
    return null;
  }
}

/**
 * Subscribe to location changes, automatically applying 1 km precision rounding.
 */
export async function startLocationSubscription(
  onLocation: (loc: CoarseLocation) => void,
): Promise<Location.LocationSubscription | null> {
  try {
    const hasPerm = await requestLocationPermissions();
    if (!hasPerm) return null;

    let lastLat: number | null = null;
    let lastLng: number | null = null;

    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 500, // Check every 500m
        timeInterval: 30000,   // Every 30s
      },
      (position) => {
        const rounded = roundPosition(position.coords.latitude, position.coords.longitude);
        // Only trigger update if rounded grid bucket changed
        if (rounded.lat !== lastLat || rounded.lng !== lastLng) {
          lastLat = rounded.lat;
          lastLng = rounded.lng;
          onLocation(rounded);
        }
      },
    );
  } catch (err) {
    console.warn("[geo] Failed to watch location:", err);
    return null;
  }
}

/**
 * Haversine distance in km between two coordinate points.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}
