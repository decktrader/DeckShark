import type { ParseResult } from './text'

// Archidekt public deck URL: https://archidekt.com/decks/{deckId}/...
// API endpoint: https://archidekt.com/api/decks/{deckId}/small/

interface ArchidektCard {
  quantity: number
  card: {
    oracleCard: {
      name: string
    }
  }
  categories: string[]
}

interface ArchidektDeck {
  cards: ArchidektCard[]
}

export function extractArchidektId(url: string): string | null {
  const match = url.match(/archidekt\.com\/decks\/(\d+)/)
  return match ? match[1] : null
}

export async function importFromArchidekt(url: string): Promise<ParseResult> {
  const deckId = extractArchidektId(url)
  if (!deckId) {
    return { cards: [], errors: ['Invalid Archidekt URL.'] }
  }

  let deck: ArchidektDeck
  try {
    const res = await fetch(
      `https://archidekt.com/api/decks/${deckId}/small/`,
      {
        headers: {
          'User-Agent': 'DeckTrader/1.0 (decktrader.ca)',
        },
        next: { revalidate: 0 },
      },
    )
    if (!res.ok) {
      return {
        cards: [],
        errors: [
          `Archidekt returned ${res.status}. The deck may be private or the URL is invalid.`,
        ],
      }
    }
    deck = await res.json()
  } catch {
    return { cards: [], errors: ['Failed to reach Archidekt. Try again.'] }
  }

  const cards = []
  const errors: string[] = []

  for (const entry of deck.cards ?? []) {
    const name = entry.card?.oracleCard?.name
    if (!name || entry.quantity <= 0) continue

    // Archidekt marks commanders via the "Commander" category
    const isCommander = entry.categories.some(
      (c) => c.toLowerCase() === 'commander',
    )

    // Skip sideboard/maybeboard categories
    const skip = entry.categories.some((c) =>
      /^(sideboard|maybeboard|considering)$/i.test(c),
    )
    if (skip) continue

    cards.push({ name, quantity: entry.quantity, isCommander })
  }

  if (cards.length === 0) {
    errors.push('No cards found in this Archidekt deck.')
  }

  return { cards, errors }
}
