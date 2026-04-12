import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  // Check Supabase connectivity
  let dbStatus: 'ok' | 'error' = 'error'
  let dbLatencyMs = 0
  let dbError: string | undefined

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const dbStart = Date.now()
    const { error } = await supabase
      .from('card_cache')
      .select('scryfall_id')
      .limit(1)
      .single()

    dbLatencyMs = Date.now() - dbStart

    // PGRST116 = "no rows" which is fine — the query still reached the DB
    if (!error || error.code === 'PGRST116') {
      dbStatus = 'ok'
    } else {
      dbError = error.message
    }
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Unknown error'
  }

  const healthy = dbStatus === 'ok'

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      latencyMs: Date.now() - start,
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          ...(dbError && { error: dbError }),
        },
      },
    },
    { status: healthy ? 200 : 503 },
  )
}
