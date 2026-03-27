'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createReview } from '@/lib/services/reviews'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function ReviewForm({
  tradeId,
  reviewerId,
  revieweeId,
  revieweeUsername,
}: {
  tradeId: string
  reviewerId: string
  revieweeId: string
  revieweeUsername: string
}) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!rating) return
    setLoading(true)
    setError(null)
    const { error: err } = await createReview(
      tradeId,
      reviewerId,
      revieweeId,
      rating,
      comment.trim() || undefined,
    )
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      setDone(true)
      router.refresh()
    }
  }

  if (done) {
    return (
      <p className="text-muted-foreground text-sm">
        ✓ Review submitted. Thanks for the feedback!
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Rate your trade with {revieweeUsername}
      </p>

      {/* Star rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="text-2xl transition-transform hover:scale-110"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
          >
            <span
              className={
                star <= (hovered || rating)
                  ? 'text-yellow-400'
                  : 'text-muted-foreground'
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>

      <Textarea
        placeholder="Add a comment (optional)…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        className="w-full"
        disabled={!rating || loading}
        onClick={handleSubmit}
      >
        {loading ? 'Submitting…' : 'Submit review'}
      </Button>
    </div>
  )
}
