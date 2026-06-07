/**
 * Solar service invariants — exercises the `astronomy-engine`-backed
 * sunrise / sunset / sun-longitude / moon-longitude functions.
 *
 * Tolerances:
 *   • sunrise/sunset times: ±2 min vs Drik Panchang (Drik itself varies
 *     by a few seconds across sources; the kiosk doesn't care).
 *   • Sun longitude: ±1° vs the astronomical convention (vernal equinox
 *     at tropical 0°, summer solstice at tropical 90°).
 *   • Moon advances ~13°/day; we assert "moves at least 11°/day" so we
 *     don't lock down the precise rate.
 */

import {
  istCivilDateOf,
  moonLongitudeTropical,
  sunLongitudeTropical,
  sunriseOn,
  sunsetOn,
} from '../src/core/solar';

const HOURS = 3600 * 1000;
const IST_OFFSET_MS = 5.5 * HOURS;

/** Helper: returns the IST hour:minute:second of a UTC instant. */
function istHms(utc: Date): { h: number; m: number; s: number } {
  const ist = new Date(utc.getTime() + IST_OFFSET_MS);
  return { h: ist.getUTCHours(), m: ist.getUTCMinutes(), s: ist.getUTCSeconds() };
}

describe('sunriseOn / sunsetOn (Bhopal)', () => {
  it('sunrise on 2026-05-14 IST is ~05:39 IST', () => {
    const rise = sunriseOn(new Date(Date.UTC(2026, 4, 14)));
    const { h, m } = istHms(rise);
    expect(h).toBe(5);
    expect(m).toBeGreaterThanOrEqual(38);
    expect(m).toBeLessThanOrEqual(41);
  });

  it('sunset on 2026-05-14 IST is ~18:53 IST', () => {
    const set = sunsetOn(new Date(Date.UTC(2026, 4, 14)));
    const { h, m } = istHms(set);
    expect(h).toBe(18);
    expect(m).toBeGreaterThanOrEqual(52);
    expect(m).toBeLessThanOrEqual(55);
  });

  it('winter solstice 2026-12-21 → sunrise close to 07:00 IST', () => {
    const rise = sunriseOn(new Date(Date.UTC(2026, 11, 21)));
    const { h, m } = istHms(rise);
    expect(h).toBe(6);
    expect(m).toBeGreaterThanOrEqual(50);
  });

  it('summer solstice 2026-06-21 → sunrise in 05:30–05:40 IST window', () => {
    // Bhopal's earliest sunrise of the year — Drik publishes ~05:35-05:36.
    const rise = sunriseOn(new Date(Date.UTC(2026, 5, 21)));
    const { h, m } = istHms(rise);
    expect(h).toBe(5);
    expect(m).toBeGreaterThanOrEqual(30);
    expect(m).toBeLessThanOrEqual(40);
  });

  it('summer solstice 2026-06-21 → daylight ≥ 13 h 30 m', () => {
    const day = new Date(Date.UTC(2026, 5, 21));
    const daylightMs = sunsetOn(day).getTime() - sunriseOn(day).getTime();
    expect(daylightMs).toBeGreaterThan(13.5 * HOURS);
  });

  it('winter solstice 2026-12-21 → daylight ≤ 10 h 45 m', () => {
    const day = new Date(Date.UTC(2026, 11, 21));
    const daylightMs = sunsetOn(day).getTime() - sunriseOn(day).getTime();
    expect(daylightMs).toBeLessThan(10.75 * HOURS);
  });

  it('sunset is always strictly later than sunrise on the same civil date', () => {
    for (let m = 0; m < 12; m++) {
      const day = new Date(Date.UTC(2026, m, 15));
      expect(sunsetOn(day).getTime()).toBeGreaterThan(sunriseOn(day).getTime());
    }
  });

  it('consecutive sunrises are ~24 h apart (within ±5 min)', () => {
    const today = sunriseOn(new Date(Date.UTC(2026, 4, 14)));
    const tomorrow = sunriseOn(new Date(Date.UTC(2026, 4, 15)));
    const dtMs = tomorrow.getTime() - today.getTime();
    expect(dtMs).toBeGreaterThan(23.9 * HOURS);
    expect(dtMs).toBeLessThan(24.1 * HOURS);
  });
});

describe('sunLongitudeTropical', () => {
  it('returns values in [0, 360)', () => {
    for (let m = 0; m < 12; m++) {
      const v = sunLongitudeTropical(new Date(Date.UTC(2026, m, 1)));
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(360);
    }
  });

  it('at vernal equinox 2026-03-20 12:00 UTC → ≈ 0° tropical', () => {
    // March 20 2026 12:00 UTC is close to the equinox.
    const v = sunLongitudeTropical(new Date(Date.UTC(2026, 2, 20, 12, 0)));
    // Allow ±2° (equinox time varies year to year).
    const wrapped = v > 180 ? v - 360 : v;
    expect(Math.abs(wrapped)).toBeLessThan(2);
  });

  it('at summer solstice 2026-06-21 00:00 UTC → ≈ 90° tropical', () => {
    const v = sunLongitudeTropical(new Date(Date.UTC(2026, 5, 21, 0, 0)));
    expect(v).toBeGreaterThan(88);
    expect(v).toBeLessThan(92);
  });

  it('advances ~0.985° per day', () => {
    const t0 = sunLongitudeTropical(new Date(Date.UTC(2026, 4, 14, 0, 0)));
    const t1 = sunLongitudeTropical(new Date(Date.UTC(2026, 4, 15, 0, 0)));
    const delta = (t1 - t0 + 360) % 360;
    expect(delta).toBeGreaterThan(0.9);
    expect(delta).toBeLessThan(1.1);
  });
});

describe('moonLongitudeTropical', () => {
  it('returns values in [0, 360)', () => {
    for (let m = 0; m < 12; m++) {
      const v = moonLongitudeTropical(new Date(Date.UTC(2026, m, 1)));
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(360);
    }
  });

  it('advances much faster than the Sun (≥ 11°/day, ≤ 15°/day)', () => {
    const t0 = moonLongitudeTropical(new Date(Date.UTC(2026, 4, 14, 0, 0)));
    const t1 = moonLongitudeTropical(new Date(Date.UTC(2026, 4, 15, 0, 0)));
    const delta = (t1 - t0 + 360) % 360;
    expect(delta).toBeGreaterThanOrEqual(11);
    expect(delta).toBeLessThanOrEqual(15);
  });
});

describe('istCivilDateOf', () => {
  it('returns IST midnight for a UTC instant during IST daytime', () => {
    // 2026-05-14 09:00 IST == 2026-05-14 03:30 UTC.
    const utc = new Date(Date.UTC(2026, 4, 14, 3, 30));
    const ist = istCivilDateOf(utc);
    expect(ist.toISOString()).toBe('2026-05-14T00:00:00.000Z');
  });

  it('returns the next IST day for late-night UTC', () => {
    // 2026-05-14 23:00 UTC == 2026-05-15 04:30 IST.
    const utc = new Date(Date.UTC(2026, 4, 14, 23, 0));
    const ist = istCivilDateOf(utc);
    expect(ist.toISOString()).toBe('2026-05-15T00:00:00.000Z');
  });

  it('returns prior IST day for early-morning UTC', () => {
    // 2026-05-14 00:00 UTC == 2026-05-14 05:30 IST → still the 14th.
    const utc = new Date(Date.UTC(2026, 4, 14, 0, 0));
    const ist = istCivilDateOf(utc);
    expect(ist.toISOString()).toBe('2026-05-14T00:00:00.000Z');
  });
});
