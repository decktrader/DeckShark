import type { ParseResult } from './text'

// Moxfield public deck URL: https://www.moxfield.com/decks/{publicId}
// API endpoint: https://api2.moxfield.com/v3/decks/all/{publicId}

interface MoxfieldCardEntry {
  quantity: number
  card: {
    name: string
  }
}

interface MoxfieldDeck {
  commanders?: Record<string, MoxfieldCardEntry>
  mainboard?: Record<string, MoxfieldCardEntry>
  sideboard?: Record<string, MoxfieldCardEntry>
}

export function extractMoxfieldId(url: string): string | null {
  const match = url.match(/moxfield\.com\/decks\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

export async function importFromMoxfield(url: string): Promise<ParseResult> {
  const publicId = extractMoxfieldId(url)
  if (!publicId) {
    return { cards: [], errors: ['Invalid Moxfield URL.'] }
  }

  let deck: MoxfieldDeck
  try {
    const res = await fetch(
      `https://api2.moxfield.com/v3/decks/all/${publicId}`,
      {
        headers: {
          'User-Agent': 'DeckTrader/1.0 (decktrader.ca)',
        },
        next: { revalidate: 0 },
      },
    )
    if (!res.ok) {
      if (res.status === 403) {
        return {
          cards: [],
          errors: [
            'Moxfield blocks automated imports. To import this deck, open it on Moxfield, click Download → Text, then paste the text into the "Paste text" tab.',
          ],
        }
      }
      return {
        cards: [],
        errors: [
          `Moxfield returned ${res.status}. The deck may be private or the URL is invalid.`,
        ],
      }
    }
    deck = await res.json()
  } catch {
    return { cards: [], errors: ['Failed to reach Moxfield. Try again.'] }
  }

  const cards = []
  const errors: string[] = []

  // Commanders
  for (const entry of Object.values(deck.commanders ?? {})) {
    if (entry.card?.name && entry.quantity > 0) {
      cards.push({
        name: entry.card.name,
        quantity: entry.quantity,
        isCommander: true,
      })
    }
  }

  // Mainboard
  for (const entry of Object.values(deck.mainboard ?? {})) {
    if (entry.card?.name && entry.quantity > 0) {
      cards.push({
        name: entry.card.name,
        quantity: entry.quantity,
        isCommander: false,
      })
    }
  }

  if (cards.length === 0) {
    errors.push('No cards found in this Moxfield deck.')
  }

  return { cards, errors }
}
