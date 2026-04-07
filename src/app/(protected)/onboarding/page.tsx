import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/services/users.server'
import { isOnboardingComplete } from '@/lib/services/users'
import { OnboardingForm } from '@/components/onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: profile } = await getUserById(authUser.id)

  // Already onboarded — go to dashboard
  if (profile && isOnboardingComplete(profile)) {
    redirect('/dashboard')
  }

  return <OnboardingForm userId={authUser.id} />
}
