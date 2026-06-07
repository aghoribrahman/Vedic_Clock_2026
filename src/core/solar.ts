/**
 * Solar service — sunrise / sunset / sun-longitude / moon-longitude
 * computed via the pure-JS `astronomy-engine` package.
 *
 * This file replaces the Flutter codebase's `lib/core/swisseph_service.dart`,
 * which used the Swiss Ephemeris via a native plugin. astronomy-engine is
 * pure JavaScript (no native code, no binary blobs, no NDK toolchain), so
 * the kiosk runs in Expo Go without a custom dev client. Accuracy is
 * arcsecond-level for the Sun and Moon over centuries either side of
 * J2000 — more than enough for Panchang display.
 *
 * Sidereal conversion (Lahiri ayanamsha) is done one layer up by
 * `panchangService.ts`. This file deals only in tropical (ecliptic-of-
 * date) longitudes, which is what astronomy-engine returns natively.
 */

import * as Astronomy from 'astronomy-engine';
import { LOCATION, toIst } from '../config';

/** A pre-built Observer at the kiosk's hard-coded location. */
const OBSERVER = new Astronomy.Observer(
  LOCATION.latitude,
  LOCATION.longitude,
  LOCATION.heightMeters,
);

/**
 * Find sunrise for the given civil IST date.
 *
 * @param istCivilDate — a Date whose UTC Y/M/D fields name the IST civil
 *   date (e.g. `new Date(Date.UTC(2026, 4, 14))` for 2026-05-14 IST).
 * @returns the UTC instant of sunrise on that IST civil day.
 */
export function sunriseOn(istCivilDate: Date): Date {
  return findRiseSet(istCivilDate, +1);
}

/** Sunset on the given civil IST date — returns UTC instant. */
export function sunsetOn(istCivilDate: Date): Date {
  return findRiseSet(istCivilDate, -1);
}

/** direction: +1 = rise, −1 = set. */
function findRiseSet(istCivilDate: Date, direction: 1 | -1): Date {
  // Search-window start: the IST civil date at 00:00 local, i.e. the prior
  // UTC day at 18:30. We give astronomy-engine a 2-day window to be safe.
  const istMidnight = new Date(Date.UTC(
    istCivilDate.getUTCFullYear(),
    istCivilDate.getUTCMonth(),
    istCivilDate.getUTCDate(),
    0, 0, 0, 0,
  ));
  // Shift back from IST wall-clock to real UTC: subtract IST offset.
  const utcStart = new Date(istMidnight.getTime() - 5.5 * 60 * 60 * 1000);
  const astroStart = new Astronomy.AstroTime(utcStart);
  const result = Astronomy.SearchRiseSet(
    Astronomy.Body.Sun,
    OBSERVER,
    direction,
    astroStart,
    2,
  );
  if (!result) {
    throw new Error(
      `No ${direction > 0 ? 'sunrise' : 'sunset'} found within window starting ${utcStart.toISOString()}`,
    );
  }
  return result.date;
}

/**
 * Geocentric ecliptic-of-date longitude of the Sun at the given UTC
 * instant, in degrees [0, 360).
 *
 * Implementation note: astronomy-engine's `EclipticLongitude(body, time)`
 * computes a HELIOCENTRIC longitude and is therefore valid only for
 * planets — it throws for the Sun ("Cannot calculate heliocentric
 * longitude of the Sun") since the Sun is the origin of that frame.
 * For the apparent geocentric Sun we want `SunPosition(time)` which
 * returns an `EclipticCoordinates` with `elon` already in degrees.
 *
 * Returns a TROPICAL longitude — call `tropicalToSidereal()` from
 * `ayanamsha.ts` to get the sidereal value used by Drik Panchang.
 */
export function sunLongitudeTropical(utc: Date): number {
  const lon = Astronomy.SunPosition(utc).elon;
  return lon < 0 ? lon + 360 : lon;
}

/**
 * Geocentric ecliptic-of-date longitude of the Moon (tropical, degrees
 * [0, 360)).
 *
 * Uses `EclipticGeoMoon(time)` which returns a `Spherical` ({ lat, lon,
 * dist }) in ecliptic-of-date — exactly the convention Drik Panchang
 * publishes against (after the Lahiri shift applied one layer up).
 */
export function moonLongitudeTropical(utc: Date): number {
  const lon = Astronomy.EclipticGeoMoon(utc).lon;
  return lon < 0 ? lon + 360 : lon;
}

/** Convenience: returns the IST civil date (Y/M/D as UTC) of a UTC instant. */
export function istCivilDateOf(utc: Date): Date {
  const ist = toIst(utc);
  return new Date(Date.UTC(
    ist.getUTCFullYear(),
    ist.getUTCMonth(),
    ist.getUTCDate(),
    0, 0, 0, 0,
  ));
}
