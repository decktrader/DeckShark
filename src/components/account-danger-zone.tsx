'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export function AccountDangerZone() {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOAuth, setIsOAuth] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.app_metadata?.provider !== 'email') {
        setIsOAuth(true)
      }
    })
  }, [])

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()

    if (isOAuth) {
      if (confirmation !== 'DELETE') {
        setError('Type DELETE to confirm.')
        return
      }
    } else {
      if (!password.trim()) {
        setError('Enter your password to confirm.')
        return
      }
    }

    setDeleting(true)
    setError(null)

    const res = await fetch('/api/account/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isOAuth ? { confirmation } : { password }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg ?? 'Failed to delete account.')
      setDeleting(false)
      return
    }

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
        {!showConfirm ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowConfirm(true)}
          >
            Delete account
          </Button>
        ) : (
          <form onSubmit={handleDelete} className="w-full space-y-3 pt-3">
            <div className="border-destructive/30 rounded-md border p-4">
              {isOAuth ? (
                <>
                  <p className="mb-3 text-sm font-medium">
                    Type <strong>DELETE</strong> to permanently delete your
                    account and all data.
                  </p>
                  <Label htmlFor="delete-confirm" className="sr-only">
                    Type DELETE to confirm
                  </Label>
                  <Input
                    id="delete-confirm"
                    type="text"
                    placeholder='Type "DELETE"'
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    autoFocus
                  />
                </>
              ) : (
                <>
                  <p className="mb-3 text-sm font-medium">
                    Enter your password to permanently delete your account and
                    all data.
                  </p>
                  <Label htmlFor="delete-password" className="sr-only">
                    Password
                  </Label>
                  <Input
                    id="delete-password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </>
              )}
              {error && (
                <p className="text-destructive mt-2 text-sm">{error}</p>
              )}
              <div className="mt-3 flex gap-2">
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Confirm delete'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowConfirm(false)
                    setPassword('')
                    setConfirmation('')
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
