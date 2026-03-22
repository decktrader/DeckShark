import { describe, it, expect } from 'vitest'
import { priceToCents, getImageUris, type ScryfallCard } from '../api'

describe('priceToCents', () => {
  it('converts dollar string to cents', () => {
    expect(priceToCents('12.34')).toBe(1234)
  })

  it('handles whole dollar amounts', () => {
    expect(priceToCents('5.00')).toBe(500)
  })

  it('handles sub-dollar amounts', () => {
    expect(priceToCents('0.25')).toBe(25)
  })

  it('rounds to nearest cent', () => {
    expect(priceToCents('1.999')).toBe(200)
  })

  it('returns null for null', () => {
    expect(priceToCents(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(priceToCents(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(priceToCents('')).toBeNull()
  })
})

describe('getImageUris', () => {
  it('returns image_uris for normal cards', () => {
    const card = {
      image_uris: {
        normal: 'https://example.com/normal.jpg',
        small: 'https://example.com/small.jpg',
        art_crop: 'https://example.com/art.jpg',
      },
    } as ScryfallCard

    expect(getImageUris(card)).toEqual({
      normal: 'https://example.com/normal.jpg',
      small: 'https://example.com/small.jpg',
      art_crop: 'https://example.com/art.jpg',
    })
  })

  it('returns front face URIs for double-faced cards', () => {
    const card = {
      card_faces: [
        {
          image_uris: {
            normal: 'https://example.com/front.jpg',
            small: 'https://example.com/front-small.jpg',
            art_crop: 'https://example.com/front-art.jpg',
          },
        },
        {
          image_uris: {
            normal: 'https://example.com/back.jpg',
          },
        },
      ],
    } as ScryfallCard

    expect(getImageUris(card)).toEqual({
      normal: 'https://example.com/front.jpg',
      small: 'https://example.com/front-small.jpg',
      art_crop: 'https://example.com/front-art.jpg',
    })
  })

  it('returns nulls when no images available', () => {
    const card = {} as ScryfallCard
    expect(getImageUris(card)).toEqual({
      normal: null,
      small: null,
      art_crop: null,
    })
  })
})
