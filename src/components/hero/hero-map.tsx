'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { HeroCity } from '@/lib/services/hero.server'

// ===== Region polygons (CA provinces + US state clusters) =====
const REGIONS: Array<{
  id: string
  country: 'CA' | 'US'
  poly: number[][]
}> = [
  {
    id: 'BC',
    country: 'CA',
    poly: [
      [110, 138],
      [140, 115],
      [175, 98],
      [225, 90],
      [235, 180],
      [210, 225],
      [170, 230],
      [130, 210],
    ],
  },
  {
    id: 'PR',
    country: 'CA',
    poly: [
      [225, 90],
      [280, 85],
      [340, 82],
      [380, 82],
      [380, 210],
      [345, 225],
      [295, 225],
      [235, 180],
    ],
  },
  {
    id: 'ON',
    country: 'CA',
    poly: [
      [380, 82],
      [460, 85],
      [520, 90],
      [580, 98],
      [600, 180],
      [560, 225],
      [490, 235],
      [420, 225],
      [380, 210],
    ],
  },
  {
    id: 'QC',
    country: 'CA',
    poly: [
      [580, 98],
      [630, 108],
      [670, 120],
      [695, 128],
      [705, 200],
      [680, 235],
      [630, 240],
      [600, 180],
    ],
  },
  {
    id: 'ATL',
    country: 'CA',
    poly: [
      [695, 128],
      [720, 135],
      [745, 148],
      [763, 168],
      [770, 190],
      [765, 215],
      [750, 238],
      [730, 255],
      [710, 250],
      [705, 200],
    ],
  },
  {
    id: 'PNW',
    country: 'US',
    poly: [
      [130, 210],
      [170, 230],
      [180, 290],
      [170, 340],
      [145, 355],
      [130, 325],
      [120, 295],
      [110, 265],
    ],
  },
  {
    id: 'CAL',
    country: 'US',
    poly: [
      [145, 355],
      [170, 340],
      [185, 395],
      [180, 420],
      [160, 425],
      [150, 410],
      [140, 385],
    ],
  },
  {
    id: 'MTN',
    country: 'US',
    poly: [
      [170, 230],
      [295, 225],
      [345, 225],
      [350, 395],
      [305, 430],
      [270, 428],
      [235, 427],
      [200, 425],
      [180, 420],
      [185, 395],
      [180, 290],
    ],
  },
  {
    id: 'MW',
    country: 'US',
    poly: [
      [345, 225],
      [420, 225],
      [490, 235],
      [560, 225],
      [565, 395],
      [525, 438],
      [460, 452],
      [435, 452],
      [395, 455],
      [370, 448],
      [340, 438],
      [350, 395],
    ],
  },
  {
    id: 'NE',
    country: 'US',
    poly: [
      [560, 225],
      [630, 240],
      [680, 235],
      [700, 278],
      [695, 295],
      [690, 315],
      [685, 340],
      [678, 365],
      [670, 388],
      [660, 408],
      [610, 395],
      [565, 395],
    ],
  },
  {
    id: 'SE',
    country: 'US',
    poly: [
      [565, 395],
      [610, 395],
      [660, 408],
      [645, 425],
      [625, 440],
      [615, 460],
      [618, 475],
      [628, 478],
      [632, 470],
      [625, 455],
      [615, 448],
      [590, 447],
      [555, 447],
      [525, 438],
    ],
  },
]

// Lakes — empty per final handoff (user removed all lakes). Keep logic for future edits.
const LAKES: Array<{ poly: number[][] }> = []

// ===== Geometry helpers =====
function pointInPoly(p: number[], poly: number[][]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0],
      yi = poly[i][1]
    const xj = poly[j][0],
      yj = poly[j][1]
    const intersect =
      yi > p[1] !== yj > p[1] &&
      p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi || 1e-9) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function pointInLake(p: number[]): boolean {
  for (const l of LAKES) if (pointInPoly(p, l.poly)) return true
  return false
}

function regionForPoint(p: number[]): (typeof REGIONS)[number] | null {
  for (const r of REGIONS) if (pointInPoly(p, r.poly)) return r
  return null
}

const HEX_SIZE = 11

function hexPath(cx: number, cy: number, size: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 180) * (60 * i - 30)
    pts.push(
      `${(cx + size * Math.cos(ang)).toFixed(2)},${(cy + size * Math.sin(ang)).toFixed(2)}`,
    )
  }
  return `M ${pts.join(' L ')} Z`
}

interface Hex {
  key: string
  cx: number
  cy: number
  country: 'CA' | 'US'
}

function buildGrid(): Hex[] {
  const w = Math.sqrt(3) * HEX_SIZE
  const h = 2 * HEX_SIZE
  const step = h * 0.75
  const out: Hex[] = []
  const cols = Math.ceil(900 / w) + 2
  const rows = Math.ceil(480 / step) + 2
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * w + (r % 2 ? w / 2 : 0)
      const cy = r * step
      if (cx < -w || cx > 900 + w || cy < -h || cy > 480 + h) continue
      const reg = regionForPoint([cx, cy])
      if (!reg) continue
      if (pointInLake([cx, cy])) continue
      out.push({ key: `${r}-${c}`, cx, cy, country: reg.country })
    }
  }
  return out
}

const HEXES = buildGrid()

// ===== Hex edits from Map Editor — verbatim from handoff =====
const HEX_EDITS: {
  added: Hex[]
  removed: string[]
  recolored: Record<string, 'CA' | 'US'>
} = {
  added: [
    { key: '19-9', cx: 180.99930939094767, cy: 313.5, country: 'US' },
    { key: '21-9', cx: 180.99930939094767, cy: 346.5, country: 'US' },
    { key: '23-9', cx: 180.99930939094767, cy: 379.5, country: 'US' },
    { key: '13-11', cx: 219.10442715746296, cy: 214.5, country: 'CA' },
    { key: '12-12', cx: 228.6307065990918, cy: 198, country: 'CA' },
    { key: '12-13', cx: 247.68326548234944, cy: 198, country: 'CA' },
    { key: '13-12', cx: 238.15698604072062, cy: 214.5, country: 'CA' },
    { key: '13-13', cx: 257.2095449239783, cy: 214.5, country: 'CA' },
    { key: '13-14', cx: 276.2621038072359, cy: 214.5, country: 'CA' },
    { key: '12-18', cx: 342.9460598986377, cy: 198, country: 'CA' },
    { key: '11-18', cx: 352.47233934026656, cy: 181.5, country: 'CA' },
    { key: '13-19', cx: 371.5248982235242, cy: 214.5, country: 'CA' },
    { key: '13-20', cx: 390.5774571067818, cy: 214.5, country: 'CA' },
    { key: '14-31', cx: 590.6293253809871, cy: 231, country: 'US' },
    { key: '14-32', cx: 609.6818842642448, cy: 231, country: 'US' },
    { key: '13-31', cx: 600.1556048226159, cy: 214.5, country: 'CA' },
    { key: '13-30', cx: 581.1030459393584, cy: 214.5, country: 'CA' },
    { key: '12-31', cx: 590.6293253809871, cy: 198, country: 'CA' },
    { key: '11-31', cx: 600.1556048226159, cy: 181.5, country: 'CA' },
    { key: '14-36', cx: 685.8921197972754, cy: 231, country: 'CA' },
    { key: '15-36', cx: 695.4183992389043, cy: 247.5, country: 'CA' },
    { key: '14-37', cx: 704.944678680533, cy: 231, country: 'CA' },
    { key: '28-33', cx: 628.7344431475025, cy: 462, country: 'US' },
    { key: '28-32', cx: 609.6818842642448, cy: 462, country: 'US' },
    { key: '29-33', cx: 638.2607225891313, cy: 478.5, country: 'US' },
    { key: '26-17', cx: 323.89350101538, cy: 429, country: 'US' },
    { key: '25-17', cx: 333.41978045700887, cy: 412.5, country: 'US' },
    { key: '28-20', cx: 381.051177665153, cy: 462, country: 'US' },
    { key: '28-21', cx: 400.10373654841067, cy: 462, country: 'US' },
    { key: '28-22', cx: 419.1562954316683, cy: 462, country: 'US' },
    { key: '28-23', cx: 438.20885431492593, cy: 462, country: 'US' },
  ],
  removed: [
    '16-6',
    '23-7',
    '24-8',
    '25-8',
    '11-20',
    '10-20',
    '14-38',
    '13-35',
    '13-37',
    '12-38',
    '12-40',
    '14-39',
    '15-38',
    '16-29',
    '16-28',
    '14-27',
    '16-26',
    '17-25',
    '13-25',
    '13-24',
    '15-30',
    '19-12',
    '27-24',
    '27-25',
    '11-39',
  ],
  recolored: {
    '14-24': 'CA',
    '15-27': 'CA',
    '14-28': 'CA',
    '14-29': 'CA',
    '15-29': 'CA',
    '15-28': 'CA',
    '14-30': 'CA',
  },
}

// Apply edits: remove, recolor, then add (deduped)
const HEXES_HEAT: Hex[] = (() => {
  const removed = new Set(HEX_EDITS.removed)
  const baseKeys = new Set(HEXES.map((h) => h.key))
  const base = HEXES.filter((h) => !removed.has(h.key)).map((h) =>
    HEX_EDITS.recolored[h.key]
      ? { ...h, country: HEX_EDITS.recolored[h.key] }
      : h,
  )
  const added = HEX_EDITS.added.filter((h) => !baseKeys.has(h.key))
  return [...base, ...added]
})()

function nearestHex(city: { x: number; y: number }): number {
  let best = -1,
    bestD = Infinity
  for (let i = 0; i < HEXES_HEAT.length; i++) {
    const dx = HEXES_HEAT[i].cx - city.x,
      dy = HEXES_HEAT[i].cy - city.y
    const d = dx * dx + dy * dy
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

// Cities that always show their label
const ALWAYS_LABEL_CITIES = new Set([
  'Toronto',
  'Montreal',
  'San Francisco',
  'Los Angeles',
  'Austin',
  'New York',
  'Miami',
  'Chicago',
  'Las Vegas',
  'Denver',
  'Saskatoon',
])

// ===== Component =====
interface HeroMapProps {
  cities: HeroCity[]
}

export function HeroMap({ cities }: HeroMapProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const active = cities[activeIdx] ?? cities[0]
  const router = useRouter()

  useEffect(() => {
    if (isHovering || cities.length === 0) return
    const id = setInterval(
      () => setActiveIdx((i) => (i + 1) % cities.length),
      2800,
    )
    return () => clearInterval(id)
  }, [isHovering, cities.length])

  const handleHover = useCallback((i: number) => setActiveIdx(i), [])

  const handleClick = useCallback(
    (i: number) => {
      const city = cities[i]
      if (!city) return
      router.push(`/?city=${encodeURIComponent(city.name)}#browse`)
      setTimeout(() => {
        document
          .getElementById('browse')
          ?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    },
    [cities, router],
  )

  const cityHexIdx = useMemo(() => cities.map((c) => nearestHex(c)), [cities])

  const hexToCity = useMemo(() => {
    const m = new Map<number, number>()
    cityHexIdx.forEach((idx, ci) => m.set(idx, ci))
    return m
  }, [cityHexIdx])

  const heatByHex = useMemo(() => {
    const arr = new Array(HEXES_HEAT.length).fill(0) as number[]
    const SIGMA2 = 90 * 90
    for (let i = 0; i < HEXES_HEAT.length; i++) {
      const h = HEXES_HEAT[i]
      let sum = 0
      for (const c of cities) {
        const dx = h.cx - c.x,
          dy = h.cy - c.y
        sum += c.decks * Math.exp(-(dx * dx + dy * dy) / SIGMA2)
      }
      arr[i] = sum
    }
    const max = Math.max(...arr) || 1
    return arr.map((v) => v / max)
  }, [cities])

  const sortedCityIndices = useMemo(() => {
    return [...cities.keys()].sort(
      (a, b) => (a === activeIdx ? 1 : 0) - (b === activeIdx ? 1 : 0),
    )
  }, [cities, activeIdx])

  if (cities.length === 0) return null

  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative overflow-hidden rounded-2xl border border-violet-400/[0.18]"
      style={{
        aspectRatio: '9 / 6.5',
        background: 'rgba(15, 8, 32, 0.6)',
        boxShadow:
          '0 30px 80px rgba(0,0,0,0.5), inset 0 0 60px rgba(124,58,237,0.05)',
      }}
    >
      <svg viewBox="0 0 900 480" className="block h-full w-full">
        <defs>
          <radialGradient id="hex-bg" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#1b0f3a" />
            <stop offset="100%" stopColor="#0a0418" />
          </radialGradient>
          <filter id="hex-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={4} />
          </filter>
        </defs>

        <rect width={900} height={480} fill="url(#hex-bg)" />

        {/* Heat-colored hex grid */}
        <g>
          {HEXES_HEAT.map((h, i) => {
            if (hexToCity.has(i)) return null
            const t = heatByHex[i]
            const fill =
              h.country === 'CA'
                ? `rgba(${Math.round(120 + 80 * t)}, ${Math.round(95 + 55 * t)}, ${Math.round(200 + 50 * t)}, ${(0.55 + 0.4 * t).toFixed(2)})`
                : `rgba(${Math.round(40 + 30 * t)}, ${Math.round(180 + 60 * t)}, ${Math.round(150 + 50 * t)}, ${(0.5 + 0.4 * t).toFixed(2)})`
            return (
              <path
                key={h.key}
                d={hexPath(h.cx, h.cy, HEX_SIZE - 0.6)}
                fill={fill}
                stroke="rgba(11,4,24,0.5)"
                strokeWidth={0.5}
              />
            )
          })}
        </g>

        {/* City hex pins */}
        <g>
          {sortedCityIndices.map((i) => {
            const c = cities[i]
            const hIdx = cityHexIdx[i]
            const h = HEXES_HEAT[hIdx]
            if (!h) return null
            const isActive = activeIdx === i
            return (
              <g
                key={i}
                onMouseEnter={() => handleHover(i)}
                onClick={() => handleClick(i)}
                style={{ cursor: 'pointer' }}
              >
                {isActive && (
                  <path
                    d={hexPath(h.cx, h.cy, HEX_SIZE + 5)}
                    fill="rgba(255,255,255,0.4)"
                    filter="url(#hex-glow)"
                  />
                )}
                <path
                  d={hexPath(h.cx, h.cy, HEX_SIZE - 0.6)}
                  fill={
                    isActive
                      ? '#fff'
                      : c.country === 'CA'
                        ? 'rgba(196,181,253,1)'
                        : 'rgba(94,234,212,1)'
                  }
                  stroke="#0b0418"
                  strokeWidth={0.8}
                />
              </g>
            )
          })}
        </g>

        {/* Active city pulse */}
        {activeIdx >= 0 && HEXES_HEAT[cityHexIdx[activeIdx]] && (
          <circle
            cx={HEXES_HEAT[cityHexIdx[activeIdx]].cx}
            cy={HEXES_HEAT[cityHexIdx[activeIdx]].cy}
            r={4}
            fill="none"
            stroke="#fff"
            strokeWidth={1}
            opacity={0.9}
          >
            <animate
              attributeName="r"
              from="4"
              to="22"
              dur="1.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.9"
              to="0"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* City labels */}
        {sortedCityIndices.map((i) => {
          const c = cities[i]
          const h = HEXES_HEAT[cityHexIdx[i]]
          if (!h) return null
          const isActive = activeIdx === i
          if (!isActive && !ALWAYS_LABEL_CITIES.has(c.name) && c.decks < 10)
            return null
          return (
            <text
              key={`label-${i}`}
              x={h.cx}
              y={h.cy - HEX_SIZE - 4}
              textAnchor="middle"
              fontSize={isActive ? 11 : 9.5}
              fontWeight={700}
              fill={isActive ? '#fff' : 'rgba(255,255,255,0.82)'}
              stroke="#0b0418"
              strokeWidth={3}
              paintOrder="stroke"
              letterSpacing="0.02em"
              style={{ pointerEvents: 'none' }}
            >
              {c.name}
            </text>
          )
        })}
      </svg>

      {/* Map title overlay */}
      <div
        className="absolute top-4 left-4 rounded-[10px] border border-violet-400/25 px-3.5 py-2 backdrop-blur-lg"
        style={{ background: 'rgba(11,4,24,0.78)' }}
      >
        <div className="text-[10px] font-semibold tracking-[0.12em] text-violet-300/70 uppercase">
          Marketplace activity
        </div>
        <div className="text-sm font-bold text-white">
          Canada &amp; United States
        </div>
      </div>

      {/* Active city panel */}
      {active && (
        <div
          className="absolute right-4 bottom-4 rounded-[10px] border border-violet-400/30 p-2.5 px-3.5 backdrop-blur-[10px]"
          style={{ background: 'rgba(15, 8, 32, 0.92)' }}
        >
          <div className="text-[10px] tracking-wider text-violet-300/70 uppercase">
            Active city
          </div>
          <div className="mt-0.5 text-sm font-bold text-white">
            {active.name}
          </div>
          {active.decks > 0 ? (
            <div className="mt-1 flex gap-3 text-[11px]">
              <div>
                <span className="font-bold text-white">{active.decks}</span>
                <span className="text-white/50"> decks</span>
              </div>
              <div>
                <span className="font-bold text-white">{active.traders}</span>
                <span className="text-white/50"> traders</span>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-emerald-400">
              Be the first trader here!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
