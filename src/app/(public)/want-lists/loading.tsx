import { Skeleton } from '@/components/ui/skeleton'

export default function WantListsLoading() {
  return (
    <main className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-4">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-64" />
          </div>
        ))}
      </div>
    </main>
  )
}
