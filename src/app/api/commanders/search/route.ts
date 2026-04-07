import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const supabase = await createClient()

  // Search both commander and partner commander names
  const { data: primary } = await supabase
    .from('decks')
    .select('commander_name')
    .not('commander_name', 'is', null)
    .ilike('commander_name', `%${q}%`)
    .eq('available_for_trade', true)
    .eq('status', 'active')
    .limit(20)

  const { data: partners } = await supabase
    .from('decks')
    .select('partner_commander_name')
    .not('partner_commander_name', 'is', null)
    .ilike('partner_commander_name', `%${q}%`)
    .eq('available_for_trade', true)
    .eq('status', 'active')
    .limit(20)

  const names = [
    ...new Set([
      ...(primary ?? []).map((d) => d.commander_name as string).filter(Boolean),
      ...(partners ?? [])
        .map((d) => d.partner_commander_name as string)
        .filter(Boolean),
    ]),
  ].slice(0, 10)

  return NextResponse.json(names)
}
