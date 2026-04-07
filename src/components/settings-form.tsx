'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateUser, isUsernameAvailable } from '@/lib/services/users'
import { createClient } from '@/lib/supabase/client'
import type { User, NotificationPreferences } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CityAutocomplete } from '@/components/ui/city-autocomplete'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' },
] as const

function AvatarUpload({
  user,
  onUpload,
}: {
  user: User
  onUpload: (url: string | null) => void
}) {
  const [preview, setPreview] = useState<string | null>(user.avatar_url)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const initials = user.username.slice(0, 2).toUpperCase()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (error) {
      setUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(path)

    // Append cache-buster so the browser fetches the new image
    const url = `${publicUrl}?t=${Date.now()}`
    setPreview(url)
    onUpload(url)

    // Save to database immediately so it persists without form submit
    await updateUser(user.id, { avatar_url: url })
    setUploading(false)
  }

  async function handleRemove() {
    setPreview(null)
    onUpload(null)
    await updateUser(user.id, { avatar_url: null })
  }

  return (
    <div className="flex flex-col items-center">
      <div className="group relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={preview ?? undefined} alt={user.username} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <svg
            className="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <div className="mt-2 text-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-primary text-xs font-medium hover:underline"
        >
          {uploading
            ? 'Uploading...'
            : preview
              ? 'Change photo'
              : 'Upload photo'}
        </button>
        {preview && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-muted-foreground ml-2 text-xs hover:underline"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

export function SettingsForm({ user }: { user: User }) {
  const router = useRouter()
  const [username, setUsername] = useState(user.username)
  const [bio, setBio] = useState(user.bio ?? '')
  const [city, setCity] = useState(user.city ?? '')
  const [province, setProvince] = useState(user.province ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    user.notification_preferences ?? {
      trade_updates: true,
      want_list_matches: true,
    },
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      setError(
        'Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores.',
      )
      setLoading(false)
      return
    }

    if (username !== user.username) {
      const { data: available, error: checkError } =
        await isUsernameAvailable(username)
      if (checkError) {
        setError(checkError)
        setLoading(false)
        return
      }
      if (!available) {
        setError('That username is already taken.')
        setLoading(false)
        return
      }
    }

    const { error: updateError } = await updateUser(user.id, {
      username,
      bio: bio || null,
      city,
      province,
      avatar_url: avatarUrl,
      notification_preferences: notifPrefs,
    })

    if (updateError) {
      setError(updateError)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      {/* Left sidebar — avatar + stats */}
      <div className="shrink-0 sm:sticky sm:top-24 sm:w-56 sm:self-start">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-white/5 p-5">
            <div className="flex flex-col items-center">
              <AvatarUpload user={user} onUpload={setAvatarUrl} />
              <h2 className="mt-2 font-bold">{user.username}</h2>
              {user.city && user.province && (
                <p className="text-muted-foreground text-xs">
                  {user.city}, {user.province}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 p-4">
            <div className="grid w-full grid-cols-3 text-center text-sm">
              <div>
                <p className="font-bold">{user.completed_trades}</p>
                <p className="text-muted-foreground text-xs">Trades</p>
              </div>
              <div>
                <p className="font-bold">
                  {user.completed_trades > 0
                    ? Number(user.trade_rating).toFixed(1)
                    : '—'}
                </p>
                <p className="text-muted-foreground text-xs">Rating</p>
              </div>
              <div>
                <p className="text-xs font-bold">{joinedDate}</p>
                <p className="text-muted-foreground text-xs">Joined</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form cards */}
      <div className="flex-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
            <CardDescription>Your public information.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && <p className="text-destructive text-sm">{error}</p>}
              {success && (
                <p className="text-sm text-green-600">Profile updated.</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <CityAutocomplete
                    id="city"
                    defaultValue={city}
                    onCommit={(v) => setCity(v)}
                    placeholder="Your city"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Province / Territory</Label>
                <Select value={province} onValueChange={setProvince} required>
                  <SelectTrigger id="province" className="sm:w-1/2">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell other traders about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={300}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading || !province}>
                {loading ? 'Saving...' : 'Save profile'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/5 px-4 py-3 transition-colors hover:bg-white/[2%]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <svg
                    className="h-4 w-4 text-violet-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Trade updates</p>
                  <p className="text-muted-foreground text-xs">
                    Proposed, accepted, declined, completed
                  </p>
                </div>
              </div>
              <Checkbox
                checked={notifPrefs.trade_updates}
                onCheckedChange={(checked) =>
                  setNotifPrefs((p) => ({
                    ...p,
                    trade_updates: checked === true,
                  }))
                }
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/5 px-4 py-3 transition-colors hover:bg-white/[2%]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <svg
                    className="h-4 w-4 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Want list matches</p>
                  <p className="text-muted-foreground text-xs">
                    When a deck matching your list is posted
                  </p>
                </div>
              </div>
              <Checkbox
                checked={notifPrefs.want_list_matches}
                onCheckedChange={(checked) =>
                  setNotifPrefs((p) => ({
                    ...p,
                    want_list_matches: checked === true,
                  }))
                }
              />
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
