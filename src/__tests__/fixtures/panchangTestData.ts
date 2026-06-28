import { LocationConfig } from '../../config';
import { Nakshatra, Tithi, Yoga, Karana, Vara, Rashi } from '../../models';

/** Test locations */
export const TEST_LOCATIONS = {
  BHOPAL: {
    city: 'Bhopal',
    cityHi: 'भोपाल',
    latitude: 23.2599,
    longitude: 77.4126,
    heightMeters: 500,
  } as LocationConfig,
  UJJAIN: {
    city: 'Ujjain',
    cityHi: 'उज्जैन',
    latitude: 23.1793,
    longitude: 75.7849,
    heightMeters: 490,
  } as LocationConfig,
};

/**
 * Interface representing a "Ground Truth" row to verify the engine against.
 */
export interface PanchangTestVector {
  /** Description or Date for context */
  label: string;
  /** UTC instant to evaluate */
  utcTime: Date;
  
  // -- Expected Values (approximate for longitudes) --
  expectedLahiriAyanamsha?: number;
  expectedSunTropicalLon?: number;
  expectedMoonTropicalLon?: number;

  // -- Expected Panchang Limbs at this exact instant --
  expectedTithiNameEn?: string;
  expectedNakshatraNameEn?: string;
  expectedYogaNameEn?: string;
  expectedKaranaNameEn?: string;
}

/**
 * Hardcoded values for select dates (e.g., J2000 epoch and others).
 */
export const VECTORS: PanchangTestVector[] = [
  {
    label: 'J2000 Epoch (Jan 1, 2000, 12:00 UTC)',
    utcTime: new Date(Date.UTC(2000, 0, 1, 12, 0, 0)),
    expectedLahiriAyanamsha: 23.85294, // Standard J2000 definition
  },
  {
    label: 'Arbitrary Date 1: 2026-05-14T06:00:00Z',
    utcTime: new Date(Date.UTC(2026, 4, 14, 6, 0, 0)),
    // These tests will primarily lock down regressions and test boundaries
  }
];
