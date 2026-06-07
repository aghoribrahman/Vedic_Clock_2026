/**
 * Live-Panchang regression — the Gemini issue.
 *
 * On 2026-05-14, sunrise was 05:39:43 IST. AT THAT INSTANT, the
 * moon-sun elongation was ≈ 322° → tithi index 26 → Krishna Dwadashi.
 * By 11:20 IST elongation crossed 324° → tithi 27 → Krishna Trayodashi.
 * By 15:55 IST elongation was ≈ 326° → still tithi 27 → Trayodashi.
 *
 * If the kiosk displays "Dwadashi" at 15:55 IST it's showing the
 * sunrise-time freeze (the bug Gemini surfaced from the screenshot).
 * After the live-panchang refactor, computeLivePanchang at 15:55 IST
 * must return a *different* tithi from computeLivePanchang at sunrise.
 *
 * The integration test uses the real astronomy-engine longitudes (no
 * mocks) — it doubles as a sanity check that the analytic-Lahiri
 * pipeline agrees with the universe.
 *
 * The mocked tests below lock down the contract independent of any
 * particular date: given a moon that crosses a tithi boundary, the
 * live panchang must follow.
 */

import { computeLivePanchang } from '../src/core/livePanchang';

const SUNRISE_IST = new Date(Date.UTC(2026, 4, 14, 5, 39, 43));

describe('computeLivePanchang — Gemini regression', () => {
  it('Tithi at sunrise (2026-05-14 05:39 IST) is Krishna Dwadashi', () => {
    const p = computeLivePanchang({
      nowUtc: new Date(Date.UTC(2026, 4, 14, 0, 9, 43)),
      sunriseIst: SUNRISE_IST,
    });
    expect(p.tithi.paksha).toBe('krishna');
    expect(p.tithi.number).toBe(12);
    expect(p.tithi.nameEn).toBe('Dwadashi');
  });

  it('Tithi at 15:55 IST same day is Krishna Trayodashi (NOT Dwadashi)', () => {
    const p = computeLivePanchang({
      nowUtc: new Date(Date.UTC(2026, 4, 14, 10, 25)),
      sunriseIst: SUNRISE_IST,
    });
    expect(p.tithi.paksha).toBe('krishna');
    expect(p.tithi.number).toBe(13);
    expect(p.tithi.nameEn).toBe('Trayodashi');
  });

  it('Karana at sunrise is Taitila (slot 53 → chara[3])', () => {
    const p = computeLivePanchang({
      nowUtc: new Date(Date.UTC(2026, 4, 14, 0, 9, 43)),
      sunriseIst: SUNRISE_IST,
    });
    expect(p.karana.nameEn).toBe('Taitila');
    expect(p.karana.isFixed).toBe(false);
  });

  it('Karana at 15:55 IST same day is Garaja (slot 54 → chara[4]), NOT Taitila', () => {
    const p = computeLivePanchang({
      nowUtc: new Date(Date.UTC(2026, 4, 14, 10, 25)),
      sunriseIst: SUNRISE_IST,
    });
    expect(p.karana.nameEn).toBe('Gara');
    expect(p.karana.isFixed).toBe(false);
  });

  it('Tithi progress fraction advances forward between sunrise and 15:55 IST', () => {
    const pSunrise = computeLivePanchang({
      nowUtc: new Date(Date.UTC(2026, 4, 14, 0, 9, 43)),
      sunriseIst: SUNRISE_IST,
    });
    const pAfternoon = computeLivePanchang({
      nowUtc: new Date(Date.UTC(2026, 4, 14, 10, 25)),
      sunriseIst: SUNRISE_IST,
    });
    // Sunrise was Dwadashi (idx 26) at high progress; afternoon is
    // Trayodashi (idx 27) at low progress. The afternoon's tithi
    // index is greater.
    expect(pAfternoon.tithi.index).toBeGreaterThan(pSunrise.tithi.index);
  });
});

describe('computeLivePanchang — Vara stays anchored to sunriseIst', () => {
  it('regardless of nowUtc, Vara is derived from sunriseIst', () => {
    // sunriseIst = Thursday (2026-05-14)
    const thuSunriseIst = new Date(Date.UTC(2026, 4, 14, 5, 39, 43));
    // nowUtc = much later (would land on Friday IST), but Vara stays
    // Thursday because the Vedic day inherits its weekday from sunrise.
    const fridayInIst = new Date(Date.UTC(2026, 4, 14, 23, 0)); // 04:30 IST 15th
    const p = computeLivePanchang({ nowUtc: fridayInIst, sunriseIst: thuSunriseIst });
    expect(p.vara.weekday).toBe(4); // ISO 4 = Thursday
    expect(p.vara.nameEn).toBe('Guruvara');
  });

  it('vara is unchanged across sunrise → mid-day for the same Vedic day', () => {
    const thuSunriseIst = new Date(Date.UTC(2026, 4, 14, 5, 39, 43));
    const sunrise = computeLivePanchang({
      nowUtc: new Date(Date.UTC(2026, 4, 14, 0, 9, 43)),
      sunriseIst: thuSunriseIst,
    });
    const midday = computeLivePanchang({
      nowUtc: new Date(Date.UTC(2026, 4, 14, 6, 30)),
      sunriseIst: thuSunriseIst,
    });
    expect(sunrise.vara).toEqual(midday.vara);
  });
});

describe('computeLivePanchang — injected mocks (deterministic boundary tests)', () => {
  // Mock longitudes that advance linearly so we can pin the boundary.
  function mocks(initialSun: number, initialMoon: number, moonDegPerSec: number) {
    return {
      sunLongitudeFn: (utc: Date) =>
        (initialSun + (utc.getTime() / 1000) * 0.0000114) % 360, // ~0.985°/day
      moonLongitudeFn: (utc: Date) =>
        (initialMoon + (utc.getTime() / 1000) * moonDegPerSec) % 360,
    };
  }

  it('moon crossing a tithi boundary mid-day flips the tithi', () => {
    // Sun fixed at 0°; moon starts at 11° (just under tithi 1 → Dwitiya
    // begins at 12°) and moves +12°/h.
    const sunStart = 0;
    const moonStart = -0.0000114 * 1000 * 0; // sun term contribution at t=0
    // Compose mock that gives:
    //   t=0: moon-sun = 11.5  → tithi idx 0 (Pratipada)
    //   t=1h: moon-sun = 23.5 → tithi idx 1 (Dwitiya)
    const sunFn = () => 0; // ignore the date input for the test
    let moon = 11.5;
    const moonFn = (utc: Date) => {
      const h = utc.getTime() / 3600_000;
      return (moon + h * 12) % 360;
    };
    const t0 = new Date(0);
    const t1 = new Date(3600_000);

    const p0 = computeLivePanchang({
      nowUtc: t0,
      sunriseIst: t0,
      sunLongitudeFn: sunFn,
      moonLongitudeFn: moonFn,
    });
    const p1 = computeLivePanchang({
      nowUtc: t1,
      sunriseIst: t0,
      sunLongitudeFn: sunFn,
      moonLongitudeFn: moonFn,
    });

    expect(p0.tithi.index).toBe(0); // Pratipada at start
    expect(p1.tithi.index).toBe(1); // Dwitiya an hour later
  });

  it('uses the injected fns instead of the real ephemeris', () => {
    let sunCalls = 0;
    let moonCalls = 0;
    computeLivePanchang({
      nowUtc: new Date(),
      sunriseIst: new Date(),
      sunLongitudeFn: () => { sunCalls++; return 0; },
      moonLongitudeFn: () => { moonCalls++; return 0; },
    });
    expect(sunCalls).toBe(1);
    expect(moonCalls).toBe(1);
  });
});
