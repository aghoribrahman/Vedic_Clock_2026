/**
 * Festival lookup invariants — direct mirror of the Flutter codebase's
 * `test/festivals_repository_test.dart`.
 */

import { FESTIVALS, festivalForIstDate } from '../src/data/festivals';

describe('festivalForIstDate', () => {
  it('hits Holi 2026 (lunar major) on 2026-03-04 IST', () => {
    const f = festivalForIstDate(new Date(Date.UTC(2026, 2, 4)));
    expect(f).not.toBeNull();
    expect(f!.nameEn).toBe('Holi');
    expect(f!.nameHi).toBe('होली');
    expect(f!.observance).toBe('Major');
    expect(f!.type).toBe('Lunar');
  });

  it('hits Diwali 2026 (2026-11-08)', () => {
    const f = festivalForIstDate(new Date(Date.UTC(2026, 10, 8)));
    expect(f!.nameEn).toBe('Diwali (Deepavali)');
    expect(f!.nameHi).toBe('दीपावली');
  });

  it('hits Makar Sankranti (solar) on Jan 14', () => {
    const f = festivalForIstDate(new Date(Date.UTC(2026, 0, 14)));
    expect(f!.nameEn).toBe('Makar Sankranti');
    expect(f!.type).toBe('Solar');
  });

  it('returns null on a non-festival IST date', () => {
    const f = festivalForIstDate(new Date(Date.UTC(2026, 5, 7))); // 2026-06-07
    expect(f).toBeNull();
  });

  it('hits Maha Shivaratri 2025 (2025-02-26) — proves 2025 coverage', () => {
    const f = festivalForIstDate(new Date(Date.UTC(2025, 1, 26)));
    expect(f!.nameEn).toBe('Maha Shivaratri');
  });

  it('coverage spans 2025-2026 inclusive', () => {
    const years = new Set(FESTIVALS.map((f) => f.dateGregorian.slice(0, 4)));
    expect(years.has('2025')).toBe(true);
    expect(years.has('2026')).toBe(true);
  });

  it('all entries are well-formed ISO YYYY-MM-DD dates', () => {
    for (const f of FESTIVALS) {
      expect(f.dateGregorian).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
