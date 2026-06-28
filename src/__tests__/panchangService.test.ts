import { computePanchang } from '../core/panchangService';
import {
  AMAVASYA_EN,
  CHARA_KARANA_NAMES_EN,
  NAKSHATRA_NAMES_EN,
  RASHI_NAMES_EN,
  STHIRA_KARANA_NAMES_EN,
  TITHI_NAMES_EN,
  VARA_NAMES_EN,
  YOGA_NAMES_EN,
} from '../data/panchangNames';

describe('Panchang Service Limb Calculations', () => {
  const dummySunrise = new Date(Date.UTC(2026, 4, 14, 0, 15, 0)); // A Thursday (day 4 in UTC)

  describe('Tithi Calculation', () => {
    it('calculates Amavasya correctly', () => {
      // Moon is almost caught up to Sun (Elongation between 348 and 360)
      const panchang = computePanchang({
        sunLongitudeDeg: 45.0,
        moonLongitudeDeg: 35.0, // Elongation = (35 - 45 + 360) % 360 = 350
        sunriseIst: dummySunrise,
      });

      expect(panchang.tithi.nameEn).toBe(AMAVASYA_EN);
      expect(panchang.tithi.paksha).toBe('krishna');
      expect(panchang.tithi.number).toBe(15);
      expect(panchang.tithi.progressFraction).toBe(0.0);
    });

    it('calculates Purnima correctly', () => {
      // Moon is almost 180 degrees ahead of Sun (Elongation between 168 and 180)
      const panchang = computePanchang({
        sunLongitudeDeg: 0.0,
        moonLongitudeDeg: 175.0, // Elongation = 175
        sunriseIst: dummySunrise,
      });

      expect(panchang.tithi.nameEn).toBe(TITHI_NAMES_EN[14]); // Purnima is index 14 of shukla paksha
      expect(panchang.tithi.paksha).toBe('shukla');
      expect(panchang.tithi.number).toBe(15);
    });

    it('handles exact boundary conditions', () => {
      // Elongation of 11.99 degrees (still Pratipada)
      const panchang1 = computePanchang({
        sunLongitudeDeg: 0.0,
        moonLongitudeDeg: 11.99,
        sunriseIst: dummySunrise,
      });
      expect(panchang1.tithi.number).toBe(1);

      // Elongation of 12.01 degrees (moved to Dvitiya)
      const panchang2 = computePanchang({
        sunLongitudeDeg: 0.0,
        moonLongitudeDeg: 12.01,
        sunriseIst: dummySunrise,
      });
      expect(panchang2.tithi.number).toBe(2);
    });
  });

  describe('Nakshatra Calculation', () => {
    it('calculates Nakshatra based on moon sidereal longitude', () => {
      // First Nakshatra (Ashwini) is 0 to 13°20'
      const p1 = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 10.0, sunriseIst: dummySunrise });
      expect(p1.nakshatra.nameEn).toBe(NAKSHATRA_NAMES_EN[0]); // Ashwini

      // Second Nakshatra (Bharani) starts at 13°20' (13.333...)
      const p2 = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 14.0, sunriseIst: dummySunrise });
      expect(p2.nakshatra.nameEn).toBe(NAKSHATRA_NAMES_EN[1]); // Bharani
    });

    it('calculates Nakshatra Pada correctly', () => {
      // 13.333 degrees total per nakshatra. Divided by 4 = 3.333 degrees per pada.
      // Moon at 2.0 deg -> Ashwini Pada 1
      const p1 = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 2.0, sunriseIst: dummySunrise });
      expect(p1.nakshatra.pada).toBe(1);

      // Moon at 12.0 deg -> Ashwini Pada 4 (3.333 * 3 = 10.0, so 12 is in 4th pada)
      const p4 = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 12.0, sunriseIst: dummySunrise });
      expect(p4.nakshatra.pada).toBe(4);
    });
  });

  describe('Yoga Calculation', () => {
    it('calculates Yoga based on sum of longitudes', () => {
      // Sun + Moon = 0 -> Vishkambha
      const p1 = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 0, sunriseIst: dummySunrise });
      expect(p1.yoga.nameEn).toBe(YOGA_NAMES_EN[0]);

      // Sun 10, Moon 10 -> Sum = 20. > 13°20', so Yoga 2 (Priti)
      const p2 = computePanchang({ sunLongitudeDeg: 10, moonLongitudeDeg: 10, sunriseIst: dummySunrise });
      expect(p2.yoga.nameEn).toBe(YOGA_NAMES_EN[1]);
    });
  });

  describe('Karana Calculation', () => {
    it('calculates fixed Karanas accurately', () => {
      // Slot 57 is Shakuni. Elongation = 57 * 6 = 342 deg
      const p57 = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 342.1, sunriseIst: dummySunrise });
      expect(p57.karana.isFixed).toBe(true);
      expect(p57.karana.nameEn).toBe(STHIRA_KARANA_NAMES_EN[57]);

      // Slot 0 is Kintughna. Elongation = 0 to 6 deg
      const p0 = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 2.0, sunriseIst: dummySunrise });
      expect(p0.karana.isFixed).toBe(true);
      expect(p0.karana.nameEn).toBe(STHIRA_KARANA_NAMES_EN[0]);
    });

    it('calculates chara (cycling) Karanas accurately', () => {
      // Slot 1 (6 to 12 deg) -> Bava
      const p1 = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 7.0, sunriseIst: dummySunrise });
      expect(p1.karana.isFixed).toBe(false);
      expect(p1.karana.nameEn).toBe(CHARA_KARANA_NAMES_EN[0]); // Bava

      // Slot 8 (48 to 54 deg) -> Cycles back to Bava (since 1-7 are 7 chara karanas)
      const p8 = computePanchang({ sunLongitudeDeg: 0, moonLongitudeDeg: 49.0, sunriseIst: dummySunrise });
      expect(p8.karana.nameEn).toBe(CHARA_KARANA_NAMES_EN[0]);
    });
  });

  describe('Vara Calculation', () => {
    it('calculates weekday anchored to IST sunrise', () => {
      // May 14, 2026 was a Thursday. JS getUTCDay() for May 14 UTC gives 4.
      // ISO mapping: 4 (Thursday) should be index 4 (1=Mon..7=Sun).
      const panchang = computePanchang({
        sunLongitudeDeg: 0,
        moonLongitudeDeg: 0,
        sunriseIst: dummySunrise,
      });

      // 4 = Thursday = Guruvara
      expect(panchang.vara.weekday).toBe(4);
      expect(panchang.vara.nameEn).toBe(VARA_NAMES_EN[4]);
    });
  });

  describe('Rashi Calculation', () => {
    it('calculates Sun and Moon rashis', () => {
      const panchang = computePanchang({
        sunLongitudeDeg: 15.0, // Mesha (Aries)
        moonLongitudeDeg: 45.0, // Vrishabha (Taurus)
        sunriseIst: dummySunrise,
      });

      expect(panchang.sunRashi.nameEn).toBe(RASHI_NAMES_EN[0]);
      expect(panchang.moonRashi.nameEn).toBe(RASHI_NAMES_EN[1]);
    });
  });
});
