const MANA_ICONS: Record<string, string> = {
  W: '/icons/mana/Plains-icon.png',
  U: '/icons/mana/Island-icon.png',
  B: '/icons/mana/Swamp-icon.png',
  R: '/icons/mana/Mountain-icon.png',
  G: '/icons/mana/Forest-icon.png',
}

const COLOR_NAMES: Record<string, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
}

interface ColorPipsProps {
  colors: string[]
  /** Icon size in px (default 18) */
  size?: number
  /** Overlap in px (default 5) */
  overlap?: number
  /** Additional class names (overrides default positioning) */
  className?: string
}

export function ColorPips({
  colors,
  size = 18,
  overlap = 5,
  className,
}: ColorPipsProps) {
  if (!colors || colors.length === 0) return null

  return (
    <div className={className ?? 'absolute top-2 right-2 z-10 flex'}>
      {colors.map((c, i) => {
        const src = MANA_ICONS[c]
        if (!src) return null
        return (
          <img
            key={c}
            src={src}
            alt={COLOR_NAMES[c] ?? c}
            className="rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
            style={{
              width: size,
              height: size,
              marginLeft: i > 0 ? -overlap : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
