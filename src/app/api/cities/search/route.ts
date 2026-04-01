import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
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
