import { describe, it, expect } from 'vitest'
import { parseDecklist, extractCardInfo } from '../text'

describe('extractCardInfo', () => {
  it('extracts set code and collector number', () => {
    const info = extractCardInfo('Arcades, the Strategist (M19) 212')
    expect(info).toEqual({
      name: 'Arcades, the Strategist',
      setCode: 'M19',
      collectorNumber: '212',
    })
  })

  it('extracts set code without collector number', () => {
    const info = extractCardInfo('Lightning Bolt (2XM)')
    expect(info).toEqual({
      name: 'Lightning Bolt',
      setCode: '2XM',
      collectorNumber: undefined,
    })
  })

  it('extracts collector number with # prefix (no set)', () => {
    const info = extractCardInfo('Lightning Bolt #141')
    expect(info).toEqual({
      name: 'Lightning Bolt',
      setCode: undefined,
      collectorNumber: '141',
    })
  })

  it('handles plain card name', () => {
    const info = extractCardInfo('Sol Ring')
    expect(info).toEqual({
      name: 'Sol Ring',
      setCode: undefined,
      collectorNumber: undefined,
    })
  })

  it('strips foil marker', () => {
    const info = extractCardInfo('Lightning Bolt *foil*')
    expect(info).toEqual({
      name: 'Lightning Bolt',
      setCode: undefined,
      collectorNumber: undefined,
    })
  })

  it('strips etched marker', () => {
    const info = extractCardInfo('Sol Ring *etched*')
    expect(info).toEqual({
      name: 'Sol Ring',
      setCode: undefined,
      collectorNumber: undefined,
    })
  })

  it('handles lowercase set codes', () => {
    const info = extractCardInfo('Sol Ring (cmr) 472')
    expect(info).toEqual({
      name: 'Sol Ring',
      setCode: 'CMR',
      collectorNumber: '472',
    })
  })

  it('handles collector numbers with letter suffix', () => {
    const info = extractCardInfo('Forest (UST) 216a')
    expect(info).toEqual({
      name: 'Forest',
      setCode: 'UST',
      collectorNumber: '216a',
    })
  })
})

describe('parseDecklist', () => {
  it('parses "Nx Card Name" format', () => {
    const result = parseDecklist('4x Lightning Bolt\n2x Counterspell')
    expect(result.cards).toEqual([
      {
        name: 'Lightning Bolt',
        quantity: 4,
        isCommander: false,
        setCode: undefined,
        collectorNumber: undefined,
      },
      {
        name: 'Counterspell',
        quantity: 2,
        isCommander: false,
        setCode: undefined,
        collectorNumber: undefined,
      },
    ])
    expect(result.errors).toHaveLength(0)
  })

  it('parses "N Card Name" format (no x)', () => {
    const result = parseDecklist('4 Lightning Bolt\n1 Sol Ring')
    expect(result.cards).toEqual([
      {
        name: 'Lightning Bolt',
        quantity: 4,
        isCommander: false,
        setCode: undefined,
        collectorNumber: undefined,
      },
      {
        name: 'Sol Ring',
        quantity: 1,
        isCommander: false,
        setCode: undefined,
        collectorNumber: undefined,
      },
    ])
  })

  it('parses bare card names as quantity 1', () => {
    const result = parseDecklist('Lightning Bolt\nSol Ring')
    expect(result.cards).toEqual([
      {
        name: 'Lightning Bolt',
        quantity: 1,
        isCommander: false,
        setCode: undefined,
        collectorNumber: undefined,
      },
      {
        name: 'Sol Ring',
        quantity: 1,
        isCommander: false,
        setCode: undefined,
        collectorNumber: undefined,
      },
    ])
  })

  it('parses COMMANDER: prefix', () => {
    const result = parseDecklist(
      "COMMANDER: Atraxa, Praetors' Voice\n1x Sol Ring",
    )
    expect(result.cards[0]).toEqual({
      name: "Atraxa, Praetors' Voice",
      quantity: 1,
      isCommander: true,
      setCode: undefined,
      collectorNumber: undefined,
    })
    expect(result.cards[1].isCommander).toBe(false)
  })

  it('parses COMMANDER section header', () => {
    const result = parseDecklist(
      "Commander\nAtraxa, Praetors' Voice\n\nDeck\n1x Sol Ring",
    )
    expect(result.cards[0]).toEqual({
      name: "Atraxa, Praetors' Voice",
      quantity: 1,
      isCommander: true,
      setCode: undefined,
      collectorNumber: undefined,
    })
    expect(result.cards[1].isCommander).toBe(false)
  })

  it('skips section headers', () => {
    const result = parseDecklist(
      'Mainboard\n1x Sol Ring\nSideboard\n1x Pyroblast',
    )
    expect(result.cards).toHaveLength(2)
    expect(result.cards[0].name).toBe('Sol Ring')
    expect(result.cards[1].name).toBe('Pyroblast')
  })

  it('skips comment lines', () => {
    const result = parseDecklist('// My deck\n# Another comment\n1x Sol Ring')
    expect(result.cards).toHaveLength(1)
    expect(result.cards[0].name).toBe('Sol Ring')
  })

  it('skips empty lines', () => {
    const result = parseDecklist('1x Sol Ring\n\n\n1x Lightning Bolt')
    expect(result.cards).toHaveLength(2)
  })

  it('extracts set codes from card lines', () => {
    const result = parseDecklist('1x Lightning Bolt (2XM)')
    expect(result.cards[0].name).toBe('Lightning Bolt')
    expect(result.cards[0].setCode).toBe('2XM')
  })

  it('extracts set code and collector number', () => {
    const result = parseDecklist('1 Arcades, the Strategist (M19) 212')
    expect(result.cards[0]).toEqual({
      name: 'Arcades, the Strategist',
      quantity: 1,
      isCommander: false,
      setCode: 'M19',
      collectorNumber: '212',
    })
  })

  it('extracts collector numbers with # prefix', () => {
    const result = parseDecklist('1x Lightning Bolt #141')
    expect(result.cards[0].name).toBe('Lightning Bolt')
    expect(result.cards[0].collectorNumber).toBe('141')
  })

  it('strips foil markers', () => {
    const result = parseDecklist('1x Lightning Bolt *foil*')
    expect(result.cards[0].name).toBe('Lightning Bolt')
  })

  it('returns empty for empty input', () => {
    const result = parseDecklist('')
    expect(result.cards).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })
})
