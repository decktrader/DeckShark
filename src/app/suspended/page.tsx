import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function SuspendedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let reason = 'Your account has been suspended.'
  let expiresAt: string | null = null

  if (user) {
    const { data: suspension } = await supabase
      .from('user_suspensions')
      .select('reason, expires_at')
      .eq('user_id', user.id)
      .is('lifted_at', null)
      .order('suspended_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (suspension) {
      reason = suspension.reason
      expiresAt = suspension.expires_at
    }
  }

  return (
    <main className="container mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <span className="text-3xl">⛔</span>
      </div>
      <h1 className="text-2xl font-black">Account Suspended</h1>
      <p className="text-muted-foreground mt-3 leading-relaxed">{reason}</p>
      {expiresAt && (
        <p className="text-muted-foreground mt-2 text-sm">
          Suspension expires:{' '}
          {new Date(expiresAt).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}
      <p className="text-muted-foreground mt-6 text-sm">
        If you believe this is a mistake, contact us at{' '}
        <a
          href="mailto:support@deckshark.gg"
          className="text-primary underline"
        >
          support@deckshark.gg
        </a>
      </p>
      <div className="mt-6">
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  )
}
