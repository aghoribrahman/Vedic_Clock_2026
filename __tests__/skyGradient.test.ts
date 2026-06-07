/**
 * Solar-phase + sky-gradient invariants — direct mirror of the Flutter
 * codebase's `test/living_sky_test.dart` math half.
 *
 * We don't assert pixel-level gradient colours (they're a continuous
 * interpolation — tying tests to specific RGB values would flap on
 * every palette tweak). Instead we lock down the *behaviour*:
 *   1. computeSolarPhase classifies day vs night by sunrise/sunset.
 *   2. normalisedAltitude peaks at +1 around solar noon, 0 at horizon,
 *      −1 at night midpoint — so the starfield-fade math hooked to it
 *      produces a stars-out day and stars-in night.
 *   3. gradientForPhase returns a 3-stop array, day brighter than night.
 */

import { computeSolarPhase, gradientForPhase, luma, SKY_STOPS } from '../src/core/skyGradient';
import { Muhurta, Panchang, VedicClockState } from '../src/models';

// ── Fixtures ──────────────────────────────────────────────────────────────

const SUNRISE = new Date(Date.UTC(2026, 3, 21, 0, 30)); // 06:00 IST
const SUNSET = new Date(SUNRISE.getTime() + 12 * 3600_000);
const NEXT_SUNRISE = new Date(SUNRISE.getTime() + 24 * 3600_000);

const STUB_MUHURTA: Muhurta = {
  index: 12, name: 'Varuna', devanagari: 'वरुण', deity: 'Varuna',
  nature: 'shubha', suitableFor: 'water travel',
};
const STUB_PANCHANG: Panchang = {
  tithi:    { index: 4, number: 5, paksha: 'shukla', nameEn: 'Panchami', nameHi: 'पञ्चमी', progressFraction: 0.4 },
  nakshatra:{ index: 5, nameEn: 'Mrigashira', nameHi: 'मृगशिरा', pada: 2, lord: 'Mars', progressFraction: 0.3 },
  yoga:     { index: 10, nameEn: 'Vriddhi', nameHi: 'वृद्धि', progressFraction: 0.5 },
  karana:   { slot: 8, nameEn: 'Bava', nameHi: 'बव', isFixed: false, progressFraction: 0.2 },
  vara:     { weekday: 2, nameEn: 'Mangalavara', nameHi: 'मङ्गलवार', lord: 'Mangala (Mars)' },
  moonRashi:{ index: 2, nameEn: 'Mithuna', nameHi: 'मिथुन', lord: 'Mercury', progressFraction: 0.6 },
  sunRashi: { index: 0, nameEn: 'Mesha', nameHi: 'मेष', lord: 'Mars', progressFraction: 0.8 },
};

function stateAt(nowUtc: Date): VedicClockState {
  return {
    nowUtc,
    sunriseUtc: SUNRISE,
    sunsetUtc: SUNSET,
    nextSunriseUtc: NEXT_SUNRISE,
    vedicDayLengthMs: NEXT_SUNRISE.getTime() - SUNRISE.getTime(),
    elapsedSinceSunriseMs: Math.max(0, nowUtc.getTime() - SUNRISE.getTime()),
    muhurtaDurationMs: 48 * 60 * 1000,
    muhurtaElapsedMs: 0,
    muhurtaIndex: 12,
    clockAngleDeg: 150,
    muhurta: STUB_MUHURTA,
    panchang: STUB_PANCHANG,
    muhurtaInDay: 13,
    kalaInMuhurta: 15,
    kashthaInKala: 7,
    vikramSamvatYear: 2083,
    lunarMonthEn: 'Vaisakha',
    lunarMonthHi: 'वैशाख',
    todayFestival: null,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('computeSolarPhase', () => {
  it('at exactly sunrise → isDay, altitude ≈ 0', () => {
    const p = computeSolarPhase(stateAt(SUNRISE));
    expect(p.isDay).toBe(true);
    expect(p.normalisedAltitude).toBeCloseTo(0, 2);
    expect(p.phaseFraction).toBeCloseTo(0, 2);
  });

  it('at solar noon → isDay, altitude ≈ +1', () => {
    const noon = new Date(SUNRISE.getTime() + 6 * 3600_000);
    const p = computeSolarPhase(stateAt(noon));
    expect(p.isDay).toBe(true);
    expect(p.normalisedAltitude).toBeCloseTo(1.0, 2);
    expect(p.phaseFraction).toBeCloseTo(0.5, 2);
  });

  it('just before sunset → isDay, altitude near 0', () => {
    const justBefore = new Date(SUNSET.getTime() - 60_000);
    const p = computeSolarPhase(stateAt(justBefore));
    expect(p.isDay).toBe(true);
    expect(p.normalisedAltitude).toBeLessThan(0.01);
    expect(p.normalisedAltitude).toBeGreaterThan(-0.01);
  });

  it('just after sunset → isDay false, altitude < 0', () => {
    const justAfter = new Date(SUNSET.getTime() + 60_000);
    const p = computeSolarPhase(stateAt(justAfter));
    expect(p.isDay).toBe(false);
    expect(p.normalisedAltitude).toBeLessThan(0);
  });

  it('at the night midpoint → altitude ≈ −1', () => {
    const nightMid = new Date(SUNSET.getTime() + 6 * 3600_000);
    const p = computeSolarPhase(stateAt(nightMid));
    expect(p.isDay).toBe(false);
    expect(p.normalisedAltitude).toBeCloseTo(-1.0, 2);
  });

  it('pre-dawn (before sunrise) is night with altitude < 0', () => {
    const preDawn = new Date(SUNRISE.getTime() - 2 * 3600_000);
    const p = computeSolarPhase(stateAt(preDawn));
    expect(p.isDay).toBe(false);
    expect(p.normalisedAltitude).toBeLessThan(0);
    // We're in the back half of the night bucket, approaching sunrise.
    expect(p.phaseFraction).toBeGreaterThan(0.5);
  });
});

describe('gradientForPhase', () => {
  it('returns a 3-stop tuple for any phase', () => {
    const noon = computeSolarPhase(stateAt(new Date(SUNRISE.getTime() + 6 * 3600_000)));
    const g = gradientForPhase(noon);
    expect(g).toHaveLength(3);
    g.forEach((c) => expect(typeof c).toBe('string'));
  });

  it('day gradient is visibly brighter than night', () => {
    const noon = computeSolarPhase(stateAt(new Date(SUNRISE.getTime() + 6 * 3600_000)));
    const mid = computeSolarPhase(stateAt(new Date(SUNSET.getTime() + 6 * 3600_000)));
    const dayBrightness = luma(gradientForPhase(noon)[2]);
    const nightBrightness = luma(gradientForPhase(mid)[2]);
    expect(dayBrightness).toBeGreaterThan(nightBrightness);
  });

  it('clamps to the lowest stop when altitude is below the minimum', () => {
    // Force altitude ≈ -1 (night midpoint).
    const nightMid = computeSolarPhase(stateAt(new Date(SUNSET.getTime() + 6 * 3600_000)));
    const g = gradientForPhase(nightMid);
    // Should be near the deepest-night stop.
    expect(luma(g[2])).toBeLessThan(50);
  });

  it('clamps to the highest stop when altitude is at the maximum', () => {
    const noon = computeSolarPhase(stateAt(new Date(SUNRISE.getTime() + 6 * 3600_000)));
    const g = gradientForPhase(noon);
    expect(luma(g[2])).toBeGreaterThan(100);
  });

  it('two identical states produce equal gradient tuples', () => {
    const noon = new Date(SUNRISE.getTime() + 6 * 3600_000);
    const g1 = gradientForPhase(computeSolarPhase(stateAt(noon)));
    const g2 = gradientForPhase(computeSolarPhase(stateAt(noon)));
    expect(g1).toEqual(g2);
  });

  it('SKY_STOPS spans the full -1..+1 altitude range', () => {
    expect(SKY_STOPS[0].altitude).toBeLessThanOrEqual(-1);
    expect(SKY_STOPS[SKY_STOPS.length - 1].altitude).toBeGreaterThanOrEqual(1);
  });

  it('SKY_STOPS altitudes are strictly increasing', () => {
    for (let i = 1; i < SKY_STOPS.length; i++) {
      expect(SKY_STOPS[i].altitude).toBeGreaterThan(SKY_STOPS[i - 1].altitude);
    }
  });
});

describe('luma', () => {
  it('parses rgb() strings', () => {
    expect(luma('rgb(255, 255, 255)')).toBeCloseTo(255, 0);
    expect(luma('rgb(0, 0, 0)')).toBeCloseTo(0, 0);
  });

  it('parses hex strings', () => {
    expect(luma('#FFFFFF')).toBeCloseTo(255, 0);
    expect(luma('#000000')).toBeCloseTo(0, 0);
  });
});
