/**
 * Lahiri ayanamsha invariants.
 *
 * Verifies the analytic J2000-anchored model returns Drik-Panchang-
 * compatible values across the kiosk's active date range (~2020-2035).
 */

import { lahiriAyanamsha, normaliseDeg, tropicalToSidereal } from '../src/core/ayanamsha';

describe('lahiriAyanamsha', () => {
  it('returns ~23.85° at J2000.0 epoch (2000-01-01 12:00 TT ≈ 12:00 UTC)', () => {
    const j2000 = new Date(Date.UTC(2000, 0, 1, 11, 58, 56));
    expect(lahiriAyanamsha(j2000)).toBeCloseTo(23.85, 1);
  });

  it('advances by ~50.3 arcsec per year (linear precession)', () => {
    const t0 = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
    const t1 = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    const delta = lahiriAyanamsha(t1) - lahiriAyanamsha(t0);
    // 50.290966 arcsec / 3600 = 0.013969° per Julian year
    expect(delta).toBeCloseTo(0.01397, 4);
  });

  it('lands ~24.21° for 2026 (Drik-published value within 1 arcmin)', () => {
    const mid2026 = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));
    expect(lahiriAyanamsha(mid2026)).toBeCloseTo(24.21, 1);
  });

  it('grows monotonically with time across the kiosk active range', () => {
    const samples = [2020, 2025, 2030, 2035].map(
      (y) => lahiriAyanamsha(new Date(Date.UTC(y, 0, 1))),
    );
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]);
    }
  });

  it('never returns negative or near-zero values in active range', () => {
    for (let y = 2020; y <= 2035; y++) {
      const v = lahiriAyanamsha(new Date(Date.UTC(y, 0, 1)));
      expect(v).toBeGreaterThan(23);
      expect(v).toBeLessThan(25);
    }
  });
});

describe('normaliseDeg', () => {
  it('returns the same value for inputs already in [0, 360)', () => {
    expect(normaliseDeg(0)).toBe(0);
    expect(normaliseDeg(180)).toBe(180);
    expect(normaliseDeg(359.999)).toBeCloseTo(359.999, 3);
  });

  it('wraps negative inputs into [0, 360)', () => {
    expect(normaliseDeg(-1)).toBeCloseTo(359, 3);
    expect(normaliseDeg(-359)).toBeCloseTo(1, 3);
  });

  it('reduces inputs ≥ 360 by repeated subtraction', () => {
    expect(normaliseDeg(360)).toBeCloseTo(0, 3);
    expect(normaliseDeg(720)).toBeCloseTo(0, 3);
    expect(normaliseDeg(450)).toBeCloseTo(90, 3);
  });
});

describe('tropicalToSidereal', () => {
  it('subtracts the ayanamsha and normalises', () => {
    const t = new Date(Date.UTC(2026, 0, 1));
    const ay = lahiriAyanamsha(t);
    expect(tropicalToSidereal(100, t)).toBeCloseTo(100 - ay, 4);
  });

  it('wraps below 0 into [0, 360)', () => {
    const t = new Date(Date.UTC(2026, 0, 1));
    const ay = lahiriAyanamsha(t);
    // Tropical < ayanamsha → sidereal would be negative; should wrap.
    expect(tropicalToSidereal(10, t)).toBeCloseTo(360 + 10 - ay, 4);
  });
});
