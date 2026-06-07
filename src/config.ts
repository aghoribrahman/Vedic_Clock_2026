/**
 * Kiosk-wide constants. Hard-coded for Bhopal because this is an offline
 * single-location clock — generalising to "any location" would require an
 * IP-geo lookup at boot, which kiosks don't have, and an editable settings
 * screen, which kiosks don't want.
 *
 * Lat/lon are Drik Panchang's Bhopal anchor (23°15′35″ N, 77°24′40″ E).
 * Height is sea level; for sunrise refraction-corrected to −0.833° it
 * doesn't matter at 500 m elevation.
 */

export const LOCATION = {
  city: 'Bhopal',
  cityHi: 'भोपाल',
  /** Decimal degrees, north positive. */
  latitude: 23.2599,
  /** Decimal degrees, east positive. */
  longitude: 77.4126,
  /** Metres above sea level. */
  heightMeters: 500,
  /** IANA timezone — for display labels only; the math is all in UTC. */
  tz: 'Asia/Kolkata',
} as const;

/** IST is UTC+5:30, never DST. Use this to convert UTC↔IST for display. */
export const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** Convert a UTC Date to an IST-shifted Date (a "wall clock" Date). */
export function toIst(utc: Date): Date {
  return new Date(utc.getTime() + IST_OFFSET_MS);
}

/** Convert an IST-shifted "wall clock" Date back to a real UTC Date. */
export function fromIst(istWall: Date): Date {
  return new Date(istWall.getTime() - IST_OFFSET_MS);
}
