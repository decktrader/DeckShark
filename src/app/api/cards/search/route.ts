import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getIp, searchLimiter } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const { success } = await checkRateLimit(searchLimiter, getIp(req))
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 },
    )
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const type = req.nextUrl.searchParams.get('type') ?? ''
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get('limit') ?? '10', 10),
    20,
  )

  if (q.length < 2) return NextResponse.json([])

  const supabase = await createClient()

  let query = supabase.from('card_cache').select('name').ilike('name', `%${q}%`)

  // Filter to legendary creatures (commanders) if requested
  if (type === 'commander') {
    query = query
      .ilike('type_line', '%Legendary%')
      .ilike('type_line', '%Creature%')
  }

  const { data } = await query.limit(limit)

  // Deduplicate by name (multiple printings)
  const names = [...new Set((data ?? []).map((c) => c.name as string))]

  return NextResponse.json(names)
}
