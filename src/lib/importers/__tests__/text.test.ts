import { describe, it, expect } from 'vitest'
import { parseDecklist } from '../text'

describe('parseDecklist', () => {
  it('parses "Nx Card Name" format', () => {
    const result = parseDecklist('4x Lightning Bolt\n2x Counterspell')
    expect(result.cards).toEqual([
      { name: 'Lightning Bolt', quantity: 4, isCommander: false },
      { name: 'Counterspell', quantity: 2, isCommander: false },
    ])
    expect(result.errors).toHaveLength(0)
  })

  it('parses "N Card Name" format (no x)', () => {
    const result = parseDecklist('4 Lightning Bolt\n1 Sol Ring')
    expect(result.cards).toEqual([
      { name: 'Lightning Bolt', quantity: 4, isCommander: false },
      { name: 'Sol Ring', quantity: 1, isCommander: false },
    ])
  })

  it('parses bare card names as quantity 1', () => {
    const result = parseDecklist('Lightning Bolt\nSol Ring')
    expect(result.cards).toEqual([
      { name: 'Lightning Bolt', quantity: 1, isCommander: false },
      { name: 'Sol Ring', quantity: 1, isCommander: false },
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

  it('strips set codes in parentheses', () => {
    const result = parseDecklist('1x Lightning Bolt (2XM)')
    expect(result.cards[0].name).toBe('Lightning Bolt')
  })

  it('strips collector numbers', () => {
    const result = parseDecklist('1x Lightning Bolt #141')
    expect(result.cards[0].name).toBe('Lightning Bolt')
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
