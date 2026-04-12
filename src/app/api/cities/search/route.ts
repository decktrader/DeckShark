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
  if (q.length < 2) return NextResponse.json([])

  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('city')
    .not('city', 'is', null)
    .ilike('city', `%${q}%`)
    .limit(20)

  const cities = [
    ...new Set((data ?? []).map((u) => u.city as string).filter(Boolean)),
  ].slice(0, 8)

  return NextResponse.json(cities)
}
