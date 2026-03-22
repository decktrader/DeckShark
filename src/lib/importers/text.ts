// Text decklist importer
// Supports common formats:
//   1x Lightning Bolt
//   1 Lightning Bolt
//   Lightning Bolt
//   COMMANDER: Atraxa, Praetors' Voice

export interface ParsedCard {
  name: string
  quantity: number
  isCommander: boolean
}

export interface ParseResult {
  cards: ParsedCard[]
  errors: string[]
}

export function parseDecklist(text: string): ParseResult {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const cards: ParsedCard[] = []
  const errors: string[] = []
  let nextIsCommander = false

  for (const line of lines) {
    // Skip section headers like "Mainboard", "Sideboard", "Deck", etc.
    if (/^(mainboard|sideboard|deck|companion|maybeboard)\s*$/i.test(line)) {
      continue
    }

    // Skip comment lines
    if (line.startsWith('//') || line.startsWith('#')) {
      continue
    }

    // Check for COMMANDER: prefix
    if (/^commander:\s*/i.test(line)) {
      const name = line.replace(/^commander:\s*/i, '').trim()
      if (name) {
        cards.push({ name, quantity: 1, isCommander: true })
      }
      continue
    }

    // Check for "COMMANDER" section header
    if (/^commander\s*$/i.test(line)) {
      nextIsCommander = true
      continue
    }

    // Parse "Nx Card Name" or "N Card Name" or just "Card Name"
    const match = line.match(/^(\d+)\s*x?\s+(.+)$/i)

    if (match) {
      const quantity = parseInt(match[1], 10)
      const name = cleanCardName(match[2])
      if (name && quantity > 0) {
        cards.push({ name, quantity, isCommander: nextIsCommander })
        nextIsCommander = false
      } else {
        errors.push(`Could not parse: "${line}"`)
      }
    } else {
      // Assume it's just a card name with quantity 1
      const name = cleanCardName(line)
      if (name) {
        cards.push({ name, quantity: 1, isCommander: nextIsCommander })
        nextIsCommander = false
      } else {
        errors.push(`Could not parse: "${line}"`)
      }
    }
  }

  return { cards, errors }
}

function cleanCardName(name: string): string {
  // Remove set code in parentheses, e.g. "Lightning Bolt (2XM)"
  let cleaned = name.replace(/\s*\([A-Z0-9]+\)\s*$/, '')
  // Remove collector number, e.g. "Lightning Bolt #123"
  cleaned = cleaned.replace(/\s*#\d+\s*$/, '')
  // Remove foil/etched markers
  cleaned = cleaned.replace(/\s*\*(foil|etched)\*?\s*$/i, '')
  return cleaned.trim()
}
