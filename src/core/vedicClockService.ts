/**
 * Pure projection of (now, sunrise pair, panchang, calendar labels) →
 * `VedicClockState`. Direct port of `lib/core/vedic_clock_service.dart`.
 *
 * ── Vedic-time math ───────────────────────────────────────────────────
 * The Vedic day is divided 30 · 30 · 30:
 *   1 Vedic day = 30 muhurtas = 900 kalas = 27,000 kashthas
 *
 * We compute all three from `elapsedSinceSunrise` so they always agree
 * with the clock angle and the muhurta index. No floating-point
 * conversion of intermediate quantities; we stay in integer
 * milliseconds and take integer quotients — same trick as the Flutter
 * code's integer-microsecond pipeline, just one decimal place coarser
 * (JS Date precision is 1 ms).
 *
 * For a 24-hour reference day: muhurta = 48 min, kala = 96 s,
 * kashtha = 3.2 s. So per-kashtha precision needs ~3.2 s tolerance —
 * milliseconds are plenty.
 */

import { muhurtaByIndex } from '../data/muhurtas';
import { Festival, Panchang, VedicClockState } from '../models';

export interface VedicClockInput {
  nowUtc: Date;
  sunriseUtc: Date;
  sunsetUtc: Date;
  nextSunriseUtc: Date;
  panchang: Panchang;
  vikramSamvatYear: number;
  lunarMonthEn: string;
  lunarMonthHi: string;
  todayFestival?: Festival | null;
}

export function computeVedicClockState(input: VedicClockInput): VedicClockState {
  const dayLenMs = input.nextSunriseUtc.getTime() - input.sunriseUtc.getTime();
  if (dayLenMs <= 0) {
    throw new Error('nextSunriseUtc must be strictly after sunriseUtc');
  }

  const muhurtaLenMs = Math.floor(dayLenMs / 30);

  let elapsedMs = input.nowUtc.getTime() - input.sunriseUtc.getTime();
  if (elapsedMs < 0) elapsedMs = 0;
  // Clamp strictly inside the day so the final muhurta index is 29, not 30.
  if (elapsedMs >= dayLenMs) elapsedMs = dayLenMs - 1;

  let idx = muhurtaLenMs === 0 ? 0 : Math.floor(elapsedMs / muhurtaLenMs);
  if (idx > 29) idx = 29;

  const muhurtaElapsedMs = elapsedMs - idx * muhurtaLenMs;
  const angleDeg = (elapsedMs / dayLenMs) * 360.0;

  // Kala: 30 per muhurta. kalaInMuhurta ∈ 0..29.
  const kalaSubLenMs = muhurtaLenMs === 0 ? 0 : Math.floor(muhurtaLenMs / 30);
  let kalaInMuhurta = kalaSubLenMs === 0
    ? 0
    : Math.floor(muhurtaElapsedMs / kalaSubLenMs);
  if (kalaInMuhurta > 29) kalaInMuhurta = 29;

  // Kashtha: 30 per kala. Compute from the within-kala remainder of
  // muhurtaElapsedMs so the last tick of a kala rolls both kala and
  // kashtha cleanly — no rounding drift.
  const kashthaSubLenMs = kalaSubLenMs === 0 ? 0 : Math.floor(kalaSubLenMs / 30);
  const withinKalaMs = muhurtaElapsedMs - kalaInMuhurta * kalaSubLenMs;
  let kashthaInKala = kashthaSubLenMs === 0
    ? 0
    : Math.floor(withinKalaMs / kashthaSubLenMs);
  if (kashthaInKala > 29) kashthaInKala = 29;

  return {
    nowUtc: input.nowUtc,
    sunriseUtc: input.sunriseUtc,
    sunsetUtc: input.sunsetUtc,
    nextSunriseUtc: input.nextSunriseUtc,
    vedicDayLengthMs: dayLenMs,
    elapsedSinceSunriseMs: elapsedMs,
    muhurtaDurationMs: muhurtaLenMs,
    muhurtaElapsedMs,
    muhurtaIndex: idx,
    clockAngleDeg: angleDeg,
    muhurta: muhurtaByIndex(idx),
    panchang: input.panchang,
    muhurtaInDay: idx + 1,
    kalaInMuhurta,
    kashthaInKala,
    vikramSamvatYear: input.vikramSamvatYear,
    lunarMonthEn: input.lunarMonthEn,
    lunarMonthHi: input.lunarMonthHi,
    todayFestival: input.todayFestival ?? null,
  };
}

// ── Convenience helpers used by widgets ─────────────────────────────────

export function muhurtaProgressFraction(s: VedicClockState): number {
  return s.muhurtaDurationMs === 0
    ? 0
    : s.muhurtaElapsedMs / s.muhurtaDurationMs;
}

export function dayProgressFraction(s: VedicClockState): number {
  return s.vedicDayLengthMs === 0
    ? 0
    : s.elapsedSinceSunriseMs / s.vedicDayLengthMs;
}

export function daylightDurationMs(s: VedicClockState): number {
  return s.sunsetUtc.getTime() - s.sunriseUtc.getTime();
}
