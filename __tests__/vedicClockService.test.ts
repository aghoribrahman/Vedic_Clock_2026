/**
 * Vedic-clock math invariants — direct mirror of the Flutter project's
 * `test/vedic_clock_service_test.dart`.
 *
 * Every test pins down a property of the integer-millisecond pipeline:
 *   • muhurta indices are bounded [0, 29]
 *   • muhurta / kala / kashtha agree with the elapsed-fraction
 *   • boundaries (sunrise, sunset, next sunrise) behave correctly
 *   • the clock-angle integral matches dayProgress × 360
 */

import { Panchang } from '../src/models';
import { computeVedicClockState } from '../src/core/vedicClockService';

// ── Fixtures ──────────────────────────────────────────────────────────────

const FAKE_PANCHANG: Panchang = {
  tithi:    { index: 4, number: 5, paksha: 'shukla', nameEn: 'Panchami',  nameHi: 'पञ्चमी',   progressFraction: 0.4 },
  nakshatra:{ index: 5, nameEn: 'Mrigashira',         nameHi: 'मृगशिरा',   pada: 2, lord: 'Mars', progressFraction: 0.3 },
  yoga:     { index: 10, nameEn: 'Vriddhi',           nameHi: 'वृद्धि',    progressFraction: 0.5 },
  karana:   { slot: 8, nameEn: 'Bava', nameHi: 'बव', isFixed: false, progressFraction: 0.2 },
  vara:     { weekday: 2, nameEn: 'Mangalavara', nameHi: 'मङ्गलवार', lord: 'Mangala (Mars)' },
  moonRashi:{ index: 2, nameEn: 'Mithuna',  nameHi: 'मिथुन',  lord: 'Mercury', progressFraction: 0.6 },
  sunRashi: { index: 0, nameEn: 'Mesha',    nameHi: 'मेष',    lord: 'Mars',    progressFraction: 0.8 },
};

const SUNRISE     = new Date(Date.UTC(2026, 3, 25, 0, 30));      // 06:00 IST
const NEXT        = new Date(SUNRISE.getTime() + 24 * 3600_000); // exactly 24 h later
const SUNSET      = new Date(SUNRISE.getTime() + 12 * 3600_000); // noon-ish anchor

function callAt(nowUtc: Date) {
  return computeVedicClockState({
    nowUtc,
    sunriseUtc: SUNRISE,
    sunsetUtc: SUNSET,
    nextSunriseUtc: NEXT,
    panchang: FAKE_PANCHANG,
    vikramSamvatYear: 2083,
    lunarMonthEn: 'Vaisakha',
    lunarMonthHi: 'वैशाख',
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('computeVedicClockState', () => {
  it('at exactly sunrise → muhurtaIndex 0, kala 0, kashtha 0', () => {
    const s = callAt(SUNRISE);
    expect(s.muhurtaIndex).toBe(0);
    expect(s.muhurtaInDay).toBe(1);
    expect(s.kalaInMuhurta).toBe(0);
    expect(s.kashthaInKala).toBe(0);
    expect(s.clockAngleDeg).toBeCloseTo(0, 1);
  });

  it('1 ms before next sunrise → muhurtaIndex 29 (the last)', () => {
    const justBefore = new Date(NEXT.getTime() - 1);
    const s = callAt(justBefore);
    expect(s.muhurtaIndex).toBe(29);
    expect(s.muhurtaInDay).toBe(30);
    // clock angle should be just under 360
    expect(s.clockAngleDeg).toBeLessThan(360);
    expect(s.clockAngleDeg).toBeGreaterThan(359);
  });

  it('at sunrise + half day → muhurtaIndex 15, clockAngle ≈ 180°', () => {
    const halfDay = new Date(SUNRISE.getTime() + 12 * 3600_000);
    const s = callAt(halfDay);
    expect(s.muhurtaIndex).toBe(15); // 12 h / 48 min = 15 muhurtas in
    expect(s.clockAngleDeg).toBeCloseTo(180, 1);
  });

  it('kala count is in [0, 29] across the whole day', () => {
    for (let h = 0; h < 24; h++) {
      const t = new Date(SUNRISE.getTime() + h * 3600_000);
      const s = callAt(t);
      expect(s.kalaInMuhurta).toBeGreaterThanOrEqual(0);
      expect(s.kalaInMuhurta).toBeLessThanOrEqual(29);
      expect(s.kashthaInKala).toBeGreaterThanOrEqual(0);
      expect(s.kashthaInKala).toBeLessThanOrEqual(29);
    }
  });

  it('clamps nowUtc < sunrise to elapsedMs = 0', () => {
    const preDawn = new Date(SUNRISE.getTime() - 60_000);
    const s = callAt(preDawn);
    expect(s.elapsedSinceSunriseMs).toBe(0);
    expect(s.muhurtaIndex).toBe(0);
  });

  it('clamps nowUtc ≥ nextSunrise to dayLen − 1 ms', () => {
    const overshoot = new Date(NEXT.getTime() + 60_000);
    const s = callAt(overshoot);
    expect(s.elapsedSinceSunriseMs).toBe(s.vedicDayLengthMs - 1);
    expect(s.muhurtaIndex).toBe(29);
  });

  it('muhurta duration is dayLength / 30 (within 1 ms rounding)', () => {
    const s = callAt(SUNRISE);
    expect(Math.abs(s.muhurtaDurationMs - s.vedicDayLengthMs / 30)).toBeLessThanOrEqual(1);
  });

  it('all 30 muhurta indices show up over a 24 h sweep', () => {
    const seen = new Set<number>();
    const stepMs = 48 * 60 * 1000; // exactly one muhurta of a 24 h day
    for (let i = 0; i < 30; i++) {
      const t = new Date(SUNRISE.getTime() + i * stepMs + 1000);
      seen.add(callAt(t).muhurtaIndex);
    }
    expect(seen.size).toBe(30);
  });

  it('panchang passes through unchanged', () => {
    const s = callAt(SUNRISE);
    expect(s.panchang).toBe(FAKE_PANCHANG);
  });
});
