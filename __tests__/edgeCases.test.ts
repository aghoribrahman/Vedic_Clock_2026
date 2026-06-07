/**
 * Edge cases where the clock could fail DRASTICALLY on a real kiosk.
 *
 * Each `describe` block targets one class of failure mode that an
 * always-on offline kiosk in Bhopal will eventually trip:
 *
 *   1. System clock anomalies — NTP corrections (backward jumps),
 *      battery-RTC failures, long sleeps causing forward jumps
 *   2. Vedic-day boundary races — millisecond-precision crossings
 *      of sunrise / nextSunrise
 *   3. Panchang degree-boundary edge cases — exact new moon, exact
 *      full moon, exact Pisces→Aries wrap
 *   4. Date-range failures — pre-table years, post-table years,
 *      far-future ephemeris calls
 *   5. Defensive arithmetic — zero-length / negative day lengths,
 *      precision underflow
 *
 * Tests that lock down already-correct behaviour pass right away. The
 * three "🚨 Bug" tests at the top of each group were green only after
 * the matching fixes in `sunrisePair.ts` (needsRebundle) and
 * `hinduCalendar.ts` (post-table heuristic).
 */

import { tropicalToSidereal } from '../src/core/ayanamsha';
import { computePanchang } from '../src/core/panchangService';
import { needsRebundle, resolveSunrisePair } from '../src/core/sunrisePair';
import { computeVedicClockState } from '../src/core/vedicClockService';
import { vikramSamvatYearFor } from '../src/data/hinduCalendar';
import { festivalForIstDate } from '../src/data/festivals';
import { MUHURTAS } from '../src/data/muhurtas';
import { Festival, Panchang } from '../src/models';

// ── Fixtures ──────────────────────────────────────────────────────────────

const PANCHANG: Panchang = {
  tithi:    { index: 27, number: 13, paksha: 'krishna', nameEn: 'Trayodashi', nameHi: 'त्रयोदशी', progressFraction: 0.4 },
  nakshatra:{ index: 26, nameEn: 'Revati', nameHi: 'रेवती', pada: 4, lord: 'Mercury', progressFraction: 0.8 },
  yoga:     { index: 21, nameEn: 'Sadhya', nameHi: 'साध्य', progressFraction: 0.5 },
  karana:   { slot: 55, nameEn: 'Vishti', nameHi: 'विष्टि', isFixed: false, progressFraction: 0.2 },
  vara:     { weekday: 4, nameEn: 'Guruvara', nameHi: 'गुरुवार', lord: 'Guru (Jupiter)' },
  moonRashi:{ index: 11, nameEn: 'Meena', nameHi: 'मीन', lord: 'Jupiter', progressFraction: 0.95 },
  sunRashi: { index: 0, nameEn: 'Mesha', nameHi: 'मेष', lord: 'Mars', progressFraction: 0.95 },
};

function projectAt(nowUtc: Date, sunriseUtc: Date, nextSunriseUtc: Date) {
  return computeVedicClockState({
    nowUtc,
    sunriseUtc,
    sunsetUtc: new Date(sunriseUtc.getTime() + 13 * 3600_000),
    nextSunriseUtc,
    panchang: PANCHANG,
    vikramSamvatYear: 2083,
    lunarMonthEn: 'Vaisakha',
    lunarMonthHi: 'वैशाख',
    todayFestival: null,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 1. System clock anomalies
// ─────────────────────────────────────────────────────────────────────────

describe('🚨 System clock — backward jumps (NTP correction)', () => {
  const sunrise = new Date(Date.UTC(2026, 4, 14, 0, 10));    // 05:40 IST
  const nextSunrise = new Date(Date.UTC(2026, 4, 15, 0, 10));

  it('needsRebundle: true when no bundle yet', () => {
    expect(needsRebundle(new Date(), null, null)).toBe(true);
  });

  it('needsRebundle: false in normal mid-day operation', () => {
    const midDay = new Date(Date.UTC(2026, 4, 14, 6, 0));    // 11:30 IST
    expect(needsRebundle(midDay, sunrise, nextSunrise)).toBe(false);
  });

  it('needsRebundle: true at exact nextSunrise (normal rollover)', () => {
    expect(needsRebundle(nextSunrise, sunrise, nextSunrise)).toBe(true);
  });

  it('🚨 needsRebundle: true when clock jumps BACKWARD past sunrise', () => {
    // Kiosk's local clock drifted to 2026-05-15 14:00 IST; NTP sync
    // corrects it back to 2026-05-14 03:00 IST. The bundle is still
    // (2026-05-15, 2026-05-16). The post-correction nowUtc is BEFORE
    // bundle.sunrise — without the backward-jump branch, the kiosk
    // would show 2026-05-15's panchang for the next 27 hours.
    const correctedBack = new Date(Date.UTC(2026, 4, 13, 21, 0)); // 02:30 IST 14th
    expect(needsRebundle(correctedBack, sunrise, nextSunrise)).toBe(true);
  });

  it('🚨 needsRebundle: true when clock jumps to Unix epoch (RTC failure)', () => {
    const epoch = new Date(0);
    expect(needsRebundle(epoch, sunrise, nextSunrise)).toBe(true);
  });

  it('🚨 needsRebundle: true on a 48-hour forward jump (kiosk slept)', () => {
    const woke = new Date(nextSunrise.getTime() + 48 * 3600_000);
    expect(needsRebundle(woke, sunrise, nextSunrise)).toBe(true);
  });
});

describe('System clock — sunrise-pair resolution under jumps', () => {
  it('forward jump that crosses N sunrises still picks the correct pair', () => {
    // Mock sunrise function: 05:40 IST each day, +30 s drift per day.
    const sunriseFn = (istDate: Date): Date => {
      const offset = Math.round(
        (istDate.getTime() - Date.UTC(2026, 4, 14)) / (24 * 3600_000),
      );
      return new Date(Date.UTC(2026, 4, 14 + offset, 0, 10, 30 * offset));
    };
    // nowUtc is 5 days past the original anchor.
    const nowUtc = new Date(Date.UTC(2026, 4, 19, 6, 0));  // 11:30 IST 19th
    const pair = resolveSunrisePair(nowUtc, sunriseFn);
    // Should pick (19th sunrise, 20th sunrise), not anything stale.
    expect(pair.sunrise.toISOString()).toBe('2026-05-19T00:12:30.000Z');
    expect(pair.nextSunrise.toISOString()).toBe('2026-05-20T00:13:00.000Z');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Vedic-day boundary races (millisecond precision)
// ─────────────────────────────────────────────────────────────────────────

describe('Vedic-day boundary — millisecond races', () => {
  const sunrise = new Date(Date.UTC(2026, 4, 14, 0, 10));
  const nextSunrise = new Date(Date.UTC(2026, 4, 15, 0, 10));

  it('exactly at sunrise → muhurta 1, kala 0, kashtha 0', () => {
    const s = projectAt(sunrise, sunrise, nextSunrise);
    expect(s.muhurtaInDay).toBe(1);
    expect(s.kalaInMuhurta).toBe(0);
    expect(s.kashthaInKala).toBe(0);
    expect(s.elapsedSinceSunriseMs).toBe(0);
  });

  it('1 ms before sunrise → clamps to elapsed 0 (still muhurta 1)', () => {
    const t = new Date(sunrise.getTime() - 1);
    const s = projectAt(t, sunrise, nextSunrise);
    expect(s.elapsedSinceSunriseMs).toBe(0);
    expect(s.muhurtaInDay).toBe(1);
  });

  it('exactly at nextSunrise → clamps to last instant, muhurta 30', () => {
    const s = projectAt(nextSunrise, sunrise, nextSunrise);
    expect(s.muhurtaInDay).toBe(30);
    expect(s.elapsedSinceSunriseMs).toBe(s.vedicDayLengthMs - 1);
  });

  it('clockAngleDeg stays strictly below 360 at all times', () => {
    // Sweep every minute of a 24h day; angle must never reach 360.
    for (let m = 0; m <= 24 * 60; m++) {
      const t = new Date(sunrise.getTime() + m * 60_000);
      const s = projectAt(t, sunrise, nextSunrise);
      expect(s.clockAngleDeg).toBeGreaterThanOrEqual(0);
      expect(s.clockAngleDeg).toBeLessThan(360);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Panchang degree-boundary edge cases
// ─────────────────────────────────────────────────────────────────────────

describe('Panchang — degree-exact boundaries', () => {
  const sunriseIst = new Date(Date.UTC(2026, 4, 14, 5, 39, 43));

  it('elongation 0° (new moon / amavasya conjunction) → Shukla Pratipada', () => {
    const p = computePanchang({ sunLongitudeDeg: 100, moonLongitudeDeg: 100, sunriseIst });
    expect(p.tithi.index).toBe(0);
    expect(p.tithi.paksha).toBe('shukla');
    expect(p.tithi.nameEn).toBe('Pratipada');
  });

  it('elongation EXACTLY 180° → opens Krishna Pratipada (just past Purnima)', () => {
    // The instant the moon's elongation hits 180° marks the start of
    // Krishna paksha — the tithi BEFORE this instant was Purnima, the
    // tithi AT this instant is Krishna Pratipada.
    const p = computePanchang({ sunLongitudeDeg: 100, moonLongitudeDeg: 280, sunriseIst });
    expect(p.tithi.index).toBe(15);
    expect(p.tithi.paksha).toBe('krishna');
    expect(p.tithi.number).toBe(1);
    expect(p.tithi.nameEn).toBe('Pratipada');
  });

  it('elongation 168° (just before 180°) → Shukla Purnima itself', () => {
    const p = computePanchang({ sunLongitudeDeg: 100, moonLongitudeDeg: 268, sunriseIst });
    expect(p.tithi.index).toBe(14);
    expect(p.tithi.nameEn).toBe('Purnima');
  });

  it('elongation 359.99° → Krishna Amavasya, not wrap-around bug', () => {
    const p = computePanchang({ sunLongitudeDeg: 100, moonLongitudeDeg: 459.99, sunriseIst });
    expect(p.tithi.index).toBe(29);
    expect(p.tithi.nameEn).toBe('Amavasya');
  });

  it('moon at 359.99° sidereal → Revati (last nakshatra), not Ashwini wrap', () => {
    const p = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 359.99, sunriseIst });
    expect(p.nakshatra.index).toBe(26);
    expect(p.nakshatra.nameEn).toBe('Revati');
  });

  it('moon at exact 0° sidereal → Ashwini Pada 1, not Revati', () => {
    const p = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 0, sunriseIst });
    expect(p.nakshatra.index).toBe(0);
    expect(p.nakshatra.nameEn).toBe('Ashwini');
    expect(p.nakshatra.pada).toBe(1);
  });

  it('sidereal 359.99° → Meena (last rashi), not wrap to Mesha', () => {
    const p = computePanchang({ sunLongitudeDeg: 359.99, moonLongitudeDeg: 0, sunriseIst });
    expect(p.sunRashi.index).toBe(11);
    expect(p.sunRashi.nameEn).toBe('Meena');
  });

  it('progress fractions stay strictly within [0, 1) at every boundary', () => {
    for (let elong = 0; elong < 360; elong += 12) {
      const p = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: elong, sunriseIst });
      expect(p.tithi.progressFraction).toBeGreaterThanOrEqual(0);
      expect(p.tithi.progressFraction).toBeLessThan(1);
    }
  });

  it('elongation tiny-positive (1 µdeg) past tithi boundary stays in current slot', () => {
    // Just past Shukla Pratipada start (1 micro-degree into tithi 0).
    const p = computePanchang({
      sunLongitudeDeg: 0,
      moonLongitudeDeg: 0.000001,
      sunriseIst,
    });
    expect(p.tithi.index).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. Date-range failures
// ─────────────────────────────────────────────────────────────────────────

describe('Date-range failures — festivals + Vikram Samvat', () => {
  it('festival lookup post-2026-11-24 → null (not exception)', () => {
    expect(festivalForIstDate(new Date(Date.UTC(2027, 5, 1)))).toBeNull();
  });

  it('festival lookup pre-2025 → null (not exception)', () => {
    expect(festivalForIstDate(new Date(Date.UTC(2010, 0, 1)))).toBeNull();
  });

  it('festival lookup on Unix epoch (1970-01-01) → null', () => {
    expect(festivalForIstDate(new Date(0))).toBeNull();
  });

  it('🚨 VS year for 2036-05-01 (post-table) → 2093 via heuristic', () => {
    // 2036-05-01 is well past any plausible Ugadi date, so VS = 2036 + 57.
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(vikramSamvatYearFor(new Date(Date.UTC(2036, 4, 1)))).toBe(2093);
    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('🚨 VS year for 2040-02-15 (post-table, pre-Ugadi window) → 2096 (Y+56)', () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(vikramSamvatYearFor(new Date(Date.UTC(2040, 1, 15)))).toBe(2096);
    consoleWarn.mockRestore();
  });

  it('VS year for the last tabulated Ugadi (2035-04-08) → 2092', () => {
    expect(vikramSamvatYearFor(new Date(Date.UTC(2035, 3, 8)))).toBe(2092);
  });

  it('VS year for Unix epoch (1970-01-01) → clamps to earliest known + 57', () => {
    // Behaviour: returns 2020 + 57 = 2077. Documented, not preferred,
    // but at least bounded.
    expect(vikramSamvatYearFor(new Date(0))).toBe(2077);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. Defensive arithmetic in vedicClockService
// ─────────────────────────────────────────────────────────────────────────

describe('VedicClockService — defensive arithmetic', () => {
  const sunrise = new Date(Date.UTC(2026, 4, 14, 0, 10));

  it('throws on zero-length day (defensive — nextSunrise === sunrise)', () => {
    expect(() =>
      projectAt(sunrise, sunrise, sunrise),
    ).toThrow(/nextSunrise/);
  });

  it('throws on negative day length (nextSunrise BEFORE sunrise)', () => {
    const earlier = new Date(sunrise.getTime() - 3600_000);
    expect(() =>
      projectAt(sunrise, sunrise, earlier),
    ).toThrow(/nextSunrise/);
  });

  it('handles a 23 h Vedic day cleanly (winter Bhopal)', () => {
    const shortNext = new Date(sunrise.getTime() + 23 * 3600_000);
    const s = projectAt(new Date(sunrise.getTime() + 11.5 * 3600_000), sunrise, shortNext);
    expect(s.muhurtaIndex).toBeGreaterThanOrEqual(14);
    expect(s.muhurtaIndex).toBeLessThanOrEqual(15);
  });

  it('handles a 25 h Vedic day cleanly (summer Bhopal)', () => {
    const longNext = new Date(sunrise.getTime() + 25 * 3600_000);
    const s = projectAt(new Date(sunrise.getTime() + 12.5 * 3600_000), sunrise, longNext);
    expect(s.muhurtaIndex).toBeGreaterThanOrEqual(14);
    expect(s.muhurtaIndex).toBeLessThanOrEqual(15);
  });

  it('every muhurta in MUHURTAS lookup is a valid object', () => {
    for (let i = 0; i < 30; i++) {
      expect(MUHURTAS[i]).toBeDefined();
      expect(MUHURTAS[i].name).toMatch(/^[A-Z]/);
      expect(['shubha', 'ashubha']).toContain(MUHURTAS[i].nature);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. Ayanamsha boundary
// ─────────────────────────────────────────────────────────────────────────

describe('Ayanamsha + tropicalToSidereal — wrap boundaries', () => {
  it('tropical 24° at 2026 mid-year → sidereal ~0° (Mesha start)', () => {
    const t = new Date(Date.UTC(2026, 5, 1));
    // Lahiri 2026 ≈ 24.21° → sidereal ≈ -0.21° → wraps to 359.79°.
    const s = tropicalToSidereal(24, t);
    // The wrap means we sit just before Mesha rather than at it.
    expect(s).toBeGreaterThan(359);
    expect(s).toBeLessThan(360);
  });

  it('tropical 24.21° (≈ ayanamsha) → sidereal near 0° (either side, post-wrap)', () => {
    const t = new Date(Date.UTC(2026, 5, 1));
    const s = tropicalToSidereal(24.21, t);
    // Lahiri 2026 mid-year is ~24.22°, so `24.21 - 24.22` is slightly
    // negative; normalisation wraps to ~359.99°. Either side of 0° is
    // a "near-Mesha-start" sidereal value.
    const nearZero = s < 1 || s > 359;
    expect(nearZero).toBe(true);
  });

  it('sidereal value is always in [0, 360)', () => {
    const t = new Date(Date.UTC(2026, 5, 1));
    for (let tropical = -360; tropical <= 720; tropical += 17) {
      const s = tropicalToSidereal(tropical, t);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThan(360);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. Reality checks — these should never fail; they catch unrelated drift
// ─────────────────────────────────────────────────────────────────────────

describe('Reality checks — invariants we can never lose', () => {
  it('muhurtaInDay is always muhurtaIndex + 1', () => {
    const sr = new Date(Date.UTC(2026, 4, 14, 0, 10));
    const ns = new Date(sr.getTime() + 24 * 3600_000);
    for (let h = 0; h < 24; h++) {
      const s = projectAt(new Date(sr.getTime() + h * 3600_000), sr, ns);
      expect(s.muhurtaInDay).toBe(s.muhurtaIndex + 1);
    }
  });

  it('muhurtaInDay is in 1..30, never 0 or 31', () => {
    const sr = new Date(Date.UTC(2026, 4, 14, 0, 10));
    const ns = new Date(sr.getTime() + 24 * 3600_000);
    for (let h = -1; h <= 25; h++) {
      const s = projectAt(new Date(sr.getTime() + h * 3600_000), sr, ns);
      expect(s.muhurtaInDay).toBeGreaterThanOrEqual(1);
      expect(s.muhurtaInDay).toBeLessThanOrEqual(30);
    }
  });

  it('muhurta lookup returns the muhurta with matching index', () => {
    const sr = new Date(Date.UTC(2026, 4, 14, 0, 10));
    const ns = new Date(sr.getTime() + 24 * 3600_000);
    for (let h = 0; h < 24; h++) {
      const s = projectAt(new Date(sr.getTime() + h * 3600_000), sr, ns);
      expect(s.muhurta.index).toBe(s.muhurtaIndex);
    }
  });
});
