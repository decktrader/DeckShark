'use client'

import { useState, useEffect, useCallback } from 'react'
import type { HeroCity } from '@/lib/services/hero.server'

// Simplified North America outline for 900x480 viewBox
const NA_PATH = [
  'M 105,180 L 80,150 L 75,120 L 95,100 L 130,90 L 165,85 L 200,90 L 235,95 L 275,100 L 320,105 L 365,110 L 410,108 L 455,108 L 500,105 L 545,103 L 590,105 L 635,110 L 680,115 L 720,125 L 755,140 L 780,160 L 795,185 L 800,210 L 790,235 L 770,250 L 745,255',
  'L 730,260 L 715,275 L 700,290 L 690,305 L 680,320 L 670,340 L 660,360 L 655,380 L 650,400 L 645,420 L 640,440 L 630,460 L 615,470 L 595,460 L 580,445',
  'L 565,455 L 550,455 L 525,455 L 500,455 L 475,455 L 450,460 L 425,460 L 400,460 L 375,455 L 355,460 L 335,455',
  'L 320,450 L 300,445 L 275,435 L 250,425 L 225,420 L 205,420 L 190,425 L 180,435',
  'L 175,420 L 170,400 L 162,375 L 155,345 L 148,315 L 142,290 L 135,265 L 128,240 L 120,215 L 110,195 Z',
].join(' ')

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
          <radialGradient id="cv-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* North America outline */}
        <path
          d={NA_PATH}
          fill="rgba(124,58,237,0.06)"
          stroke="rgba(167,139,250,0.35)"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />

        {/* Grid lines */}
        <g stroke="rgba(167,139,250,0.08)" strokeWidth={0.5}>
          {[80, 160, 240, 320, 400, 480].map((y) => (
            <line key={`h${y}`} x1={0} y1={y} x2={900} y2={y} />
          ))}
          {[100, 250, 400, 550, 700, 850].map((x) => (
            <line key={`v${x}`} x1={x} y1={0} x2={x} y2={480} />
          ))}
        </g>

        {/* City pins */}
        {cities.map((c, i) => {
          const isActive = activeIdx === i
          const r = Math.max(3, Math.sqrt(c.decks) * 1.5)
          return (
            <g
              key={c.name}
              onMouseEnter={() => handleHover(i)}
              style={{ cursor: 'pointer' }}
            >
              {isActive && (
                <>
                  <circle cx={c.x} cy={c.y} r={40} fill="url(#cv-glow)" />
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={14}
                    fill="none"
                    stroke="#c4b5fd"
                    strokeWidth={1}
                  >
                    <animate
                      attributeName="r"
                      from="8"
                      to="20"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.8"
                      to="0"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </>
              )}
              <circle
                cx={c.x}
                cy={c.y}
                r={r}
                fill={isActive ? '#c4b5fd' : '#8b5cf6'}
                stroke="#0f0820"
                strokeWidth={1.5}
              />
              <text
                x={c.x}
                y={c.y - 14}
                textAnchor="middle"
                fontSize={10}
                fill={isActive ? '#fff' : 'rgba(255,255,255,0.55)'}
                fontWeight={isActive ? 700 : 500}
                style={{ pointerEvents: 'none' }}
              >
                {c.name}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Active city panel */}
      {active && (
        <div
          className="absolute bottom-4 left-4 rounded-[10px] border border-violet-400/30 p-3 px-4 backdrop-blur-[10px]"
          style={{ background: 'rgba(15, 8, 32, 0.92)', minWidth: 180 }}
        >
          <div className="text-[11px] tracking-wider text-violet-300/70 uppercase">
            Active city
          </div>
          <div className="mt-1 text-lg font-bold text-white">{active.name}</div>
          <div className="mt-2 flex gap-4 text-xs">
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

      {/* Hover hint */}
      <div
        className="absolute top-4 right-4 rounded-md px-2.5 py-1.5 text-[11px] text-white/55 backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      >
        Hover any city
      </div>
    </div>
  )
}
