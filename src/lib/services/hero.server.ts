import { createClient } from '@/lib/supabase/server'
import type { ServiceResponse } from '@/types'

export interface HeroCity {
  name: string
  country: string
  x: number
  y: number
  decks: number
  traders: number
}

export interface HeroStats {
  totalDecks: number
  totalTraders: number
  totalCities: number
}

export interface FeaturedDeck {
  id: string
  name: string
  commander_name: string | null
  commander_scryfall_id: string | null
  estimated_value_cents: number | null
  ownerCity: string | null
  ownerProvince: string | null
}

export interface TickerItem {
  who: string
  city: string
  action: 'listed' | 'wants' | 'traded'
  what: string
  when: string
}

// Hand-tuned coordinates for the 900x480 SVG viewBox map
const CITY_COORDS: Record<string, { x: number; y: number }> = {
  // Canada
  Vancouver: { x: 130, y: 200 },
  Calgary: { x: 215, y: 195 },
  Saskatoon: { x: 285, y: 175 },
  Edmonton: { x: 215, y: 165 },
  Winnipeg: { x: 355, y: 210 },
  Toronto: { x: 555, y: 240 },
  Ottawa: { x: 595, y: 220 },
  Montreal: { x: 630, y: 215 },
  Halifax: { x: 755, y: 230 },
  // US
  Seattle: { x: 145, y: 265 },
  Portland: { x: 140, y: 295 },
  'San Francisco': { x: 135, y: 360 },
  'Los Angeles': { x: 175, y: 405 },
  'Las Vegas': { x: 215, y: 380 },
  Phoenix: { x: 245, y: 410 },
  Denver: { x: 305, y: 350 },
  Austin: { x: 405, y: 425 },
  Houston: { x: 435, y: 440 },
  Dallas: { x: 410, y: 405 },
  Chicago: { x: 480, y: 320 },
  Minneapolis: { x: 440, y: 285 },
  Nashville: { x: 530, y: 380 },
  Atlanta: { x: 565, y: 405 },
  Miami: { x: 625, y: 460 },
  'New York': { x: 650, y: 320 },
  Boston: { x: 685, y: 295 },
  Philadelphia: { x: 645, y: 340 },
  DC: { x: 625, y: 350 },
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export async function getHeroCities(): Promise<ServiceResponse<HeroCity[]>> {
  const supabase = await createClient()

  // Get cities that have at least one active trade-available deck
  const { data, error } = await supabase
    .from('decks')
    .select('user_id, owner:users!user_id(city, country)')
    .eq('available_for_trade', true)
    .eq('status', 'active')

  if (error) return { data: null, error: error.message }

  // Aggregate by city
  const cityMap = new Map<
    string,
    { country: string; decks: number; traders: Set<string> }
  >()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of data as any[]) {
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner
    const city = owner?.city
    if (!city) continue
    const country = owner?.country ?? 'CA'
    const existing = cityMap.get(city) ?? {
      country,
      decks: 0,
      traders: new Set<string>(),
    }
    existing.decks++
    existing.traders.add(row.user_id)
    cityMap.set(city, existing)
  }

  // Start with all known cities as static pins (0 decks/traders)
  // so the map looks full even at low data volumes
  const COUNTRY_FOR_CITY: Record<string, string> = {
    Vancouver: 'CA',
    Calgary: 'CA',
    Saskatoon: 'CA',
    Edmonton: 'CA',
    Winnipeg: 'CA',
    Toronto: 'CA',
    Ottawa: 'CA',
    Montreal: 'CA',
    Halifax: 'CA',
    Seattle: 'US',
    Portland: 'US',
    'San Francisco': 'US',
    'Los Angeles': 'US',
    'Las Vegas': 'US',
    Phoenix: 'US',
    Denver: 'US',
    Austin: 'US',
    Houston: 'US',
    Dallas: 'US',
    Chicago: 'US',
    Minneapolis: 'US',
    Nashville: 'US',
    Atlanta: 'US',
    Miami: 'US',
    'New York': 'US',
    Boston: 'US',
    Philadelphia: 'US',
    DC: 'US',
  }

  const cities: HeroCity[] = []
  for (const [name, coords] of Object.entries(CITY_COORDS)) {
    const dbInfo = cityMap.get(name)
    cities.push({
      name,
      country: dbInfo?.country ?? COUNTRY_FOR_CITY[name] ?? 'US',
      x: coords.x,
      y: coords.y,
      decks: dbInfo?.decks ?? 0,
      traders: dbInfo?.traders.size ?? 0,
    })
  }

  // Sort by deck count descending for a nice default cycle order
  cities.sort((a, b) => b.decks - a.decks)

  return { data: cities, error: null }
}

export async function getHeroStats(): Promise<ServiceResponse<HeroStats>> {
  const supabase = await createClient()

  // Count active trade-available decks
  const { count: deckCount } = await supabase
    .from('decks')
    .select('id', { count: 'exact', head: true })
    .eq('available_for_trade', true)
    .eq('status', 'active')

  // Count distinct traders (users with at least one active deck)
  const { data: traderRows } = await supabase
    .from('decks')
    .select('user_id')
    .eq('available_for_trade', true)
    .eq('status', 'active')

  const uniqueTraders = new Set(traderRows?.map((r) => r.user_id) ?? [])

  // Count distinct cities
  const { data: cityRows } = await supabase
    .from('users')
    .select('city')
    .not('city', 'is', null)

  const uniqueCities = new Set(
    cityRows?.map((r) => r.city).filter(Boolean) ?? [],
  )

  return {
    data: {
      totalDecks: deckCount ?? 0,
      totalTraders: uniqueTraders.size,
      totalCities: uniqueCities.size,
    },
    error: null,
  }
}

export async function getFeaturedDecks(): Promise<
  ServiceResponse<FeaturedDeck[]>
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('decks')
    .select(
      'id, name, commander_name, commander_scryfall_id, estimated_value_cents, owner:users!user_id(city, province)',
    )
    .eq('available_for_trade', true)
    .eq('status', 'active')
    .not('commander_scryfall_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(12)

  if (error) return { data: null, error: error.message }

  // Pick 4 semi-random from the top 12 (rotating every 12h)
  const halfDay = Math.floor(Date.now() / (1000 * 60 * 60 * 12))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data as any[]

  const featured: FeaturedDeck[] = []
  const used = new Set<number>()
  for (let i = 0; i < 4 && i < rows.length; i++) {
    let idx = (halfDay + i) % rows.length
    while (used.has(idx) && used.size < rows.length) {
      idx = (idx + 1) % rows.length
    }
    used.add(idx)
    const r = rows[idx]
    const owner = Array.isArray(r.owner) ? r.owner[0] : r.owner
    featured.push({
      id: r.id,
      name: r.name,
      commander_name: r.commander_name,
      commander_scryfall_id: r.commander_scryfall_id,
      estimated_value_cents: r.estimated_value_cents,
      ownerCity: owner?.city ?? null,
      ownerProvince: owner?.province ?? null,
    })
  }

  return { data: featured, error: null }
}

export async function getTickerItems(): Promise<ServiceResponse<TickerItem[]>> {
  const supabase = await createClient()
  // Use a wide window so there's always ticker content, even with low activity
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const items: TickerItem[] = []

  // Recent deck listings
  const { data: listings } = await supabase
    .from('decks')
    .select('name, updated_at, owner:users!user_id(username, city)')
    .eq('available_for_trade', true)
    .eq('status', 'active')
    .gte('updated_at', cutoff)
    .order('updated_at', { ascending: false })
    .limit(10)

  if (listings) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of listings as any[]) {
      const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner
      if (!owner?.city) continue
      items.push({
        who: owner.username,
        city: owner.city,
        action: 'listed',
        what: row.name,
        when: relativeTime(row.updated_at),
      })
    }
  }

  // Recent want lists
  const { data: wants } = await supabase
    .from('want_lists')
    .select(
      'title, commander_name, updated_at, owner:users!user_id(username, city)',
    )
    .eq('status', 'active')
    .gte('updated_at', cutoff)
    .order('updated_at', { ascending: false })
    .limit(8)

  if (wants) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of wants as any[]) {
      const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner
      if (!owner?.city) continue
      items.push({
        who: owner.username,
        city: owner.city,
        action: 'wants',
        what: row.commander_name ?? row.title,
        when: relativeTime(row.updated_at),
      })
    }
  }

  // Recent completed trades
  const { data: trades } = await supabase
    .from('trades')
    .select(
      'updated_at, proposer:users!proposer_id(username, city), trade_decks(deck_id, offered_by, deck:decks!deck_id(name))',
    )
    .eq('status', 'completed')
    .gte('updated_at', cutoff)
    .order('updated_at', { ascending: false })
    .limit(6)

  if (trades) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of trades as any[]) {
      const proposer = Array.isArray(row.proposer)
        ? row.proposer[0]
        : row.proposer
      if (!proposer?.city) continue
      const deckNames = row.trade_decks
        ?.map((td: { deck: { name: string }[] | { name: string } }) => {
          const deck = Array.isArray(td.deck) ? td.deck[0] : td.deck
          return deck?.name
        })
        .filter(Boolean)
      if (!deckNames?.length) continue
      items.push({
        who: proposer.username,
        city: proposer.city,
        action: 'traded',
        what: deckNames.join(' \u2192 '),
        when: relativeTime(row.updated_at),
      })
    }
  }

  // Sort by recency (most recent first)
  items.sort((a, b) => {
    const parseTime = (s: string) => {
      if (s === 'just now') return 0
      const m = s.match(/(\d+)(m|h|d)/)
      if (!m) return 0
      const n = parseInt(m[1])
      if (m[2] === 'm') return n
      if (m[2] === 'h') return n * 60
      return n * 1440
    }
    return parseTime(a.when) - parseTime(b.when)
  })

  return { data: items.slice(0, 20), error: null }
}
