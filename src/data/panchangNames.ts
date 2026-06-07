/**
 * Indexed lookup tables for the 5-limb Panchang.
 *
 * Direct port of `lib/data/panchang_names.dart`. The arrays are 0-indexed
 * and align with the canonical Drik Panchang ordering used throughout
 * the kiosk's spec sheet.
 */

// ── Tithi ────────────────────────────────────────────────────────────────
// Tithi names 1..14 are shared between Shukla and Krishna pakshas. The
// 15th tithi is special-cased: Purnima (Shukla) vs Amavasya (Krishna).

export const TITHI_NAMES_EN = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
];
export const TITHI_NAMES_HI = [
  'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी',
  'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
  'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा',
];
export const AMAVASYA_EN = 'Amavasya';
export const AMAVASYA_HI = 'अमावस्या';

// ── Nakshatra (27, from Ashwini at 0° sidereal) ──────────────────────────

export const NAKSHATRA_NAMES_EN = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
  'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
  'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
  'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];
export const NAKSHATRA_NAMES_HI = [
  'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा',
  'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा',
  'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाती',
  'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढा',
  'उत्तराषाढा', 'श्रवण', 'धनिष्ठा', 'शतभिषा',
  'पूर्वा भाद्रपदा', 'उत्तरा भाद्रपदा', 'रेवती',
];

/** Vimshottari dasha lord — Ketu→Venus→Sun→Moon→Mars→Rahu→Jupiter→Saturn→Mercury, 3 cycles. */
export const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

// ── Yoga (27) ────────────────────────────────────────────────────────────

export const YOGA_NAMES_EN = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Indra', 'Vaidhriti',
];
export const YOGA_NAMES_HI = [
  'विष्कम्भ', 'प्रीति', 'आयुष्मान्', 'सौभाग्य', 'शोभन',
  'अतिगण्ड', 'सुकर्म', 'धृति', 'शूल', 'गण्ड',
  'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र',
  'सिद्धि', 'व्यतीपात', 'वरीयान्', 'परिघ', 'शिव',
  'सिद्ध', 'साध्य', 'शुभ', 'शुक्ल', 'ब्रह्म',
  'इन्द्र', 'वैधृति',
];

// ── Karana (7 chara + 4 sthira) ──────────────────────────────────────────

/** Seven movable (chara) karanas — fill slots 1..56 in cycles of 7. */
export const CHARA_KARANA_NAMES_EN = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti',
];
export const CHARA_KARANA_NAMES_HI = [
  'बव', 'बालव', 'कौलव', 'तैतिल', 'गर', 'वणिज', 'विष्टि',
];

/** Fixed (sthira) karanas — appear once per synodic month. */
export const STHIRA_KARANA_NAMES_EN: Record<number, string> = {
  0: 'Kimstughna',
  57: 'Shakuni',
  58: 'Chatushpada',
  59: 'Naga',
};
export const STHIRA_KARANA_NAMES_HI: Record<number, string> = {
  0: 'किंस्तुघ्न',
  57: 'शकुनि',
  58: 'चतुष्पाद',
  59: 'नाग',
};

// ── Vara (weekday) ───────────────────────────────────────────────────────
// Keys follow ISO weekday: Mon=1 … Sun=7. JS `Date.getDay()` returns Sun=0…
// Sat=6, so callers must convert. PanchangService does that conversion.

export const VARA_NAMES_EN: Record<number, string> = {
  1: 'Somavara',
  2: 'Mangalavara',
  3: 'Budhavara',
  4: 'Guruvara',
  5: 'Shukravara',
  6: 'Shanivara',
  7: 'Ravivara',
};
export const VARA_NAMES_HI: Record<number, string> = {
  1: 'सोमवार',
  2: 'मङ्गलवार',
  3: 'बुधवार',
  4: 'गुरुवार',
  5: 'शुक्रवार',
  6: 'शनिवार',
  7: 'रविवार',
};
export const VARA_LORDS: Record<number, string> = {
  1: 'Chandra (Moon)',
  2: 'Mangala (Mars)',
  3: 'Budha (Mercury)',
  4: 'Guru (Jupiter)',
  5: 'Shukra (Venus)',
  6: 'Shani (Saturn)',
  7: 'Surya (Sun)',
};

// ── Rashi (12 sidereal zodiac signs) ─────────────────────────────────────

export const RASHI_NAMES_EN = [
  'Mesha',      // Aries
  'Vrishabha',  // Taurus
  'Mithuna',    // Gemini
  'Karka',      // Cancer
  'Simha',      // Leo
  'Kanya',      // Virgo
  'Tula',       // Libra
  'Vrischika',  // Scorpio
  'Dhanu',      // Sagittarius
  'Makara',     // Capricorn
  'Kumbha',     // Aquarius
  'Meena',      // Pisces
];
export const RASHI_NAMES_HI = [
  'मेष', 'वृषभ', 'मिथुन', 'कर्क',
  'सिंह', 'कन्या', 'तुला', 'वृश्चिक',
  'धनु', 'मकर', 'कुम्भ', 'मीन',
];
export const RASHI_LORDS = [
  'Mars',      // Mesha
  'Venus',     // Vrishabha
  'Mercury',   // Mithuna
  'Moon',      // Karka
  'Sun',       // Simha
  'Mercury',   // Kanya
  'Venus',     // Tula
  'Mars',      // Vrischika
  'Jupiter',   // Dhanu
  'Saturn',    // Makara
  'Saturn',    // Kumbha
  'Jupiter',   // Meena
];
