import { Muhurta } from '../models';

/**
 * The 30 Muhurtas of the Vedic day, in order from sunrise.
 *
 * Faithful port of the Flutter codebase's `assets/data/muhurta_names.json`
 * — same indices, same Sanskrit names, same nature classification.
 * 24 shubha (auspicious) and 6 ashubha (inauspicious). The dial painter
 * colours each wedge by `nature`.
 */
export const MUHURTAS: readonly Muhurta[] = [
  { index: 0,  name: 'Rudra',         devanagari: 'रुद्र',         deity: 'Rudra',       nature: 'ashubha', suitableFor: 'Avoid — destruction energy, inauspicious for all new starts' },
  { index: 1,  name: 'Ahi',           devanagari: 'आही',           deity: 'Sarpa',       nature: 'ashubha', suitableFor: 'Avoid — serpent energy, inauspicious' },
  { index: 2,  name: 'Mitra',         devanagari: 'मित्र',         deity: 'Mitra',       nature: 'shubha',  suitableFor: 'Friendships, alliances, business partnerships' },
  { index: 3,  name: 'Pitru',         devanagari: 'पितृ',          deity: 'Pitrs',       nature: 'ashubha', suitableFor: 'Ancestral rites, Shraddha ceremonies only' },
  { index: 4,  name: 'Vasu',          devanagari: 'वसु',           deity: 'Ashtavasus',  nature: 'shubha',  suitableFor: 'Wealth-related activities, business, purchasing' },
  { index: 5,  name: 'Vara',          devanagari: 'वाराह',         deity: 'Varaha',      nature: 'shubha',  suitableFor: 'Agriculture, construction, auspicious works' },
  { index: 6,  name: 'Vishvadeva',    devanagari: 'विश्वे',        deity: 'Vishvedevas', nature: 'shubha',  suitableFor: 'All good deeds, worship, charitable acts' },
  { index: 7,  name: 'Vidhi',         devanagari: 'विधि',          deity: 'Brahma',      nature: 'shubha',  suitableFor: 'Learning, studies, writing, creative works' },
  { index: 8,  name: 'Satamukha',     devanagari: 'सतमुख',         deity: 'Indra',       nature: 'shubha',  suitableFor: 'Leadership, governance, important decisions' },
  { index: 9,  name: 'Puruhuta',      devanagari: 'पुरुहूत',       deity: 'Indra',       nature: 'shubha',  suitableFor: 'War, competitions, debates, legal matters' },
  { index: 10, name: 'Vahini',        devanagari: 'वाहिनी',        deity: 'Agni',        nature: 'shubha',  suitableFor: 'Fire ceremonies, Havana, Yajna, cooking' },
  { index: 11, name: 'Naktanchara',   devanagari: 'नक्तंचर',       deity: 'Nishachara',  nature: 'ashubha', suitableFor: 'Avoid — night-walker energy, inauspicious' },
  { index: 12, name: 'Varuna',        devanagari: 'वरुण',          deity: 'Varuna',      nature: 'shubha',  suitableFor: 'Water travel, trade, contracts, oath-taking' },
  { index: 13, name: 'Aryama',        devanagari: 'अर्यमा',        deity: 'Aryaman',     nature: 'shubha',  suitableFor: 'Marriage, social ceremonies, guest reception' },
  { index: 14, name: 'Bhaga',         devanagari: 'भग',            deity: 'Bhaga',       nature: 'shubha',  suitableFor: 'Prosperity rituals, Lakshmi puja, wealth blessings' },
  { index: 15, name: 'Girisha',       devanagari: 'गिरिश',         deity: 'Shiva',       nature: 'ashubha', suitableFor: 'Shiva worship only; otherwise avoid' },
  { index: 16, name: 'Ajapada',       devanagari: 'अजपाद',         deity: 'Aja Ekapada', nature: 'ashubha', suitableFor: 'Avoid — associated with obstacles' },
  { index: 17, name: 'Ahirbudhnya',   devanagari: 'अहिर्बुध्न्य',  deity: 'Ahirbudhnya', nature: 'ashubha', suitableFor: 'Tantric practices only; generally inauspicious' },
  { index: 18, name: 'Pushya',        devanagari: 'पुष्य',         deity: 'Pushan',      nature: 'shubha',  suitableFor: 'Highly auspicious — travel, new ventures, buying gold' },
  { index: 19, name: 'Ashvini',       devanagari: 'अश्विनी',       deity: 'Ashvins',     nature: 'shubha',  suitableFor: 'Medicine, healing, swift actions, horse riding' },
  { index: 20, name: 'Yama',          devanagari: 'यम',            deity: 'Yama',        nature: 'ashubha', suitableFor: 'Avoid — lord of death, inauspicious for all' },
  { index: 21, name: 'Agni',          devanagari: 'अग्नि',         deity: 'Agni',        nature: 'shubha',  suitableFor: 'Fire rituals, purification, cooking, smithcraft' },
  { index: 22, name: 'Vidhatr',       devanagari: 'विधात्र',       deity: 'Brahma',      nature: 'shubha',  suitableFor: 'Creative arts, writing, designing, planning' },
  { index: 23, name: 'Chanda',        devanagari: 'चन्द',          deity: 'Chandra',     nature: 'shubha',  suitableFor: 'Emotional healing, poetry, music, meditation' },
  { index: 24, name: 'Aditi',         devanagari: 'अदिति',         deity: 'Aditi',       nature: 'shubha',  suitableFor: 'Liberation, freedom, travel abroad, releasing burdens' },
  { index: 25, name: 'Jiiva',         devanagari: 'जीव',           deity: 'Brihaspati',  nature: 'shubha',  suitableFor: 'Education, teaching, spiritual study, Guru worship' },
  { index: 26, name: 'Vishnu',        devanagari: 'विष्णु',        deity: 'Vishnu',      nature: 'shubha',  suitableFor: 'All Vaishnava rites, preservation, sustenance work' },
  { index: 27, name: 'Dyumadgadyuti', devanagari: 'द्युमद्गद्युति', deity: 'Surya',       nature: 'shubha',  suitableFor: 'Solar worship, authority matters, government work' },
  { index: 28, name: 'Brahma',        devanagari: 'ब्रह्म',        deity: 'Brahma',      nature: 'shubha',  suitableFor: 'Most auspicious — excellent for all sacred beginnings' },
  { index: 29, name: 'Samudrama',     devanagari: 'समुद्रम',       deity: 'Varuna',      nature: 'shubha',  suitableFor: 'Sea travel, deep study, hidden knowledge, Yoga' },
];

/** Lookup by index with clamping. */
export function muhurtaByIndex(idx: number): Muhurta {
  const clamped = Math.max(0, Math.min(29, Math.floor(idx)));
  return MUHURTAS[clamped];
}
