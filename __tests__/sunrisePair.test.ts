/**
 * Sunrise-pair invariants — the file's whole reason for existing is the
 * **CRITICAL** project rule:
 *
 *   "DO NOT compute tomorrow's sunrise as todaySunrise + 24 h.
 *    Sunrise drifts 1-3 minutes/day; over a week the cumulative
 *    error would visibly misplace the clock hand."
 *
 * These tests assert that:
 *   1. Both pair members are *independent* `sunriseFn` calls — the
 *      next sunrise is NOT a fixed `+ 24 h` offset from today's.
 *   2. Post-sunrise nowUtc resolves to (today, tomorrow).
 *   3. Pre-dawn nowUtc resolves to (yesterday, today).
 *   4. The IST civil dates passed to `sunriseFn` are 1 day apart, not
 *      any kind of synthetic offset.
 *
 * The sunriseFn is injected so we can record every call.
 */

import { resolveSunrisePair } from '../src/core/sunrisePair';

describe('resolveSunrisePair — agenda critical invariant', () => {
  it('post-sunrise → pair is (todaySunrise, sunriseFn(istTomorrow))', () => {
    const calls: Date[] = [];
    // Mock sunrise function returns a fixed time per IST day. The
    // intentional "tomorrow drift" (33 min later) proves we are NOT
    // synthesising +24 h.
    const sunriseFn = (istDate: Date): Date => {
      calls.push(istDate);
      if (istDate.toISOString() === '2026-05-14T00:00:00.000Z') {
        return new Date(Date.UTC(2026, 4, 14, 0, 9, 43));   // 05:39:43 IST
      }
      if (istDate.toISOString() === '2026-05-15T00:00:00.000Z') {
        return new Date(Date.UTC(2026, 4, 15, 0, 10, 16));  // 05:40:16 IST
      }
      throw new Error(`unexpected sunriseFn call for ${istDate.toISOString()}`);
    };
    // nowUtc = 2026-05-14 09:00 IST → past today's sunrise.
    const nowUtc = new Date(Date.UTC(2026, 4, 14, 3, 30));
    const pair = resolveSunrisePair(nowUtc, sunriseFn);

    expect(pair.sunrise.toISOString()).toBe('2026-05-14T00:09:43.000Z');
    expect(pair.nextSunrise.toISOString()).toBe('2026-05-15T00:10:16.000Z');

    // CRITICAL: sunriseFn was called twice with different IST dates.
    expect(calls).toHaveLength(2);
    expect(calls[0].toISOString()).toBe('2026-05-14T00:00:00.000Z');
    expect(calls[1].toISOString()).toBe('2026-05-15T00:00:00.000Z');
  });

  it('pre-dawn → pair is (sunriseFn(istYesterday), todaySunrise)', () => {
    const calls: Date[] = [];
    const sunriseFn = (istDate: Date): Date => {
      calls.push(istDate);
      if (istDate.toISOString() === '2026-05-14T00:00:00.000Z') {
        return new Date(Date.UTC(2026, 4, 14, 0, 9, 43));
      }
      if (istDate.toISOString() === '2026-05-13T00:00:00.000Z') {
        return new Date(Date.UTC(2026, 4, 13, 0, 10, 14)); // 05:40:14 IST
      }
      throw new Error(`unexpected sunriseFn call for ${istDate.toISOString()}`);
    };
    // 2026-05-14 03:00 IST → before today's sunrise.
    const nowUtc = new Date(Date.UTC(2026, 4, 13, 21, 30));
    const pair = resolveSunrisePair(nowUtc, sunriseFn);

    expect(pair.sunrise.toISOString()).toBe('2026-05-13T00:10:14.000Z');
    expect(pair.nextSunrise.toISOString()).toBe('2026-05-14T00:09:43.000Z');

    expect(calls).toHaveLength(2);
    expect(calls[0].toISOString()).toBe('2026-05-14T00:00:00.000Z');
    expect(calls[1].toISOString()).toBe('2026-05-13T00:00:00.000Z');
  });

  it('nextSunrise is NOT computed as (sunrise + 24 h) — sunriseFn is called twice', () => {
    let count = 0;
    const sunriseFn = (istDate: Date): Date => {
      count++;
      // Return a value that drifts each day so a + 24 h shortcut would
      // produce visibly wrong output.
      const dayOffset = Math.round(
        (istDate.getTime() - Date.UTC(2026, 4, 14)) / (24 * 3600 * 1000),
      );
      return new Date(Date.UTC(2026, 4, 14 + dayOffset, 0, 9, 43 + 33 * dayOffset));
    };
    const nowUtc = new Date(Date.UTC(2026, 4, 14, 3, 30));
    const pair = resolveSunrisePair(nowUtc, sunriseFn);

    // Two distinct ephemeris calls happened.
    expect(count).toBe(2);
    // Drift is the test signal: 33 s difference between today and
    // tomorrow's sunrise, which only appears if both were independently
    // computed.
    const drift = pair.nextSunrise.getTime() - pair.sunrise.getTime();
    const exact24h = 24 * 3600 * 1000;
    expect(Math.abs(drift - exact24h)).toBe(33 * 1000);
  });

  it('IST civil dates passed to sunriseFn are exactly 1 day apart', () => {
    const calls: Date[] = [];
    const sunriseFn = (istDate: Date): Date => {
      calls.push(istDate);
      return new Date(istDate.getTime() + 6 * 3600 * 1000);
    };
    const nowUtc = new Date(Date.UTC(2026, 4, 14, 12, 0));
    resolveSunrisePair(nowUtc, sunriseFn);
    const delta = calls[1].getTime() - calls[0].getTime();
    expect(Math.abs(delta)).toBe(24 * 3600 * 1000);
  });

  it('uses the default sunriseOn when no fn injected (smoke test)', () => {
    // Just make sure the integration path doesn't throw.
    const nowUtc = new Date(Date.UTC(2026, 4, 14, 3, 30));
    const pair = resolveSunrisePair(nowUtc);
    expect(pair.sunrise.getTime()).toBeLessThan(pair.nextSunrise.getTime());
    // Real Bhopal sunrise drifts a few seconds day-to-day; assert the
    // pair spans 23-25 h.
    const dt = pair.nextSunrise.getTime() - pair.sunrise.getTime();
    expect(dt).toBeGreaterThan(23.9 * 3600 * 1000);
    expect(dt).toBeLessThan(24.1 * 3600 * 1000);
  });
});
