/**
 * Pure projection of (sun longitude, moon longitude, sunrise IST date) →
 * `Panchang`. Direct port of `lib/core/panchang_service.dart`.
 *
 * No ephemeris access and no system clock — feed it the three inputs and
 * it returns a fully-named, indexed snapshot. Longitudes must be in the
 * SAME frame (the kiosk uses sidereal/Lahiri everywhere, matching Drik
 * Panchang); the actual tropical→sidereal conversion lives in the
 * caller (see hooks/useVedicClock.ts), so this module's only job is
 * projection from already-sidereal angles.
 */

import {
  AMAVASYA_EN,
  AMAVASYA_HI,
  CHARA_KARANA_NAMES_EN,
  CHARA_KARANA_NAMES_HI,
  NAKSHATRA_LORDS,
  NAKSHATRA_NAMES_EN,
  NAKSHATRA_NAMES_HI,
  RASHI_LORDS,
  RASHI_NAMES_EN,
  RASHI_NAMES_HI,
  STHIRA_KARANA_NAMES_EN,
  STHIRA_KARANA_NAMES_HI,
  TITHI_NAMES_EN,
  TITHI_NAMES_HI,
  VARA_LORDS,
  VARA_NAMES_EN,
  VARA_NAMES_HI,
  YOGA_NAMES_EN,
  YOGA_NAMES_HI,
} from '../data/panchangNames';
import {
  Karana,
  Nakshatra,
  Paksha,
  Panchang,
  Rashi,
  Tithi,
  Vara,
  Yoga,
} from '../models';
import { normaliseDeg } from './ayanamsha';

export interface PanchangInput {
  /** Sun's sidereal longitude in degrees, [0, 360). */
  sunLongitudeDeg: number;
  /** Moon's sidereal longitude in degrees, [0, 360). */
  moonLongitudeDeg: number;
  /** Sunrise as an IST "wall clock" Date — used for the Vara. */
  sunriseIst: Date;
}

export function computePanchang(input: PanchangInput): Panchang {
  const sun = normaliseDeg(input.sunLongitudeDeg);
  const moon = normaliseDeg(input.moonLongitudeDeg);
  const elongation = normaliseDeg(moon - sun);

  return {
    tithi: tithiOf(elongation),
    nakshatra: nakshatraOf(moon),
    yoga: yogaOf(sun, moon),
    karana: karanaOf(elongation),
    vara: varaOf(input.sunriseIst),
    moonRashi: rashiOf(moon),
    sunRashi: rashiOf(sun),
  };
}

// ── Limb projections ──────────────────────────────────────────────────────

function tithiOf(elongation: number): Tithi {
  const size = 12.0;
  let idx = Math.floor(elongation / size);
  if (idx > 29) idx = 29;
  const within = elongation - idx * size;
  const paksha: Paksha = idx < 15 ? 'shukla' : 'krishna';
  const number = idx < 15 ? idx + 1 : idx - 14;

  let nameEn: string;
  let nameHi: string;
  if (paksha === 'krishna' && number === 15) {
    nameEn = AMAVASYA_EN;
    nameHi = AMAVASYA_HI;
  } else {
    nameEn = TITHI_NAMES_EN[number - 1];
    nameHi = TITHI_NAMES_HI[number - 1];
  }

  return {
    index: idx,
    number,
    paksha,
    nameEn,
    nameHi,
    progressFraction: within / size,
  };
}

function nakshatraOf(moonSidereal: number): Nakshatra {
  const size = 360.0 / 27; // 13°20'
  let idx = Math.floor(moonSidereal / size);
  if (idx > 26) idx = 26;
  const within = moonSidereal - idx * size;
  const pada = Math.max(1, Math.min(4, Math.floor(within / (size / 4)) + 1));
  return {
    index: idx,
    nameEn: NAKSHATRA_NAMES_EN[idx],
    nameHi: NAKSHATRA_NAMES_HI[idx],
    pada,
    lord: NAKSHATRA_LORDS[idx],
    progressFraction: within / size,
  };
}

function yogaOf(sun: number, moon: number): Yoga {
  const sum = normaliseDeg(sun + moon);
  const size = 360.0 / 27;
  let idx = Math.floor(sum / size);
  if (idx > 26) idx = 26;
  const within = sum - idx * size;
  return {
    index: idx,
    nameEn: YOGA_NAMES_EN[idx],
    nameHi: YOGA_NAMES_HI[idx],
    progressFraction: within / size,
  };
}

function karanaOf(elongation: number): Karana {
  const size = 6.0;
  let slot = Math.floor(elongation / size);
  if (slot > 59) slot = 59;
  const within = (elongation - slot * size) / size;

  let nameEn: string;
  let nameHi: string;
  let isFixed: boolean;
  const sthiraEn = STHIRA_KARANA_NAMES_EN[slot];
  if (sthiraEn !== undefined) {
    nameEn = sthiraEn;
    nameHi = STHIRA_KARANA_NAMES_HI[slot];
    isFixed = true;
  } else {
    // slots 1..56 cycle through the seven chara karanas.
    const c = (slot - 1) % 7;
    nameEn = CHARA_KARANA_NAMES_EN[c];
    nameHi = CHARA_KARANA_NAMES_HI[c];
    isFixed = false;
  }

  return {
    slot,
    nameEn,
    nameHi,
    isFixed,
    progressFraction: within,
  };
}

function varaOf(sunriseIst: Date): Vara {
  // JS Date.getUTCDay returns Sun=0…Sat=6; we want ISO Mon=1…Sun=7.
  const jsDow = sunriseIst.getUTCDay();
  const iso = jsDow === 0 ? 7 : jsDow;
  return {
    weekday: iso,
    nameEn: VARA_NAMES_EN[iso],
    nameHi: VARA_NAMES_HI[iso],
    lord: VARA_LORDS[iso],
  };
}

function rashiOf(siderealLongitude: number): Rashi {
  const size = 30.0;
  let idx = Math.floor(siderealLongitude / size);
  if (idx > 11) idx = 11;
  const within = siderealLongitude - idx * size;
  return {
    index: idx,
    nameEn: RASHI_NAMES_EN[idx],
    nameHi: RASHI_NAMES_HI[idx],
    lord: RASHI_LORDS[idx],
    progressFraction: within / size,
  };
}
