/**
 * Shared `VedicClockState` fixture — used by widget mount tests that
 * just want a believable snapshot to pump into a component, not a
 * particular astronomical configuration.
 */

import { MUHURTAS } from '../../src/data/muhurtas';
import { Festival, Panchang, VedicClockState } from '../../src/models';

const SUNRISE = new Date(Date.UTC(2026, 4, 14, 0, 9, 43));   // 05:39:43 IST
const SUNSET  = new Date(Date.UTC(2026, 4, 14, 13, 23, 54)); // 18:53:54 IST
const NEXT    = new Date(SUNRISE.getTime() + 24 * 3600_000);

const PANCHANG: Panchang = {
  tithi:    { index: 27, number: 13, paksha: 'krishna', nameEn: 'Trayodashi', nameHi: 'त्रयोदशी', progressFraction: 0.4 },
  nakshatra:{ index: 26, nameEn: 'Revati', nameHi: 'रेवती', pada: 4, lord: 'Mercury', progressFraction: 0.8 },
  yoga:     { index: 21, nameEn: 'Sadhya', nameHi: 'साध्य', progressFraction: 0.5 },
  karana:   { slot: 55, nameEn: 'Vishti', nameHi: 'विष्टि', isFixed: false, progressFraction: 0.2 },
  vara:     { weekday: 4, nameEn: 'Guruvara', nameHi: 'गुरुवार', lord: 'Guru (Jupiter)' },
  moonRashi:{ index: 11, nameEn: 'Meena', nameHi: 'मीन', lord: 'Jupiter', progressFraction: 0.95 },
  sunRashi: { index: 0, nameEn: 'Mesha', nameHi: 'मेष', lord: 'Mars', progressFraction: 0.95 },
};

const FESTIVAL: Festival = {
  dateGregorian: '2026-11-08',
  nameEn: 'Diwali (Deepavali)',
  nameHi: 'दीपावली',
  type: 'Lunar',
  observance: 'Major',
};

export function stubState(overrides: Partial<VedicClockState> = {}): VedicClockState {
  const noonIst = new Date(Date.UTC(2026, 4, 14, 6, 30)); // 12:00 IST
  const elapsedMs = noonIst.getTime() - SUNRISE.getTime();
  const dayLenMs = NEXT.getTime() - SUNRISE.getTime();
  const muhurtaLenMs = Math.floor(dayLenMs / 30);
  const idx = Math.min(29, Math.floor(elapsedMs / muhurtaLenMs));
  const muhurtaElapsedMs = elapsedMs - idx * muhurtaLenMs;
  const kalaLen = Math.floor(muhurtaLenMs / 30);
  const kala = Math.min(29, Math.floor(muhurtaElapsedMs / kalaLen));
  const kashtha = Math.min(29, Math.floor((muhurtaElapsedMs - kala * kalaLen) / Math.max(1, Math.floor(kalaLen / 30))));

  return {
    nowUtc: noonIst,
    sunriseUtc: SUNRISE,
    sunsetUtc: SUNSET,
    nextSunriseUtc: NEXT,
    vedicDayLengthMs: dayLenMs,
    elapsedSinceSunriseMs: elapsedMs,
    muhurtaDurationMs: muhurtaLenMs,
    muhurtaElapsedMs,
    muhurtaIndex: idx,
    clockAngleDeg: (elapsedMs / dayLenMs) * 360,
    muhurta: MUHURTAS[idx],
    panchang: PANCHANG,
    muhurtaInDay: idx + 1,
    kalaInMuhurta: kala,
    kashthaInKala: kashtha,
    vikramSamvatYear: 2083,
    lunarMonthEn: 'Vaisakha',
    lunarMonthHi: 'वैशाख',
    todayFestival: null,
    ...overrides,
  };
}

export const stubStateWithFestival = (): VedicClockState =>
  stubState({ todayFestival: FESTIVAL });

export const stubStatePreDawn = (): VedicClockState => {
  // 2 h before sunrise.
  const t = new Date(SUNRISE.getTime() - 2 * 3600_000);
  return stubState({ nowUtc: t, elapsedSinceSunriseMs: 0, muhurtaIndex: 0, muhurtaInDay: 1, kalaInMuhurta: 0, kashthaInKala: 0, muhurta: MUHURTAS[0], clockAngleDeg: 0 });
};

export const stubStateNight = (): VedicClockState => {
  const t = new Date(SUNSET.getTime() + 6 * 3600_000);
  return stubState({ nowUtc: t });
};
