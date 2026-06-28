import {
  setLocation,
  sunriseOn,
  sunsetOn,
  sunLongitudeTropical,
  moonLongitudeTropical,
} from '../core/solar';
import { TEST_LOCATIONS } from './fixtures/panchangTestData';

describe('Solar and Ephemeris Calculations', () => {
  beforeAll(() => {
    // Set default test location to Ujjain as it's the reference city for Vikramaditya Vedic Clock
    setLocation(TEST_LOCATIONS.UJJAIN);
  });

  describe('Sunrise and Sunset', () => {
    it('calculates correct sunrise for a known date in Ujjain', () => {
      // Date: May 14, 2026 IST
      const istCivilDate = new Date(Date.UTC(2026, 4, 14));
      const sunriseUtc = sunriseOn(istCivilDate);

      // Verify the sunrise time
      // For Ujjain on May 14, sunrise is typically around 05:45 IST
      // 05:45 IST is 00:15 UTC
      const expectedUtc = new Date(Date.UTC(2026, 4, 14, 0, 16, 0)); // Approx 05:46 IST

      // Tolerance of 2 minutes (120000 ms) is acceptable for generic astronomy algorithms vs rigorous topocentric refractions
      const diffMs = Math.abs(sunriseUtc.getTime() - expectedUtc.getTime());
      expect(diffMs).toBeLessThanOrEqual(2 * 60 * 1000); 
    });

    it('calculates correct sunset for a known date in Ujjain', () => {
      // Date: May 14, 2026 IST
      const istCivilDate = new Date(Date.UTC(2026, 4, 14));
      const sunsetUtc = sunsetOn(istCivilDate);

      // For Ujjain on May 14, sunset is typically around 19:01 IST
      // 19:01 IST is 13:31 UTC
      const expectedUtc = new Date(Date.UTC(2026, 4, 14, 13, 31, 0));

      const diffMs = Math.abs(sunsetUtc.getTime() - expectedUtc.getTime());
      expect(diffMs).toBeLessThanOrEqual(2 * 60 * 1000);
    });

    it('handles different locations', () => {
      // Set to somewhere far away (e.g., London, roughly 51.5N, 0.1W)
      setLocation({
        city: 'London',
        cityHi: 'लंदन',
        latitude: 51.5074,
        longitude: -0.1278,
        heightMeters: 0,
      });

      const istCivilDate = new Date(Date.UTC(2026, 4, 14));
      const sunriseUtcLondon = sunriseOn(istCivilDate);
      
      // Go back to Ujjain
      setLocation(TEST_LOCATIONS.UJJAIN);
      const sunriseUtcUjjain = sunriseOn(istCivilDate);

      // Sunrise in London should be significantly different in UTC time than Ujjain
      expect(sunriseUtcLondon.getTime()).not.toEqual(sunriseUtcUjjain.getTime());
    });
  });

  describe('Tropical Longitudes', () => {
    it('computes sun longitude within expected bounds', () => {
      // Vernal Equinox (around March 20-21) tropical longitude should be ~0 (or 360)
      const equinox2024 = new Date(Date.UTC(2024, 2, 20, 3, 6, 0)); // March 20, 2024, ~03:06 UTC
      const sunLon = sunLongitudeTropical(equinox2024);
      
      // Should be very close to 0 degrees
      expect(sunLon < 1 || sunLon > 359).toBe(true);
    });

    it('computes moon longitude correctly', () => {
      const someDate = new Date(Date.UTC(2026, 4, 14, 12, 0, 0));
      const moonLon = moonLongitudeTropical(someDate);
      
      expect(moonLon).toBeGreaterThanOrEqual(0);
      expect(moonLon).toBeLessThan(360);
    });
  });
});
