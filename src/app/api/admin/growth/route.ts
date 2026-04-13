import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getGrowthMetrics,
  type GrowthPeriod,
} from '@/lib/services/admin.server'

const VALID_PERIODS = new Set(['day', 'week', 'month', 'year'])

export async function GET(request: NextRequest) {
  // Auth + admin check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const period = request.nextUrl.searchParams.get('period') ?? 'month'
  if (!VALID_PERIODS.has(period))
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 })

  const { data, error } = await getGrowthMetrics(period as GrowthPeriod)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}
