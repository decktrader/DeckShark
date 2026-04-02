// Text decklist importer
// Supports common formats:
//   1x Lightning Bolt
//   1 Lightning Bolt
//   Lightning Bolt
//   1 Arcades, the Strategist (M19) 212
//   COMMANDER: Atraxa, Praetors' Voice

export interface ParsedCard {
  name: string
  quantity: number
  isCommander: boolean
  setCode?: string
  collectorNumber?: string
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
      const rawName = line.replace(/^commander:\s*/i, '').trim()
      if (rawName) {
        const info = extractCardInfo(rawName)
        cards.push({
          name: info.name,
          quantity: 1,
          isCommander: true,
          setCode: info.setCode,
          collectorNumber: info.collectorNumber,
        })
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
      const info = extractCardInfo(match[2])
      if (info.name && quantity > 0) {
        cards.push({
          name: info.name,
          quantity,
          isCommander: nextIsCommander,
          setCode: info.setCode,
          collectorNumber: info.collectorNumber,
        })
        nextIsCommander = false
      } else {
        errors.push(`Could not parse: "${line}"`)
      }
    } else {
      // Assume it's just a card name with quantity 1
      const info = extractCardInfo(line)
      if (info.name) {
        cards.push({
          name: info.name,
          quantity: 1,
          isCommander: nextIsCommander,
          setCode: info.setCode,
          collectorNumber: info.collectorNumber,
        })
        nextIsCommander = false
      } else {
        errors.push(`Could not parse: "${line}"`)
      }
    }
  }

  return { cards, errors }
}

interface CardInfo {
  name: string
  setCode?: string
  collectorNumber?: string
}

/** Extract card name, set code, and collector number from a raw card string */
export function extractCardInfo(raw: string): CardInfo {
  let remaining = raw.trim()

  // Strip foil/etched markers first
  remaining = remaining.replace(/\s*\*(foil|etched)\*?\s*$/i, '')

  let setCode: string | undefined
  let collectorNumber: string | undefined

  // Match "(SET) 123" or "(SET)" at the end
  // Set codes can be letters, numbers, or mixed (e.g., M19, 2XM, MH3)
  const setMatch = remaining.match(/\s*\(([A-Za-z0-9]+)\)\s*(\d+[a-z]?)?\s*$/)
  if (setMatch) {
    setCode = setMatch[1].toUpperCase()
    if (setMatch[2]) {
      collectorNumber = setMatch[2]
    }
    remaining = remaining.slice(0, setMatch.index).trim()
  }

  // If no set code found, check for standalone collector number "#123"
  if (!setCode) {
    const collectorMatch = remaining.match(/\s*#(\d+[a-z]?)\s*$/)
    if (collectorMatch) {
      collectorNumber = collectorMatch[1]
      remaining = remaining.slice(0, collectorMatch.index).trim()
    }
  }

  return {
    name: remaining,
    setCode,
    collectorNumber,
  }
}
