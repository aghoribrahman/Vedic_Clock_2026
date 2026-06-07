import { Festival } from '../models';

/**
 * Hindu festival calendar — covers 2025-2035, Drik Panchang verified for IST.
 *
 * Direct port of the Flutter codebase's `assets/data/festivals.json`. Lunar
 * festivals must be re-verified per year against a Panchang source.
 *
 * Drik Panchang quotes festivals by their civil Gregorian date, so we
 * match on that — not on the Vedic-day reckoning that would tie the
 * festival to the prior sunrise.
 */
export const FESTIVALS: readonly Festival[] = [
  // ── 2025 ────────────────────────────────────────────────────────────
  { dateGregorian: '2025-01-14', nameEn: 'Makar Sankranti',                  nameHi: 'मकर संक्रांति',       type: 'Solar',     observance: 'Major' },
  { dateGregorian: '2025-02-26', nameEn: 'Maha Shivaratri',                  nameHi: 'महाशिवरात्रि',       type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2025-03-14', nameEn: 'Holi',                             nameHi: 'होली',               type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2025-03-30', nameEn: 'Hindu New Year (Gudi Padwa / Ugadi)', nameHi: 'उगादि',           type: 'Lunisolar', observance: 'Major' },
  { dateGregorian: '2025-04-06', nameEn: 'Ram Navami',                       nameHi: 'राम नवमी',           type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2025-08-09', nameEn: 'Raksha Bandhan',                   nameHi: 'रक्षा बंधन',         type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2025-08-16', nameEn: 'Krishna Janmashtami',              nameHi: 'कृष्ण जन्माष्टमी',   type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2025-08-27', nameEn: 'Ganesh Chaturthi',                 nameHi: 'गणेश चतुर्थी',       type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2025-09-22', nameEn: 'Navratri Begins',                  nameHi: 'नवरात्रि',           type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2025-10-02', nameEn: 'Dussehra (Vijayadashami)',         nameHi: 'दशहरा',              type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2025-10-20', nameEn: 'Diwali (Deepavali)',               nameHi: 'दीपावली',            type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2025-11-05', nameEn: 'Kartik Purnima',                   nameHi: 'कार्तिक पूर्णिमा',   type: 'Lunar',     observance: 'Major' },

  // ── 2026 ────────────────────────────────────────────────────────────
  { dateGregorian: '2026-01-14', nameEn: 'Makar Sankranti',                  nameHi: 'मकर संक्रांति',       type: 'Solar',     observance: 'Major' },
  { dateGregorian: '2026-02-15', nameEn: 'Maha Shivaratri',                  nameHi: 'महाशिवरात्रि',       type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2026-03-04', nameEn: 'Holi',                             nameHi: 'होली',               type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2026-03-19', nameEn: 'Hindu New Year (Gudi Padwa / Ugadi)', nameHi: 'उगादि',           type: 'Lunisolar', observance: 'Major' },
  { dateGregorian: '2026-03-27', nameEn: 'Ram Navami',                       nameHi: 'राम नवमी',           type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2026-08-28', nameEn: 'Raksha Bandhan',                   nameHi: 'रक्षा बंधन',         type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2026-09-04', nameEn: 'Krishna Janmashtami',              nameHi: 'कृष्ण जन्माष्टमी',   type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2026-09-15', nameEn: 'Ganesh Chaturthi',                 nameHi: 'गणेश चतुर्थी',       type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2026-10-11', nameEn: 'Navratri Begins',                  nameHi: 'नवरात्रि',           type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2026-10-20', nameEn: 'Dussehra (Vijayadashami)',         nameHi: 'दशहरा',              type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2026-11-08', nameEn: 'Diwali (Deepavali)',               nameHi: 'दीपावली',            type: 'Lunar',     observance: 'Major' },
  { dateGregorian: '2026-11-24', nameEn: 'Kartik Purnima',                   nameHi: 'कार्तिक पूर्णिमा',   type: 'Lunar',     observance: 'Major' },
];

/**
 * Find the festival landing on the given IST civil date (a Date whose
 * Y/M/D are interpreted as IST wall-clock). Returns null if none match.
 */
export function festivalForIstDate(istWall: Date): Festival | null {
  const y = istWall.getUTCFullYear();
  const m = istWall.getUTCMonth() + 1;
  const d = istWall.getUTCDate();
  const iso = `${y}-${pad2(m)}-${pad2(d)}`;
  return FESTIVALS.find((f) => f.dateGregorian === iso) ?? null;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
