// Scryfall API wrapper
// Docs: https://scryfall.com/docs/api
// Rate limit: 10 requests per second (we add 100ms delay between requests)

const SCRYFALL_API = 'https://api.scryfall.com'

export interface ScryfallCard {
  id: string
  oracle_id: string
  name: string
  mana_cost?: string
  type_line?: string
  color_identity: string[]
  set: string
  image_uris?: {
    normal?: string
    small?: string
    art_crop?: string
  }
  card_faces?: {
    image_uris?: {
      normal?: string
      small?: string
      art_crop?: string
    }
  }[]
  prices: {
    usd?: string | null
    usd_foil?: string | null
  }
  legalities: Record<string, string>
}

interface ScryfallList {
  object: string
  total_cards?: number
  has_more: boolean
  next_page?: string
  data: ScryfallCard[]
}

interface ScryfallBulkDataInfo {
  object: string
  id: string
  type: string
  download_uri: string
  updated_at: string
}

interface ScryfallBulkDataResponse {
  object: string
  data: ScryfallBulkDataInfo[]
}

interface ScryfallAutocomplete {
  object: string
  total_values: number
  data: string[]
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function autocompleteCards(query: string): Promise<string[]> {
  if (query.length < 2) return []

  const res = await fetch(
    `${SCRYFALL_API}/cards/autocomplete?q=${encodeURIComponent(query)}`,
  )
  if (!res.ok) return []

  const data: ScryfallAutocomplete = await res.json()
  return data.data
}

export async function searchCards(query: string): Promise<ScryfallCard[]> {
  const res = await fetch(
    `${SCRYFALL_API}/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name`,
  )
  if (!res.ok) return []

  const data: ScryfallList = await res.json()
  return data.data
}

export async function getCardByName(
  name: string,
  fuzzy = false,
): Promise<ScryfallCard | null> {
  const param = fuzzy ? 'fuzzy' : 'exact'
  const res = await fetch(
    `${SCRYFALL_API}/cards/named?${param}=${encodeURIComponent(name)}`,
  )
  if (!res.ok) return null

  return res.json()
}

export async function getCardsByIds(ids: string[]): Promise<ScryfallCard[]> {
  if (ids.length === 0) return []

  // Scryfall collection endpoint accepts up to 75 IDs at a time
  const results: ScryfallCard[] = []
  for (let i = 0; i < ids.length; i += 75) {
    const batch = ids.slice(i, i + 75)
    const res = await fetch(`${SCRYFALL_API}/cards/collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifiers: batch.map((id) => ({ id })),
      }),
    })

    if (res.ok) {
      const data: ScryfallList = await res.json()
      results.push(...data.data)
    }

    if (i + 75 < ids.length) await delay(100)
  }

  return results
}

export async function getBulkDataUrl(): Promise<string | null> {
  const res = await fetch(`${SCRYFALL_API}/bulk-data`)
  if (!res.ok) return null

  const data: ScryfallBulkDataResponse = await res.json()
  const defaultCards = data.data.find((d) => d.type === 'default_cards')
  return defaultCards?.download_uri ?? null
}

/** Parse a USD price string like "12.34" into cents (1234) */
export function priceToCents(price: string | null | undefined): number | null {
  if (!price) return null
  const cents = Math.round(parseFloat(price) * 100)
  return isNaN(cents) ? null : cents
}

/** Get image URIs, handling double-faced cards */
export function getImageUris(card: ScryfallCard) {
  if (card.image_uris) {
    return {
      normal: card.image_uris.normal ?? null,
      small: card.image_uris.small ?? null,
      art_crop: card.image_uris.art_crop ?? null,
    }
  }
  // Double-faced cards: use front face
  const front = card.card_faces?.[0]?.image_uris
  return {
    normal: front?.normal ?? null,
    small: front?.small ?? null,
    art_crop: front?.art_crop ?? null,
  }
}
