import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getBulkDataUrl,
  priceToCents,
  getImageUris,
  type ScryfallCard,
} from '@/lib/scryfall/api'

// Use service role key for cron — bypasses RLS
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, serviceKey)
}

// Vercel cron auth — verify the request is from Vercel
function isAuthorized(request: Request): boolean {
  // In development, allow all requests
  if (process.env.NODE_ENV === 'development') return true

  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bulkUrl = await getBulkDataUrl()
  if (!bulkUrl) {
    return NextResponse.json(
      { error: 'Failed to get bulk data URL from Scryfall' },
      { status: 502 },
    )
  }

  // Stream and process the bulk data
  const res = await fetch(bulkUrl)
  if (!res.ok || !res.body) {
    return NextResponse.json(
      { error: 'Failed to download bulk data' },
      { status: 502 },
    )
  }

  const cards: ScryfallCard[] = await res.json()

  // Filter to paper cards only (skip digital-only, tokens, etc.)
  const paperCards = cards.filter(
    (card) =>
      card.legalities &&
      card.name &&
      !card.type_line?.includes('Token') &&
      card.set !== 'cmb1' &&
      card.set !== 'cmb2',
  )

  const supabase = createAdminClient()
  const BATCH_SIZE = 500
  let upserted = 0
  let errors = 0

  for (let i = 0; i < paperCards.length; i += BATCH_SIZE) {
    const batch = paperCards.slice(i, i + BATCH_SIZE)
    const rows = batch.map((card) => {
      const images = getImageUris(card)
      return {
        scryfall_id: card.id,
        oracle_id: card.oracle_id,
        name: card.name,
        mana_cost: card.mana_cost ?? null,
        type_line: card.type_line ?? null,
        color_identity: card.color_identity,
        set_code: card.set,
        image_uri_normal: images.normal,
        image_uri_small: images.small,
        image_uri_art_crop: images.art_crop,
        price_usd_cents: priceToCents(card.prices.usd),
        price_usd_foil_cents: priceToCents(card.prices.usd_foil),
        legalities: card.legalities,
        updated_at: new Date().toISOString(),
      }
    })

    const { error } = await supabase
      .from('card_cache')
      .upsert(rows, { onConflict: 'scryfall_id' })

    if (error) {
      errors++
      console.error(`Batch ${i / BATCH_SIZE} failed:`, error.message)
    } else {
      upserted += rows.length
    }
  }

  return NextResponse.json({
    success: true,
    total_scryfall: cards.length,
    filtered: paperCards.length,
    upserted,
    errors,
  })
}
