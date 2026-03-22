import { createClient } from '@/lib/supabase/client'
import type { ServiceResponse } from '@/types'

const BUCKET = 'deck-photos'

export async function uploadDeckPhoto(
  userId: string,
  deckId: string,
  file: File,
): Promise<ServiceResponse<string>> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${deckId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file)

  if (error) return { data: null, error: error.message }
  return { data: path, error: null }
}

export function getDeckPhotoUrl(storagePath: string): string {
  const supabase = createClient()
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return publicUrl
}

export async function deleteDeckPhoto(
  storagePath: string,
): Promise<ServiceResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
