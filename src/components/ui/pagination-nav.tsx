import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PaginationNavProps {
  page: number
  totalPages: number
  buildUrl: (page: number) => string
}

export function PaginationNav({
  page,
  totalPages,
  buildUrl,
}: PaginationNavProps) {
  if (totalPages <= 1) return null

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Button variant="outline" size="default" asChild>
          <Link href={buildUrl(page - 1)}>← Previous</Link>
        </Button>
      ) : (
        <Button variant="outline" size="default" disabled>
          ← Previous
        </Button>
      )}
      <span className="text-muted-foreground text-sm">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Button variant="outline" size="default" asChild>
          <Link href={buildUrl(page + 1)}>Next →</Link>
        </Button>
      ) : (
        <Button variant="outline" size="default" disabled>
          Next →
        </Button>
      )}
    </div>
  )
}
