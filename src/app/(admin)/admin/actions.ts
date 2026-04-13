'use server'

import { createClient } from '@/lib/supabase/server'
import {
  suspendUser,
  liftSuspension,
  updateReport,
  updateFeedback,
} from '@/lib/services/admin.server'
import type { ReportStatus, FeedbackStatus } from '@/types'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('Not authorized')
  return user.id
}

export async function suspendUserAction(formData: FormData): Promise<void> {
  const adminId = await requireAdmin()
  const userId = formData.get('userId') as string
  const reason = formData.get('reason') as string
  const expiresAt = formData.get('expiresAt') as string | null

  if (!userId || !reason) return

  await suspendUser(userId, adminId, reason, expiresAt || undefined)
  revalidatePath(`/admin/users/${userId}`)
}

export async function liftSuspensionAction(formData: FormData): Promise<void> {
  const adminId = await requireAdmin()
  const suspensionId = formData.get('suspensionId') as string

  if (!suspensionId) return

  await liftSuspension(suspensionId, adminId)
  revalidatePath('/admin/users')
}

export async function updateReportAction(formData: FormData): Promise<void> {
  const adminId = await requireAdmin()
  const reportId = formData.get('reportId') as string
  const status = formData.get('status') as ReportStatus
  const adminNotes = formData.get('adminNotes') as string | null

  if (!reportId || !status) return

  await updateReport(reportId, {
    status,
    admin_notes: adminNotes || undefined,
    resolved_by:
      status === 'resolved' || status === 'dismissed' ? adminId : undefined,
  })
  revalidatePath('/admin/reports')
}

export async function updateFeedbackAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const feedbackId = formData.get('feedbackId') as string
  const status = formData.get('status') as FeedbackStatus
  const adminNotes = formData.get('adminNotes') as string | null

  if (!feedbackId || !status) return

  await updateFeedback(feedbackId, {
    status,
    admin_notes: adminNotes || undefined,
  })
  revalidatePath('/admin/feedback')
}
