'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
      out.push({ key: `${r}-${c}`, cx, cy, country: reg.country })
    }
  }
  return out
}

// Pre-compute the hex grid once (static — doesn't depend on props)
const HEXES = buildGrid()

function nearestHex(city: { x: number; y: number }): number {
  let best = -1,
    bestD = Infinity
  for (let i = 0; i < HEXES.length; i++) {
    const dx = HEXES[i].cx - city.x,
      dy = HEXES[i].cy - city.y
    const d = dx * dx + dy * dy
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

// Cities that always show their label regardless of deck count
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

  // Auto-cycle through cities
  useEffect(() => {
    if (isHovering || cities.length === 0) return
    const id = setInterval(
      () => setActiveIdx((i) => (i + 1) % cities.length),
      2800,
    )
    return () => clearInterval(id)
  }, [isHovering, cities.length])

  const handleHover = useCallback((i: number) => setActiveIdx(i), [])

  // Map each city to its nearest hex index
  const cityHexIdx = useMemo(() => cities.map((c) => nearestHex(c)), [cities])

  // Set of hex indices that are city pins (so we skip them in the base layer)
  const hexToCity = useMemo(() => {
    const m = new Map<number, number>()
    cityHexIdx.forEach((idx, ci) => m.set(idx, ci))
    return m
  }, [cityHexIdx])

  // Heat per hex: weighted sum of nearby cities' deck counts
  const heatByHex = useMemo(() => {
    const arr = new Array(HEXES.length).fill(0) as number[]
    const SIGMA2 = 90 * 90
    for (let i = 0; i < HEXES.length; i++) {
      const h = HEXES[i]
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

  // Sort city indices so active renders last (on top)
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
            <stop offset="0%" stopColor="#1a0f3a" />
            <stop offset="100%" stopColor="#0b0418" />
          </radialGradient>
          <filter id="hex-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={4} />
          </filter>
        </defs>

        {/* Background */}
        <rect width={900} height={480} fill="url(#hex-bg)" />

        {/* Heat-colored hex grid */}
        <g>
          {HEXES.map((h, i) => {
            if (hexToCity.has(i)) return null
            const t = heatByHex[i]
            // CA: violet ramp; US: teal/emerald ramp
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
            const h = HEXES[hIdx]
            if (!h) return null
            const isActive = activeIdx === i
            return (
              <g
                key={i}
                onMouseEnter={() => handleHover(i)}
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
        {activeIdx >= 0 && HEXES[cityHexIdx[activeIdx]] && (
          <circle
            cx={HEXES[cityHexIdx[activeIdx]].cx}
            cy={HEXES[cityHexIdx[activeIdx]].cy}
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
          const h = HEXES[cityHexIdx[i]]
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
        </div>
      )}
    </div>
  )
}
