'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function AccountDangerZone() {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (
      !confirm(
        'Are you sure you want to delete your account? This will permanently remove all your decks, trades, and data. This cannot be undone.',
      )
    )
      return

    setDeleting(true)
    const res = await fetch('/api/account/delete', { method: 'DELETE' })

    if (!res.ok) {
      const { error } = await res.json()
      alert(error ?? 'Failed to delete account.')
      setDeleting(false)
      return
    }

    // Sign out locally then redirect
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="border-destructive/50 rounded-lg border p-6">
      <h2 className="mb-1 font-semibold">Danger zone</h2>
      <p className="text-muted-foreground mb-4 text-sm">
        These actions are permanent and cannot be undone.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" asChild>
          <a href="/api/account/export" download>
            Export my data
          </a>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete account'}
        </Button>
      </div>
    </div>
  )
}
