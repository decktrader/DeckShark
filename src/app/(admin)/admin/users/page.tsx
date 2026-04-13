import Link from 'next/link'
import { getAdminUsers } from '@/lib/services/admin.server'
import { PaginationNav } from '@/components/ui/pagination-nav'

const PAGE_SIZE = 25

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const search = params.q ?? ''

  const { data: result } = await getAdminUsers({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
  })

  const users = result?.users ?? []
  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {total} total user{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <input
          name="q"
          type="text"
          placeholder="Search by username or city..."
          defaultValue={search}
          className="bg-muted border-input flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
        >
          Search
        </button>
      </form>

      {/* Users table */}
      <div className="overflow-hidden rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[2%]">
              <th className="px-4 py-3 text-left font-medium">Username</th>
              <th className="px-4 py-3 text-left font-medium">Location</th>
              <th className="px-4 py-3 text-right font-medium">Trades</th>
              <th className="px-4 py-3 text-right font-medium">Rating</th>
              <th className="px-4 py-3 text-right font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/[2%]">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-primary font-medium hover:underline"
                  >
                    {user.username}
                    {user.is_admin && (
                      <span className="ml-1.5 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                        ADMIN
                      </span>
                    )}
                  </Link>
                </td>
                <td className="text-muted-foreground px-4 py-3">
                  {user.city && user.province
                    ? `${user.city}, ${user.province}`
                    : (user.province ?? '—')}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.completed_trades}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.completed_trades > 0
                    ? Number(user.trade_rating).toFixed(1)
                    : '—'}
                </td>
                <td className="text-muted-foreground px-4 py-3 text-right">
                  {new Date(user.created_at).toLocaleDateString('en-CA')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationNav
        page={page}
        totalPages={totalPages}
        buildUrl={(p) => {
          const qs = new URLSearchParams()
          if (search) qs.set('q', search)
          if (p > 1) qs.set('page', String(p))
          const str = qs.toString()
          return str ? `/admin/users?${str}` : '/admin/users'
        }}
      />
    </div>
  )
}
