/**
 * Hindu-calendar lookup invariants.
 *
 * Direct mirror of the Flutter codebase's `test/hindu_calendar_test.dart`.
 * VS = gregorianYearOfUgadi + 57. Ugadi 2025-03-30 → VS 2082. Ugadi
 * 2026-03-19 → VS 2083. Pre-Ugadi-2026 → still VS 2082.
 */

import {
  LUNAR_MONTH_EN,
  LUNAR_MONTH_HI,
  lunarMonthEnForSunRashi,
  lunarMonthHiForSunRashi,
  UGADI_DATES_IST,
  vikramSamvatYearFor,
} from '../src/data/hinduCalendar';

describe('vikramSamvatYearFor', () => {
  it('returns 2082 the day before Ugadi 2026 (still in VS 2082)', () => {
    const t = new Date(Date.UTC(2026, 2, 18)); // 2026-03-18, day before Ugadi
    expect(vikramSamvatYearFor(t)).toBe(2082);
  });

  it('returns 2083 on Ugadi 2026 itself', () => {
    const t = new Date(Date.UTC(2026, 2, 19)); // 2026-03-19, Ugadi
    expect(vikramSamvatYearFor(t)).toBe(2083);
  });

  it('returns 2083 mid-year 2026', () => {
    const t = new Date(Date.UTC(2026, 6, 15)); // 2026-07-15
    expect(vikramSamvatYearFor(t)).toBe(2083);
  });

  it('returns 2083 right up to Ugadi 2027', () => {
    const t = new Date(Date.UTC(2027, 3, 6)); // 2027-04-06, day before Ugadi 2027
    expect(vikramSamvatYearFor(t)).toBe(2083);
  });

  it('rolls to 2084 on Ugadi 2027 (2027-04-07)', () => {
    const t = new Date(Date.UTC(2027, 3, 7));
    expect(vikramSamvatYearFor(t)).toBe(2084);
  });

  it('handles dates before the earliest tabulated Ugadi by clamping', () => {
    const t = new Date(Date.UTC(2019, 0, 1));
    // Clamp behaviour: falls back to the first table entry.
    expect(vikramSamvatYearFor(t)).toBe(UGADI_DATES_IST[0][0] + 57);
  });

  it('every tabulated Ugadi date itself yields the expected VS year', () => {
    for (const [y, m, d] of UGADI_DATES_IST) {
      const t = new Date(Date.UTC(y, m - 1, d));
      expect(vikramSamvatYearFor(t)).toBe(y + 57);
    }
  });
});

describe('lunar month lookup', () => {
  it('Sun in Mesha (0) → Vaisakha', () => {
    expect(lunarMonthEnForSunRashi(0)).toBe('Vaisakha');
    expect(lunarMonthHiForSunRashi(0)).toBe('वैशाख');
  });

  it('Sun in Simha (4) → Bhadrapada', () => {
    expect(lunarMonthEnForSunRashi(4)).toBe('Bhadrapada');
    expect(lunarMonthHiForSunRashi(4)).toBe('भाद्रपद');
  });

  it('Sun in Meena (11) → Chaitra', () => {
    expect(lunarMonthEnForSunRashi(11)).toBe('Chaitra');
    expect(lunarMonthHiForSunRashi(11)).toBe('चैत्र');
  });

  it('all 12 rashi indices map cleanly', () => {
    for (let i = 0; i < 12; i++) {
      expect(lunarMonthEnForSunRashi(i)).toBe(LUNAR_MONTH_EN[i]);
      expect(lunarMonthHiForSunRashi(i)).toBe(LUNAR_MONTH_HI[i]);
    }
  });

  it('out-of-range indices are clamped to [0, 11]', () => {
    expect(lunarMonthEnForSunRashi(-1)).toBe(LUNAR_MONTH_EN[0]);
    expect(lunarMonthEnForSunRashi(99)).toBe(LUNAR_MONTH_EN[11]);
  });
});
