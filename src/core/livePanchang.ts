/**
 * Live Panchang — compute the 5-limb snapshot for the CURRENT instant,
 * not the sunrise-time snapshot.
 *
 * Background: published Drik almanacs print the panchang as "the values
 * at sunrise that initiate this Vedic day." A digital kiosk display,
 * though, leads the viewer to read the numbers as the *current* tithi /
 * nakshatra / etc — so when Dwadashi ends mid-morning and Trayodashi
 * begins, the on-screen value has to follow.
 *
 * What advances with the clock:
 *   • Tithi  — moon-sun elongation
 *   • Nakshatra — moon's sidereal longitude
 *   • Yoga — sun + moon
 *   • Karana — half-tithi
 *   • Moon Rashi — moon's sidereal rashi
 *   • Sun Rashi — sun's sidereal rashi
 *
 * What stays anchored to sunrise:
 *   • Vara — by classical convention the Vedic day inherits the weekday
 *     of the *civil* date that the sunrise belongs to. So Vara comes
 *     from the bundle's sunriseIst, not from `nowUtc`.
 *   • Vikram Samvat year, lunar month, festival — handled one layer up,
 *     in useVedicClock's day bundle.
 *
 * `sunLongitudeFn` and `moonLongitudeFn` are injectable so tests can
 * pass mocks that advance longitudes deterministically; production
 * code uses the astronomy-engine wrappers from `src/core/solar.ts`.
 */

import { Panchang } from '../models';
import { tropicalToSidereal } from './ayanamsha';
import { computePanchang } from './panchangService';
import {
  moonLongitudeTropical as defaultMoonLongitudeTropical,
  sunLongitudeTropical as defaultSunLongitudeTropical,
} from './solar';

export interface LivePanchangInput {
  /** The instant for which to compute the variable limbs. */
  nowUtc: Date;
  /**
   * Vedic-day anchor — the IST wall-clock of the sunrise that started
   * the current Vedic day. Vara is the only field derived from this.
   */
  sunriseIst: Date;
  /** Default: `sunLongitudeTropical` from solar.ts. */
  sunLongitudeFn?: (utc: Date) => number;
  /** Default: `moonLongitudeTropical` from solar.ts. */
  moonLongitudeFn?: (utc: Date) => number;
}

export function computeLivePanchang(input: LivePanchangInput): Panchang {
  const sunFn = input.sunLongitudeFn ?? defaultSunLongitudeTropical;
  const moonFn = input.moonLongitudeFn ?? defaultMoonLongitudeTropical;

  const sunTropical = sunFn(input.nowUtc);
  const moonTropical = moonFn(input.nowUtc);
  const sunSidereal = tropicalToSidereal(sunTropical, input.nowUtc);
  const moonSidereal = tropicalToSidereal(moonTropical, input.nowUtc);

  return computePanchang({
    sunLongitudeDeg: sunSidereal,
    moonLongitudeDeg: moonSidereal,
    sunriseIst: input.sunriseIst,
  });
}
