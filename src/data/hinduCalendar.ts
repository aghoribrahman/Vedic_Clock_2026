/**
 * Hindu-calendar helpers — Vikram Samvat year + Hindu lunar month name.
 *
 * Direct port of `lib/data/hindu_calendar.dart`.
 *
 * - Vikram Samvat changes on Chaitra Shukla Pratipada (Gudi Padwa / Ugadi),
 *   which falls on a slightly different Gregorian date each year. The
 *   dates below are Drik Panchang-verified for IST. Verify-and-extend
 *   before 2035.
 * - Lunar month is derived from the sun's sidereal rashi at sunrise.
 *   Classical Purnimanta/Amanta rule: whichever solar sign the sun
 *   occupies, the lunar month is named for the NEXT sign along the
 *   zodiac. Sun in Simha (Leo) → Bhadrapada.
 */

/** Start dates (IST civil) of successive Vikram Samvat years as [y, m, d] tuples. */
export const UGADI_DATES_IST: ReadonlyArray<readonly [number, number, number]> = [
  [2020, 3, 25],
  [2021, 4, 13],
  [2022, 4, 2],
  [2023, 3, 22],
  [2024, 4, 9],
  [2025, 3, 30],
  [2026, 3, 19],
  [2027, 4, 7],
  [2028, 3, 26],
  [2029, 4, 14],
  [2030, 4, 3],
  [2031, 3, 24],
  [2032, 4, 11],
  [2033, 3, 31],
  [2034, 3, 20],
  [2035, 4, 8],
];

/** Latest Gregorian year present in the Ugadi table (last verified entry). */
const LAST_TABULATED_UGADI_YEAR = UGADI_DATES_IST[UGADI_DATES_IST.length - 1][0];

/**
 * Vikram Samvat year for the given IST civil date.
 *
 * VS = gregorianYearOfUgadi + 57. Ugadi 2025-03-30 → VS 2082;
 * Ugadi 2026-03-19 → VS 2083.
 *
 * **Past-table behaviour**: Ugadi falls between mid-March and mid-April
 * (range across 2020-2035: Mar 19 to Apr 14). When the input date is
 * beyond `LAST_TABULATED_UGADI_YEAR`, we apply a heuristic:
 *   - Date is in [Apr 15, Dec 31] of year Y → assume past Y's Ugadi → VS = Y + 57
 *   - Date is in [Jan 1, Mar 14] of year Y  → assume pre Y's Ugadi   → VS = Y + 56
 *   - Date is in [Mar 15, Apr 14] of year Y → ambiguous; we lean on
 *     the most recent tabulated entry (which is at most 2 weeks off).
 * The Ugadi table should be extended every 5-10 years to keep the
 * heuristic from kicking in. The kiosk console will warn when it does.
 *
 * @param istWall — an IST "wall clock" Date. The caller should pass an
 *   already-shifted Date (e.g. via `toIst()` from config.ts).
 */
export function vikramSamvatYearFor(istWall: Date): number {
  const y = istWall.getUTCFullYear();
  const m = istWall.getUTCMonth() + 1;
  const d = istWall.getUTCDate();

  // Past-table heuristic — fires when the input year is strictly later
  // than the last tabulated Ugadi year.
  if (y > LAST_TABULATED_UGADI_YEAR) {
    // After Apr 14, definitely past Ugadi.
    if (m > 4 || (m === 4 && d > 14)) {
      // eslint-disable-next-line no-console
      console.warn(
        `vikramSamvatYearFor: heuristic fallback for ${y}-${m}-${d} ` +
        `(table only covers through ${LAST_TABULATED_UGADI_YEAR}). ` +
        `Returning Y+57 = ${y + 57}. Extend UGADI_DATES_IST.`,
      );
      return y + 57;
    }
    // Before Mar 15, definitely pre-Ugadi.
    if (m < 3 || (m === 3 && d < 15)) {
      // eslint-disable-next-line no-console
      console.warn(
        `vikramSamvatYearFor: heuristic fallback for ${y}-${m}-${d}. ` +
        `Returning Y+56 = ${y + 56}. Extend UGADI_DATES_IST.`,
      );
      return y + 56;
    }
    // Ambiguous window Mar 15 - Apr 14 — fall through to the table.
  }

  let mostRecent: readonly [number, number, number] | null = null;
  for (const u of UGADI_DATES_IST) {
    const [uy, um, ud] = u;
    const isBeforeOrEqual =
      uy < y || (uy === y && um < m) || (uy === y && um === m && ud <= d);
    if (isBeforeOrEqual) {
      mostRecent = u;
    } else {
      break;
    }
  }
  const base = mostRecent ?? UGADI_DATES_IST[0];
  return base[0] + 57;
}

/** Lunar month names keyed by sun's sidereal rashi index (0 = Mesha). */
export const LUNAR_MONTH_EN = [
  'Vaisakha',      // 0  Sun in Mesha (Aries)
  'Jyeshtha',      // 1  Sun in Vrishabha (Taurus)
  'Ashadha',       // 2  Sun in Mithuna (Gemini)
  'Shravana',      // 3  Sun in Karka (Cancer)
  'Bhadrapada',    // 4  Sun in Simha (Leo)
  'Ashwin',        // 5  Sun in Kanya (Virgo)
  'Kartika',       // 6  Sun in Tula (Libra)
  'Margashirsha',  // 7  Sun in Vrischika (Scorpio)
  'Pausha',        // 8  Sun in Dhanu (Sagittarius)
  'Magha',         // 9  Sun in Makara (Capricorn)
  'Phalguna',      // 10 Sun in Kumbha (Aquarius)
  'Chaitra',       // 11 Sun in Meena (Pisces)
];

export const LUNAR_MONTH_HI = [
  'वैशाख', 'ज्येष्ठ', 'आषाढ़', 'श्रावण',
  'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष',
  'पौष', 'माघ', 'फाल्गुन', 'चैत्र',
];

export function lunarMonthEnForSunRashi(idx: number): string {
  return LUNAR_MONTH_EN[Math.max(0, Math.min(11, idx))];
}
export function lunarMonthHiForSunRashi(idx: number): string {
  return LUNAR_MONTH_HI[Math.max(0, Math.min(11, idx))];
}
