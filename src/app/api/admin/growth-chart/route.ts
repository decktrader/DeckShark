import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getGrowthChartData,
  getGrowthMetrics,
  type ChartRange,
  type GrowthPeriod,
} from '@/lib/services/admin.server'

const VALID_RANGES = new Set(['7d', '30d', '90d', '1y'])
const RANGE_TO_PERIOD: Record<string, GrowthPeriod> = {
  '7d': 'week',
  '30d': 'month',
  '90d': 'month',
  '1y': 'year',
}

export async function GET(request: NextRequest) {
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

  const range = request.nextUrl.searchParams.get('range') ?? '30d'
  if (!VALID_RANGES.has(range))
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 })

  const [chartResult, metricsResult] = await Promise.all([
    getGrowthChartData(range as ChartRange),
    getGrowthMetrics(RANGE_TO_PERIOD[range]),
  ])

  if (chartResult.error)
    return NextResponse.json({ error: chartResult.error }, { status: 500 })

  return NextResponse.json({
    chart: chartResult.data,
    totals: metricsResult.data,
  })
}
