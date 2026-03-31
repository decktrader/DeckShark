import { Skeleton } from '@/components/ui/skeleton'

export default function TradesLoading() {
  return (
    <main className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Skeleton className="h-8 w-24" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-3 w-56" />
          </div>
        ))}
      </div>
    </main>
  )
}
