'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  suspendUserAction,
  liftSuspensionAction,
} from '@/app/(admin)/admin/actions'

export function SuspendUserForm({
  userId,
  username,
  isSuspended,
  suspensionId,
}: {
  userId: string
  username: string
  isSuspended: boolean
  suspensionId?: string
}) {
  const [showForm, setShowForm] = useState(false)

  if (isSuspended && suspensionId) {
    return (
      <form action={liftSuspensionAction}>
        <input type="hidden" name="suspensionId" value={suspensionId} />
        <Button type="submit" variant="outline" size="sm">
          Lift suspension
        </Button>
      </form>
    )
  }

  if (!showForm) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setShowForm(true)}>
        Suspend {username}
      </Button>
    )
  }

  return (
    <form action={suspendUserAction} className="space-y-3">
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label className="text-sm font-medium">
          Reason <span className="text-red-400">*</span>
        </label>
        <input
          name="reason"
          required
          className="bg-muted border-input mt-1 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Why is this user being suspended?"
        />
      </div>
      <div>
        <label className="text-sm font-medium">
          Expires (optional — leave blank for permanent)
        </label>
        <input
          name="expiresAt"
          type="date"
          className="bg-muted border-input mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm">
          Confirm suspension
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
