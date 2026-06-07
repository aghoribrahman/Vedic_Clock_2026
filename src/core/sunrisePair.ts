/**
 * Sunrise-pair resolver — picks the sunrise that started the current
 * Vedic day plus the next one. Extracted from `useVedicClock.ts` so
 * the **CRITICAL** rule
 *
 *     "DO NOT compute tomorrow's sunrise as todaySunrise + 24 h.
 *      Sunrise drifts 1-3 minutes/day; over a week the cumulative
 *      error would visibly misplace the clock hand."
 *
 * can be locked down by a unit test that asserts the next sunrise
 * is an *independent* ephemeris call, not a `+ 24 h` shortcut.
 *
 * The contract:
 *   - If nowUtc is at or after today's IST sunrise:
 *       pair = (today-sunrise, tomorrow-sunrise)
 *   - Otherwise (still pre-dawn):
 *       pair = (yesterday-sunrise, today-sunrise)
 *
 * `sunriseFn` is injected so tests can pass a mock that records every
 * call and verifies the contract without hitting astronomy-engine.
 */

import { istCivilDateOf, sunriseOn as defaultSunriseOn } from './solar';

export interface SunrisePair {
  sunrise: Date;
  nextSunrise: Date;
}

/**
 * Should the day bundle be recomputed?
 *
 * Returns true when:
 *   • no bundle yet (first tick), OR
 *   • nowUtc has crossed the bundle's nextSunrise (the normal rollover), OR
 *   • **nowUtc has jumped *backward* past the bundle's sunrise** — this
 *     catches NTP corrections that fly across a Vedic-day boundary.
 *     Without this branch, a backward clock jump would silently leave
 *     the kiosk displaying yesterday's panchang.
 *
 * The "backward jump" check is the CRITICAL agenda-item-#4 sibling: just
 * as we must not synthesise `nextSunrise = sunrise + 24h`, we also
 * must not assume the system clock is monotone. Kiosks fail-soft only
 * when both inputs (forward and backward time travel) are handled.
 */
export function needsRebundle(
  nowUtc: Date,
  bundleSunrise: Date | null,
  bundleNextSunrise: Date | null,
): boolean {
  if (!bundleSunrise || !bundleNextSunrise) return true;
  const t = nowUtc.getTime();
  if (t >= bundleNextSunrise.getTime()) return true;
  if (t < bundleSunrise.getTime()) return true;
  return false;
}

/**
 * Pure projection of (nowUtc) → (sunrise, nextSunrise). The supplied
 * `sunriseFn` is called *twice* — once for the bracketing day and
 * once for the next/prior day. **Never** synthesise the next sunrise
 * from a fixed time offset.
 */
export function resolveSunrisePair(
  nowUtc: Date,
  sunriseFn: (istCivilDate: Date) => Date = defaultSunriseOn,
): SunrisePair {
  const istToday = istCivilDateOf(nowUtc);
  const todaySunrise = sunriseFn(istToday);

  if (nowUtc.getTime() >= todaySunrise.getTime()) {
    // Post-sunrise: pair = (today, tomorrow). The tomorrow call is an
    // independent ephemeris evaluation for `istToday + 1 day`.
    const istTomorrow = new Date(istToday.getTime() + 24 * 60 * 60 * 1000);
    return { sunrise: todaySunrise, nextSunrise: sunriseFn(istTomorrow) };
  }

  // Pre-dawn: pair = (yesterday, today). The yesterday call is also
  // independent.
  const istYesterday = new Date(istToday.getTime() - 24 * 60 * 60 * 1000);
  return { sunrise: sunriseFn(istYesterday), nextSunrise: todaySunrise };
}
