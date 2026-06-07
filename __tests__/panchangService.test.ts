/**
 * PanchangService invariants — mirrors the Flutter project's
 * `test/panchang_service_test.dart`. Verifies the longitude-to-limb
 * projections one limb at a time.
 */

import { computePanchang } from '../src/core/panchangService';

const SUNRISE_IST = new Date(Date.UTC(2026, 3, 25, 0, 30)); // a Saturday in IST

describe('computePanchang', () => {
  it('elongation 0° → Shukla Pratipada (tithi 1)', () => {
    const p = computePanchang({ sunLongitudeDeg: 100, moonLongitudeDeg: 100, sunriseIst: SUNRISE_IST });
    expect(p.tithi.index).toBe(0);
    expect(p.tithi.number).toBe(1);
    expect(p.tithi.paksha).toBe('shukla');
    expect(p.tithi.nameEn).toBe('Pratipada');
  });

  it('elongation 168° → Shukla Purnima (tithi 15)', () => {
    const p = computePanchang({ sunLongitudeDeg: 100, moonLongitudeDeg: 268, sunriseIst: SUNRISE_IST });
    expect(p.tithi.index).toBe(14);
    expect(p.tithi.number).toBe(15);
    expect(p.tithi.paksha).toBe('shukla');
    expect(p.tithi.nameEn).toBe('Purnima');
  });

  it('elongation 354° → Krishna Amavasya (tithi 30)', () => {
    const p = computePanchang({ sunLongitudeDeg: 100, moonLongitudeDeg: 454, sunriseIst: SUNRISE_IST });
    expect(p.tithi.index).toBe(29);
    expect(p.tithi.number).toBe(15);
    expect(p.tithi.paksha).toBe('krishna');
    expect(p.tithi.nameEn).toBe('Amavasya');
  });

  it('moon at 0° sidereal → nakshatra Ashwini', () => {
    const p = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 0, sunriseIst: SUNRISE_IST });
    expect(p.nakshatra.index).toBe(0);
    expect(p.nakshatra.nameEn).toBe('Ashwini');
    expect(p.nakshatra.lord).toBe('Ketu');
  });

  it('moon at 350° sidereal → nakshatra Revati', () => {
    const p = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 350, sunriseIst: SUNRISE_IST });
    expect(p.nakshatra.index).toBe(26);
    expect(p.nakshatra.nameEn).toBe('Revati');
  });

  it('Karana: slot 0 → Kimstughna (sthira)', () => {
    // elongation 3° → slot 0 → Kimstughna
    const p = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 3, sunriseIst: SUNRISE_IST });
    expect(p.karana.slot).toBe(0);
    expect(p.karana.nameEn).toBe('Kimstughna');
    expect(p.karana.isFixed).toBe(true);
  });

  it('Karana: slot 1 → Bava (first chara)', () => {
    // elongation 9° → slot 1
    const p = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 9, sunriseIst: SUNRISE_IST });
    expect(p.karana.slot).toBe(1);
    expect(p.karana.nameEn).toBe('Bava');
    expect(p.karana.isFixed).toBe(false);
  });

  it('Karana: slot 59 → Naga (sthira, end of cycle)', () => {
    // elongation 357° → slot 59
    const p = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 357, sunriseIst: SUNRISE_IST });
    expect(p.karana.slot).toBe(59);
    expect(p.karana.nameEn).toBe('Naga');
    expect(p.karana.isFixed).toBe(true);
  });

  it('Rashi: sidereal 0° → Mesha', () => {
    const p = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 0, sunriseIst: SUNRISE_IST });
    expect(p.sunRashi.index).toBe(0);
    expect(p.sunRashi.nameEn).toBe('Mesha');
    expect(p.sunRashi.lord).toBe('Mars');
  });

  it('Rashi: sidereal 330° → Meena', () => {
    const p = computePanchang({ sunLongitudeDeg: 330, moonLongitudeDeg: 0, sunriseIst: SUNRISE_IST });
    expect(p.sunRashi.index).toBe(11);
    expect(p.sunRashi.nameEn).toBe('Meena');
    expect(p.sunRashi.lord).toBe('Jupiter');
  });

  it('Vara: ISO weekday is 1..7 (Mon..Sun)', () => {
    // 2026-04-25 is a Saturday. JS getUTCDay → 6, ISO → 6 (Shanivara).
    const p = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 0, sunriseIst: SUNRISE_IST });
    expect(p.vara.weekday).toBe(6);
    expect(p.vara.nameEn).toBe('Shanivara');
    expect(p.vara.nameHi).toBe('शनिवार');
  });

  it('Vara: Sunday maps to ISO 7 (Ravivara)', () => {
    // 2026-04-26 IST sunrise as a Sunday wall-clock Date.
    const sunday = new Date(Date.UTC(2026, 3, 26, 0, 30));
    const p = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 0, sunriseIst: sunday });
    expect(p.vara.weekday).toBe(7);
    expect(p.vara.nameEn).toBe('Ravivara');
  });

  it('Yoga: at sun+moon=0° → Vishkambha', () => {
    const p = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 0, sunriseIst: SUNRISE_IST });
    expect(p.yoga.index).toBe(0);
    expect(p.yoga.nameEn).toBe('Vishkambha');
  });
});
