/**
 * Solar-phase + sky-gradient math — pulled out of the
 * `LivingSkyBackdrop` widget so it can be unit-tested without the RN
 * runtime. Direct port of the Flutter codebase's `lib/widgets/
 * living_sky.dart` math half.
 *
 * The 0..1 "phase fraction" within the current day or night bucket
 * gives us a smooth sin(π·phase) curve for sun altitude:
 *   • day bucket   → sin(π·dayPhase),    so 0 at sunrise/set, +1 at noon
 *   • night bucket → −sin(π·nightPhase), so 0 at set/rise,  −1 at midnight
 *
 * We then lerp between five canonical sky stops keyed off altitude:
 *   altitude → palette pick
 *      +1.0  → midday azure
 *       0.5  → mid-morning lift
 *       0.0  → sunrise / sunset peach
 *      −0.3  → dusk violet
 *      −1.0  → deep-night indigo
 */

import { VedicClockState } from '../models';

export interface SolarPhase {
  /** True while sun is above horizon (between sunrise and sunset). */
  isDay: boolean;
  /** 0..1 within the current day or night bucket. */
  phaseFraction: number;
  /** -1..+1 — peaks at +1 at solar noon, -1 at night midpoint. */
  normalisedAltitude: number;
}

/** Pure projection of clock state → solar phase. */
export function computeSolarPhase(state: VedicClockState): SolarPhase {
  const now = state.nowUtc.getTime();
  const sunrise = state.sunriseUtc.getTime();
  const sunset = state.sunsetUtc.getTime();
  const nextSunrise = state.nextSunriseUtc.getTime();

  if (now >= sunrise && now < sunset) {
    const dayLen = sunset - sunrise;
    const phase = dayLen > 0 ? (now - sunrise) / dayLen : 0;
    return {
      isDay: true,
      phaseFraction: phase,
      normalisedAltitude: Math.sin(Math.PI * phase),
    };
  }
  // Night bucket — from sunset to nextSunrise.
  const nightLen = nextSunrise - sunset;
  let phase: number;
  if (now >= sunset) {
    phase = nightLen > 0 ? (now - sunset) / nightLen : 0;
  } else {
    // Pre-dawn — we're before today's sunrise, so we're in the night
    // bucket that *started* with the previous day's sunset.
    // Approximate by assuming the prior night had the same length as
    // this one.
    const priorSunset = new Date(sunrise - nightLen);
    phase = nightLen > 0 ? (now - priorSunset.getTime()) / nightLen : 0;
  }
  const clamped = Math.max(0, Math.min(1, phase));
  return {
    isDay: false,
    phaseFraction: clamped,
    normalisedAltitude: -Math.sin(Math.PI * clamped),
  };
}

// ── Canonical sky stops ──────────────────────────────────────────────────

interface SkyStop {
  /** Altitude at which this gradient applies (sin-of-phase, [-1, +1]). */
  altitude: number;
  /** Top → middle → bottom colours of the sky strip. */
  colors: readonly [string, string, string];
}

export const SKY_STOPS: readonly SkyStop[] = [
  // Deep-night indigo — sun far below horizon.
  { altitude: -1.0, colors: ['#03050E', '#08102A', '#0D1B2A'] },
  // Twilight — sun just below horizon.
  { altitude: -0.3, colors: ['#1A1238', '#3A1F4D', '#5A2A3C'] },
  // Dawn / dusk — sun on horizon.
  { altitude: 0.0, colors: ['#5A3A1C', '#C4682A', '#E8B94B'] },
  // Mid-morning / mid-afternoon — sun well up.
  { altitude: 0.5, colors: ['#2A5E8C', '#7AB2DC', '#BCD9EB'] },
  // Noon — sun at peak.
  { altitude: 1.0, colors: ['#0E3A6E', '#3F88C5', '#9AC2DD'] },
];

/** Pick + interpolate the gradient for the current solar phase. */
export function gradientForPhase(phase: SolarPhase): [string, string, string] {
  const alt = phase.normalisedAltitude;
  if (alt <= SKY_STOPS[0].altitude) {
    return [...SKY_STOPS[0].colors] as [string, string, string];
  }
  if (alt >= SKY_STOPS[SKY_STOPS.length - 1].altitude) {
    return [...SKY_STOPS[SKY_STOPS.length - 1].colors] as [string, string, string];
  }
  // Find the two canonical stops we sit between.
  let lo = SKY_STOPS[0];
  let hi = SKY_STOPS[SKY_STOPS.length - 1];
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    if (alt >= SKY_STOPS[i].altitude && alt <= SKY_STOPS[i + 1].altitude) {
      lo = SKY_STOPS[i];
      hi = SKY_STOPS[i + 1];
      break;
    }
  }
  const span = hi.altitude - lo.altitude;
  const t = span === 0 ? 0 : (alt - lo.altitude) / span;
  return [
    lerpHex(lo.colors[0], hi.colors[0], t),
    lerpHex(lo.colors[1], hi.colors[1], t),
    lerpHex(lo.colors[2], hi.colors[2], t),
  ];
}

// ── helpers ──────────────────────────────────────────────────────────────

function lerpHex(a: string, b: string, t: number): string {
  const ai = hexToRgb(a);
  const bi = hexToRgb(b);
  const r = Math.round(ai.r + (bi.r - ai.r) * t);
  const g = Math.round(ai.g + (bi.g - ai.g) * t);
  const bl = Math.round(ai.b + (bi.b - ai.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/** Cheap perceived-luma helper, used by tests to compare day vs night gradients. */
export function luma(colorString: string): number {
  let r: number;
  let g: number;
  let b: number;
  const rgbMatch = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(colorString);
  if (rgbMatch) {
    r = Number(rgbMatch[1]);
    g = Number(rgbMatch[2]);
    b = Number(rgbMatch[3]);
  } else {
    // Fall back to hex parsing.
    const c = hexToRgb(colorString);
    r = c.r;
    g = c.g;
    b = c.b;
  }
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
