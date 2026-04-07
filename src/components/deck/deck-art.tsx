'use client'

function scryfallArtUrl(scryfallId: string): string {
  return `https://cards.scryfall.io/art_crop/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
}

interface DeckArtProps {
  commanderScryfallId: string | null
  partnerScryfallId?: string | null
  className?: string
  /** Aspect ratio class, defaults to aspect-[5/4] */
  aspect?: string
}

export function DeckArt({
  commanderScryfallId,
  partnerScryfallId,
  className = '',
  aspect = 'aspect-[5/4]',
}: DeckArtProps) {
  const hasPartner = partnerScryfallId != null

  if (!commanderScryfallId) {
    return <div className={`bg-muted w-full ${aspect} ${className}`} />
  }

  if (!hasPartner) {
    return (
      <div
        className={`w-full bg-cover bg-center ${aspect} ${className}`}
        style={{
          backgroundImage: `url(${scryfallArtUrl(commanderScryfallId)})`,
        }}
      />
    )
  }

  // Vertical split: left half primary, right half partner
  return (
    <div className={`relative w-full overflow-hidden ${aspect} ${className}`}>
      {/* Primary commander — left half */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 bg-cover bg-center"
        style={{
          backgroundImage: `url(${scryfallArtUrl(commanderScryfallId)})`,
        }}
      />
      {/* Partner commander — right half */}
      <div
        className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-center"
        style={{
          backgroundImage: `url(${scryfallArtUrl(partnerScryfallId)})`,
        }}
      />
      {/* Vertical divider */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
    </div>
  )
}
