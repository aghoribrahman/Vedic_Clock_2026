/**
 * Type definitions — everything the Vedic clock pipeline produces.
 *
 * Mirrors the Flutter `lib/models/{panchang.dart, muhurta.dart, festival.dart}`
 * trio plus `lib/state/vedic_clock_state.dart`. We keep them in a single
 * module here because TypeScript's structural typing makes the one-class-
 * per-file Dart convention unnecessary, and one file is easier to scan.
 */

// ── The 30-Muhurta side ────────────────────────────────────────────────

export type MuhurtaNature = 'shubha' | 'ashubha';

export interface Muhurta {
  /** 0..29. */
  index: number;
  name: string;
  devanagari: string;
  deity: string;
  nature: MuhurtaNature;
  suitableFor: string;
}

// ── The 5-limb Panchang side ───────────────────────────────────────────

export type Paksha = 'shukla' | 'krishna';

export interface Tithi {
  /** 0..29. */
  index: number;
  /** 1..15 within its paksha. */
  number: number;
  paksha: Paksha;
  nameEn: string;
  nameHi: string;
  /** 0..1 within this tithi. */
  progressFraction: number;
}

export interface Nakshatra {
  /** 0..26. */
  index: number;
  nameEn: string;
  nameHi: string;
  /** 1..4 quarter. */
  pada: number;
  /** Vimshottari dasha lord. */
  lord: string;
  progressFraction: number;
}

export interface Yoga {
  /** 0..26. */
  index: number;
  nameEn: string;
  nameHi: string;
  progressFraction: number;
}

export interface Karana {
  /** 0..59. */
  slot: number;
  nameEn: string;
  nameHi: string;
  /** True for the 4 sthira (fixed) karanas, false for the 7 chara. */
  isFixed: boolean;
  progressFraction: number;
}

export interface Vara {
  /** ISO weekday 1..7 (Mon=1 … Sun=7). */
  weekday: number;
  nameEn: string;
  nameHi: string;
  lord: string;
}

export interface Rashi {
  /** 0..11. */
  index: number;
  nameEn: string;
  nameHi: string;
  /** Ruling planet. */
  lord: string;
  /** 0..1 within this rashi. */
  progressFraction: number;
}

export interface Panchang {
  tithi: Tithi;
  nakshatra: Nakshatra;
  yoga: Yoga;
  karana: Karana;
  vara: Vara;
  moonRashi: Rashi;
  sunRashi: Rashi;
}

// ── Festival ───────────────────────────────────────────────────────────

export interface Festival {
  /** Civil IST date the festival falls on, as YYYY-MM-DD. */
  dateGregorian: string;
  nameEn: string;
  nameHi: string;
  /** 'Solar' | 'Lunar' | 'Lunisolar' — informational only. */
  type: string;
  /** 'Major' | 'Minor'. */
  observance: string;
}

// ── Top-level clock state ──────────────────────────────────────────────

export interface VedicClockState {
  nowUtc: Date;
  sunriseUtc: Date;
  sunsetUtc: Date;
  nextSunriseUtc: Date;
  /** ms. nextSunrise − sunrise. */
  vedicDayLengthMs: number;
  /** ms. clamped to [0, vedicDayLength). */
  elapsedSinceSunriseMs: number;
  /** ms. vedicDayLength / 30. */
  muhurtaDurationMs: number;
  /** ms within the current muhurta. */
  muhurtaElapsedMs: number;
  /** 0..29. */
  muhurtaIndex: number;
  /** 0..360. elapsedSinceSunrise / vedicDay × 360. */
  clockAngleDeg: number;
  muhurta: Muhurta;
  panchang: Panchang;
  /** 1..30 — muhurtaIndex + 1, the display form. */
  muhurtaInDay: number;
  /** 0..29 — kala position within the current muhurta. */
  kalaInMuhurta: number;
  /** 0..29 — kashtha position within the current kala. */
  kashthaInKala: number;
  /** Vikram Samvat year (e.g. 2083). */
  vikramSamvatYear: number;
  /** Hindu lunar month, English (e.g. "Vaisakha"). */
  lunarMonthEn: string;
  /** Hindu lunar month, Devanagari (e.g. "वैशाख"). */
  lunarMonthHi: string;
  /** Festival falling on today's civil IST date, or null. */
  todayFestival: Festival | null;
}
