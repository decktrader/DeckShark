'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { ReportTargetType } from '@/types'

const REASONS: Record<ReportTargetType, string[]> = {
  user: [
    'Suspicious account',
    'Harassment',
    'Scam / fraud',
    'Inappropriate content',
    'Other',
  ],
  deck: [
    'Inaccurate pricing',
    'Misleading description',
    'Inappropriate content',
    'Suspected scam',
    'Other',
  ],
  trade: ['Unfair trade', 'User not responding', 'Suspected scam', 'Other'],
}

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: ReportTargetType
  targetId: string
}) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)

    const form = new FormData(e.currentTarget)
    const reason = form.get('reason') as string
    const description = form.get('description') as string

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSubmitting(false)
      return
    }

    await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      description: description || null,
    })

    setSubmitting(false)
    setDone(true)
    setTimeout(() => {
      setOpen(false)
      setDone(false)
    }, 2000)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-ink-3 hover:text-terra-deep text-xs underline"
      >
        Report this listing
      </button>
    )
  }

  if (done) {
    return (
      <div className="border-line rounded-lg border bg-white p-4">
        <p className="text-teal-deep text-sm">Report submitted. Thank you.</p>
      </div>
    )
  }

  return (
    <div className="border-line rounded-lg border bg-white p-4 text-left">
      <p className="text-ink mb-3 text-sm font-bold">
        Report this {targetType}
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select
          name="reason"
          required
          className="border-line text-ink w-full rounded-md border bg-white px-3 py-2 text-sm"
        >
          <option value="">Select a reason...</option>
          {REASONS[targetType].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <textarea
          name="description"
          placeholder="Additional details (optional)"
          rows={3}
          className="border-line text-ink w-full rounded-md border bg-white px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit report'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
