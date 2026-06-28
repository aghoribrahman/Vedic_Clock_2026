import { computeLivePanchang } from '../core/livePanchang';
import { TITHI_NAMES_EN, VARA_NAMES_EN } from '../data/panchangNames';

describe('Live Panchang Mid-Day Transitions', () => {
  // A mock sunrise time
  const sunriseIst = new Date(Date.UTC(2026, 4, 14, 0, 15, 0)); // Thursday

  it('updates Tithi accurately across an intraday boundary while preserving Vara', () => {
    // We mock sun and moon longitudes directly to simulate a transition
    // Elongation of 12 degrees is the exact boundary between Pratipada (1) and Dvitiya (2)

    // Scenario A: 09:59 AM UTC - Moon is at 11.9 deg (Pratipada)
    const timeBefore = new Date(Date.UTC(2026, 4, 14, 9, 59, 0));
    
    // We must return TROPICAL longitudes since computeLivePanchang will apply ayanamsha
    // To make this simple, we'll pretend Ayanamsha is 0 for this test or just hardcode tropical 
    // such that sidereal = 11.9. 
    // But computeLivePanchang uses ayanamsha(nowUtc). Let's just mock the sidereal directly 
    // by mocking `tropicalToSidereal`? No, computeLivePanchang accepts longitude functions.
    
    // Instead of fighting ayanamsha in tests, we can provide tropical longitudes
    // that result in the desired sidereal. Or simpler: just provide very different values.
    
    // Elongation = Moon - Sun
    const sunTropical = 0; 
    const moonTropicalBefore = 11.9; // Elongation 11.9 -> Tithi 1
    const moonTropicalAfter = 12.1; // Elongation 12.1 -> Tithi 2
    
    const panchangBefore = computeLivePanchang({
      nowUtc: timeBefore,
      sunriseIst,
      sunLongitudeFn: () => sunTropical,
      moonLongitudeFn: () => moonTropicalBefore,
    });

    const timeAfter = new Date(Date.UTC(2026, 4, 14, 10, 1, 0));
    const panchangAfter = computeLivePanchang({
      nowUtc: timeAfter,
      sunriseIst,
      sunLongitudeFn: () => sunTropical,
      moonLongitudeFn: () => moonTropicalAfter,
    });

    // We can't guarantee exact Tithi number due to ayanamsha subtracting ~24 degrees
    // Elongation = (Moon - A) - (Sun - A) = Moon - Sun.
    // Wait! Ayanamsha cancels out when calculating elongation!
    // Sidereal Elongation = (MoonTropical - A) - (SunTropical - A) = MoonTropical - SunTropical.
    // So the elongation IS exactly 11.9 and 12.1 respectively.

    expect(panchangBefore.tithi.number).toBe(1);
    expect(panchangBefore.tithi.nameEn).toBe(TITHI_NAMES_EN[0]);

    expect(panchangAfter.tithi.number).toBe(2);
    expect(panchangAfter.tithi.nameEn).toBe(TITHI_NAMES_EN[1]);

    // Vara must be anchored to sunrise, so it should be Thursday (4) in both
    expect(panchangBefore.vara.weekday).toBe(4);
    expect(panchangBefore.vara.nameEn).toBe(VARA_NAMES_EN[4]);

    expect(panchangAfter.vara.weekday).toBe(4);
    expect(panchangAfter.vara.nameEn).toBe(VARA_NAMES_EN[4]);
  });
});
