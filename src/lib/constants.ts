export const FORMATS = [
  { value: 'commander', label: 'Commander / EDH' },
  { value: 'standard', label: 'Standard' },
  { value: 'modern', label: 'Modern' },
  { value: 'pioneer', label: 'Pioneer' },
  { value: 'legacy', label: 'Legacy' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'pauper', label: 'Pauper' },
  { value: 'other', label: 'Other' },
] as const

export const ARCHETYPES = [
  '+1/+1 Counters',
  'Aggro',
  'Alternate Win Condition',
  'Aristocrats',
  'Artifacts Matter',
  'Big Mana',
  'Blink / Flicker',
  'Burn',
  'Chaos',
  'Clones / Copy',
  'Combo',
  'Commander Damage',
  'Control',
  'Discard',
  'Dredge',
  'Enchantress',
  'Equipment / Auras',
  'Food / Clue / Blood Tokens',
  'Goodstuff',
  'Graveyard Value',
  'Group Hug',
  'Group Slug',
  'Infect / Poison',
  'Land Destruction',
  'Landfall',
  'Lands Matter',
  'Lifedrain',
  'Lifegain',
  'Midrange',
  'Mill',
  'Pillow Fort',
  'Politics',
  'Prison',
  'Ramp',
  'Reanimator',
  'Recursion',
  'Self-Mill',
  'Spellslinger',
  'Stax',
  'Storm',
  'Superfriends',
  'Tax',
  'Tempo',
  'Theft',
  'Tokens',
  'Tribal',
  'Treasure',
  'Vehicles',
  'Voltron',
] as const

export const POWER_LEVELS = [
  { value: 'bracket1', label: 'Bracket 1 — Exhibition' },
  { value: 'bracket2', label: 'Bracket 2 — Core' },
  { value: 'bracket3', label: 'Bracket 3 — Upgraded' },
  { value: 'bracket4', label: 'Bracket 4 — Optimized' },
  { value: 'bracket5', label: 'Bracket 5 — cEDH' },
] as const

export function getPowerLevelLabel(value: string | null): string | null {
  if (!value) return null
  return POWER_LEVELS.find((pl) => pl.value === value)?.label ?? value
}

export const MTG_COLORS = [
  { value: 'W', label: 'White' },
  { value: 'U', label: 'Blue' },
  { value: 'B', label: 'Black' },
  { value: 'R', label: 'Red' },
  { value: 'G', label: 'Green' },
] as const

// All predefined MTG color identities, mono through five-color.
// value = WUBRG-ordered key used as Select value and for array reconstruction.
// colors = string[] stored in DB / URL.
export const COLOR_IDENTITY_OPTIONS = [
  // Mono
  { value: 'W', label: 'White', colors: ['W'] },
  { value: 'U', label: 'Blue (U)', colors: ['U'] },
  { value: 'B', label: 'Black (B)', colors: ['B'] },
  { value: 'R', label: 'Red', colors: ['R'] },
  { value: 'G', label: 'Green', colors: ['G'] },
  // Dual — Ravnica guilds
  { value: 'WU', label: 'Azorius (W, U)', colors: ['W', 'U'] },
  { value: 'WB', label: 'Orzhov (W, B)', colors: ['W', 'B'] },
  { value: 'WR', label: 'Boros (W, R)', colors: ['W', 'R'] },
  { value: 'WG', label: 'Selesnya (W, G)', colors: ['W', 'G'] },
  { value: 'UB', label: 'Dimir (U, B)', colors: ['U', 'B'] },
  { value: 'UR', label: 'Izzet (U, R)', colors: ['U', 'R'] },
  { value: 'UG', label: 'Simic (U, G)', colors: ['U', 'G'] },
  { value: 'BR', label: 'Rakdos (B, R)', colors: ['B', 'R'] },
  { value: 'BG', label: 'Golgari (B, G)', colors: ['B', 'G'] },
  { value: 'RG', label: 'Gruul (R, G)', colors: ['R', 'G'] },
  // Tri — Shards of Alara & Khans of Tarkir
  { value: 'WUB', label: 'Esper (W, U, B)', colors: ['W', 'U', 'B'] },
  { value: 'WUR', label: 'Jeskai (W, U, R)', colors: ['W', 'U', 'R'] },
  { value: 'WUG', label: 'Bant (W, U, G)', colors: ['W', 'U', 'G'] },
  { value: 'WBR', label: 'Mardu (W, B, R)', colors: ['W', 'B', 'R'] },
  { value: 'WBG', label: 'Abzan (W, B, G)', colors: ['W', 'B', 'G'] },
  { value: 'WRG', label: 'Naya (W, R, G)', colors: ['W', 'R', 'G'] },
  { value: 'UBR', label: 'Grixis (U, B, R)', colors: ['U', 'B', 'R'] },
  { value: 'UBG', label: 'Sultai (U, B, G)', colors: ['U', 'B', 'G'] },
  { value: 'URG', label: 'Temur (U, R, G)', colors: ['U', 'R', 'G'] },
  { value: 'BRG', label: 'Jund (B, R, G)', colors: ['B', 'R', 'G'] },
  // Four-color
  {
    value: 'WUBR',
    label: 'Non-Green (W, U, B, R)',
    colors: ['W', 'U', 'B', 'R'],
  },
  {
    value: 'WUBG',
    label: 'Non-Red (W, U, B, G)',
    colors: ['W', 'U', 'B', 'G'],
  },
  {
    value: 'WURG',
    label: 'Non-Black (W, U, R, G)',
    colors: ['W', 'U', 'R', 'G'],
  },
  {
    value: 'WBRG',
    label: 'Non-Blue (W, B, R, G)',
    colors: ['W', 'B', 'R', 'G'],
  },
  {
    value: 'UBRG',
    label: 'Non-White (U, B, R, G)',
    colors: ['U', 'B', 'R', 'G'],
  },
  // Five-color
  {
    value: 'WUBRG',
    label: 'Five Color (W, U, B, R, G)',
    colors: ['W', 'U', 'B', 'R', 'G'],
  },
] as const

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'value_asc', label: 'Price ↑' },
  { value: 'value_desc', label: 'Price ↓' },
] as const

export const COUNTRIES = [
  { value: 'CA', label: 'Canada' },
  { value: 'US', label: 'United States' },
] as const

export const CA_PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' },
] as const

export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'Washington, D.C.' },
] as const

/** Get the regions (provinces or states) for a given country code */
export function getRegions(country: string | null) {
  if (country === 'US') return US_STATES
  return CA_PROVINCES // default to Canada
}

/** Get all regions across all countries (for browse filters) */
export function getAllRegions() {
  return [
    ...CA_PROVINCES.map((p) => ({ ...p, country: 'CA' as const })),
    ...US_STATES.map((s) => ({ ...s, country: 'US' as const })),
  ]
}

/** Kept for backward compatibility — same as CA_PROVINCES */
export const PROVINCES = CA_PROVINCES
