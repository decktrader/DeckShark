'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function FeedbackForm() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)

    const form = new FormData(e.currentTarget)
    const category = form.get('category') as string
    const message = form.get('message') as string

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      category,
      message,
      page_url: window.location.href,
      page_route: window.location.pathname,
      user_agent: navigator.userAgent,
    })

    setSubmitting(false)
    setDone(true)
    setTimeout(() => {
      setOpen(false)
      setDone(false)
    }, 3000)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground text-xs underline"
      >
        Send feedback
      </button>
    )
  }

  if (done) {
    return <p className="text-sm text-emerald-400">Thanks for the feedback!</p>
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-white/5 p-4">
      <p className="mb-3 text-sm font-bold">Send feedback</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select
          name="category"
          required
          className="bg-muted border-input w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="general">General</option>
          <option value="bug">Bug report</option>
          <option value="feature">Feature request</option>
        </select>
        <textarea
          name="message"
          required
          placeholder="What's on your mind?"
          rows={3}
          className="bg-muted border-input w-full rounded-md border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send'}
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
