import { lahiriAyanamsha, tropicalToSidereal, normaliseDeg } from '../core/ayanamsha';

describe('Ayanamsha Calculations', () => {
  it('computes exact J2000.0 baseline ayanamsha', () => {
    // J2000.0 is Jan 1, 2000, 12:00 TT (approx 11:58:55 UTC, but 12:00 UTC is close enough for ~0.000001 deg)
    const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const ayanamsha = lahiriAyanamsha(j2000);
    expect(ayanamsha).toBeCloseTo(23.85294, 5);
  });

  it('computes correct drift for 2025', () => {
    // Roughly 25 years after J2000
    // Drift = 25 * 50.290966 arcsec = 1257.27415 arcsec = 0.34924 deg
    // Total = 23.85294 + 0.34924 = 24.20218 deg
    const mid2025 = new Date(Date.UTC(2025, 6, 1, 12, 0, 0));
    const ayanamsha = lahiriAyanamsha(mid2025);
    expect(ayanamsha).toBeCloseTo(24.20, 1); // Using 1 decimal place
  });

  it('computes correct drift for 1950', () => {
    // 50 years before J2000
    const mid1950 = new Date(Date.UTC(1950, 6, 1, 12, 0, 0));
    const ayanamsha = lahiriAyanamsha(mid1950);
    // Should be smaller than 23.85
    expect(ayanamsha).toBeLessThan(23.85);
    expect(ayanamsha).toBeGreaterThan(23.00); // Sanity check
  });

  describe('tropicalToSidereal', () => {
    it('subtracts ayanamsha correctly', () => {
      const date = new Date(Date.UTC(2025, 0, 1));
      const ayanamsha = lahiriAyanamsha(date); // approx 24.2 deg
      
      const tropical = 100.0;
      const sidereal = tropicalToSidereal(tropical, date);
      
      expect(sidereal).toBeCloseTo(100.0 - ayanamsha, 5);
    });

    it('handles underflow below 0 degrees', () => {
      const date = new Date(Date.UTC(2025, 0, 1));
      const ayanamsha = lahiriAyanamsha(date); // approx 24.2 deg
      
      const tropical = 10.0;
      const sidereal = tropicalToSidereal(tropical, date);
      
      // 10 - 24.2 = -14.2 => 345.8
      expect(sidereal).toBeCloseTo(360 + (10.0 - ayanamsha), 5);
    });
  });

  describe('normaliseDeg', () => {
    it('normalises positive angles', () => {
      expect(normaliseDeg(365)).toBe(5);
      expect(normaliseDeg(720)).toBe(0);
      expect(normaliseDeg(180)).toBe(180);
    });

    it('normalises negative angles', () => {
      expect(normaliseDeg(-5)).toBe(355);
      expect(normaliseDeg(-365)).toBe(355);
    });
  });
});
