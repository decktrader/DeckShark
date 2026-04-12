import { NextRequest, NextResponse } from 'next/server'
import { importFromMoxfield, extractMoxfieldId } from '@/lib/importers/moxfield'
import {
  importFromArchidekt,
  extractArchidektId,
} from '@/lib/importers/archidekt'
import { checkRateLimit, getIp, mutationLimiter } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const { success } = await checkRateLimit(mutationLimiter, getIp(req))
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 },
    )
  }

  const { url } = await req.json()

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  if (extractMoxfieldId(url)) {
    const result = await importFromMoxfield(url)
    return NextResponse.json(result)
  }

  if (extractArchidektId(url)) {
    const result = await importFromArchidekt(url)
    return NextResponse.json(result)
  }

  return NextResponse.json(
    {
      error:
        'Unsupported URL. Paste a Moxfield (moxfield.com/decks/...) or Archidekt (archidekt.com/decks/...) link.',
    },
    { status: 400 },
  )
}
