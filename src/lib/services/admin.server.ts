import { createClient } from '@/lib/supabase/server'
import type {
  AdminStats,
  Report,
  ReportStatus,
  Feedback,
  FeedbackStatus,
  User,
  UserSuspension,
  ServiceResponse,
} from '@/types'

// ── Stats ──────────────────────────────────────────────

export async function getAdminStats(): Promise<ServiceResponse<AdminStats>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_stats')
  if (error) return { data: null, error: error.message }
  return { data: data as AdminStats, error: null }
}

export interface GrowthRow {
  date: string
  count: number
}

export async function getGrowthData(
  table: 'users' | 'decks' | 'trades',
  days = 30,
): Promise<ServiceResponse<GrowthRow[]>> {
  const supabase = await createClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from(table)
    .select('created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }

  // Aggregate by date
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const date = row.created_at.slice(0, 10)
    counts[date] = (counts[date] ?? 0) + 1
  }

  const rows: GrowthRow[] = Object.entries(counts).map(([date, count]) => ({
    date,
    count,
  }))
  return { data: rows, error: null }
}

export async function getGeographicDistribution(): Promise<
  ServiceResponse<{ province: string; count: number }[]>
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('province')
    .not('province', 'is', null)

  if (error) return { data: null, error: error.message }

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    if (row.province) {
      counts[row.province] = (counts[row.province] ?? 0) + 1
    }
  }

  const rows = Object.entries(counts)
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count)

  return { data: rows, error: null }
}

// ── Users ──────────────────────────────────────────────

export interface AdminUser extends User {
  email?: string
  deck_count?: number
}

export async function getAdminUsers(options: {
  page?: number
  pageSize?: number
  search?: string
}): Promise<ServiceResponse<{ users: AdminUser[]; total: number }>> {
  const supabase = await createClient()
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (options.search) {
    query = query.or(
      `username.ilike.%${options.search}%,city.ilike.%${options.search}%`,
    )
  }

  const { data, error, count } = await query
  if (error) return { data: null, error: error.message }
  return {
    data: { users: (data ?? []) as AdminUser[], total: count ?? 0 },
    error: null,
  }
}

export async function getAdminUser(
  userId: string,
): Promise<ServiceResponse<AdminUser>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as AdminUser, error: null }
}

// ── Suspensions ────────────────────────────────────────

export async function suspendUser(
  userId: string,
  adminId: string,
  reason: string,
  expiresAt?: string,
): Promise<ServiceResponse<UserSuspension>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_suspensions')
    .insert({
      user_id: userId,
      suspended_by: adminId,
      reason,
      expires_at: expiresAt ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as UserSuspension, error: null }
}

export async function liftSuspension(
  suspensionId: string,
  adminId: string,
): Promise<ServiceResponse<UserSuspension>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_suspensions')
    .update({ lifted_at: new Date().toISOString(), lifted_by: adminId })
    .eq('id', suspensionId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as UserSuspension, error: null }
}

export async function getActiveSuspension(
  userId: string,
): Promise<ServiceResponse<UserSuspension | null>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_suspensions')
    .select('*')
    .eq('user_id', userId)
    .is('lifted_at', null)
    .order('suspended_at', { ascending: false })
    .limit(1)

  if (error) return { data: null, error: error.message }
  const suspension = (data?.[0] as UserSuspension) ?? null
  // Check if expired
  if (suspension?.expires_at && new Date(suspension.expires_at) < new Date()) {
    return { data: null, error: null }
  }
  return { data: suspension, error: null }
}

// ── Reports ────────────────────────────────────────────

export interface ReportWithReporter extends Report {
  reporter: { username: string }
}

export async function getReports(options: {
  status?: ReportStatus
  page?: number
  pageSize?: number
}): Promise<ServiceResponse<{ reports: ReportWithReporter[]; total: number }>> {
  const supabase = await createClient()
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('reports')
    .select('*, reporter:users!reporter_id(username)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (options.status) {
    query = query.eq('status', options.status)
  }

  const { data, error, count } = await query
  if (error) return { data: null, error: error.message }
  return {
    data: {
      reports: (data ?? []) as ReportWithReporter[],
      total: count ?? 0,
    },
    error: null,
  }
}

export async function updateReport(
  reportId: string,
  updates: {
    status?: ReportStatus
    admin_notes?: string
    resolved_by?: string
  },
): Promise<ServiceResponse<Report>> {
  const supabase = await createClient()
  const payload: Record<string, unknown> = { ...updates }
  if (updates.status === 'resolved' || updates.status === 'dismissed') {
    payload.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('reports')
    .update(payload)
    .eq('id', reportId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Report, error: null }
}

// ── Feedback ───────────────────────────────────────────

export async function getFeedback(options: {
  status?: FeedbackStatus
  page?: number
  pageSize?: number
}): Promise<ServiceResponse<{ feedback: Feedback[]; total: number }>> {
  const supabase = await createClient()
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('feedback')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (options.status) {
    query = query.eq('status', options.status)
  }

  const { data, error, count } = await query
  if (error) return { data: null, error: error.message }
  return {
    data: { feedback: (data ?? []) as Feedback[], total: count ?? 0 },
    error: null,
  }
}

export async function updateFeedback(
  feedbackId: string,
  updates: { status?: FeedbackStatus; admin_notes?: string },
): Promise<ServiceResponse<Feedback>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feedback')
    .update(updates)
    .eq('id', feedbackId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Feedback, error: null }
}

// ── Trades (admin view) ────────────────────────────────

export interface AdminTrade {
  id: string
  status: string
  cash_difference_cents: number
  message: string | null
  created_at: string
  updated_at: string
  proposer: { id: string; username: string }
  receiver: { id: string; username: string }
}

export async function getAdminTrades(options: {
  status?: string
  page?: number
  pageSize?: number
}): Promise<ServiceResponse<{ trades: AdminTrade[]; total: number }>> {
  const supabase = await createClient()
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('trades')
    .select(
      '*, proposer:users!proposer_id(id, username), receiver:users!receiver_id(id, username)',
      { count: 'exact' },
    )
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (options.status) {
    query = query.eq('status', options.status)
  }

  const { data, error, count } = await query
  if (error) return { data: null, error: error.message }
  return {
    data: { trades: (data ?? []) as AdminTrade[], total: count ?? 0 },
    error: null,
  }
}
