/**
 * Shared palette + typography tokens — direct port of `lib/theme.dart` from
 * the Flutter codebase. Every colour is tuned for 10-foot-viewing contrast
 * on a bright Android-TV / tablet panel.
 *
 * Two gilt tones (`giltLight`, `giltDeep`) sit between the UI gold
 * (`highlight`) and the warm-highlight peak — they give the ornament
 * frame a quieter second metallic voice that doesn't fight the hero
 * digits.
 */

export const colors = {
  // ── Core palette ─────────────────────────────────────────────────────
  /** Midnight blue — base canvas the radial backdrop fades from. */
  bgDeep: '#0D1B2A',
  /** Outer edge of the radial backdrop — near-black so corners recede. */
  bgDeeper: '#060D18',
  /** Lifted surface — top-bar/bottom-strip side panels, card fills. */
  bgLift: '#16283C',
  /** Brighter centre of the chrome-bar gradient. */
  bgLiftHi: '#1E324A',
  /** Ivory body text. */
  ink: '#E6E4D8',
  /** Muted secondary text (gloss lines, dividers). */
  inkMuted: '#8A9BA8',
  /** Saffron — Devanagari labels, Surya-side glow. */
  accent: '#D4691E',
  /** Primary gold — hero digits, active values, rashi readouts. */
  highlight: '#E8B94B',
  /** Warm highlight — brightest point in gradients & glows. */
  highlightSoft: '#FFE3A8',
  /** Auspicious (Shubha) green — Muhurta nature, progress fills. */
  shubha: '#4A9D6F',
  /** Inauspicious (Ashubha) red. */
  ashubha: '#C04848',
  /** Gold pinstripe — 40 %-alpha gold for horizontal rules. */
  pinstripe: 'rgba(232, 185, 75, 0.4)',

  // ── Glassmorphism tokens (Minimalist Professional) ──────────────────
  /** Semi-transparent glass fill for floating panels (slimmer). */
  glassSurface: 'rgba(22, 40, 60, 0.4)',
  /** Brighter glass highlight for active cards. */
  glassSurfaceHi: 'rgba(30, 50, 74, 0.6)',
  /** Subtle border for glass elements (surgical 0.5pt feel). */
  glassBorder: 'rgba(232, 185, 75, 0.15)',
  /** Stronger border for focused elements. */
  glassBorderHi: 'rgba(232, 185, 75, 0.3)',

  // ── Ornament-frame additions ─────────────────────────────────────────
  /** Lighter gilt tone for yantra rosette petals, arch motif strokes. */
  giltLight: '#D9B065',
  /** Deeper gilt tone for yantra rosette outer rings + arch baselines. */
  giltDeep: '#8A6A2E',
  /** Bindu-core of yantra rosettes — same warm core as brightest stars. */
  bindu: '#FFE3A8',
} as const;

/** Gregorian month names in Devanagari — top-bar date label. */
export const hindiMonths = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर',
];

/** Format a JS Date as `D माह YYYY` — e.g. `24 मार्च 2026`. */
export function gregorianHi(d: Date): string {
  return `${d.getDate()} ${hindiMonths[d.getMonth()]} ${d.getFullYear()}`;
}

/** Glassmorphism style utility — Slimmed for professional look. */
export const glass = {
  panel: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 0,
    borderColor: 'transparent',
    padding: 8,
  },
} as const;
