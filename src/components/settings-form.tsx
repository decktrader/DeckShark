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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { COUNTRIES, getRegions } from '@/lib/constants'
import { AccountDangerZone } from '@/components/account-danger-zone'

// ─── Avatar Upload ────────────────────────────────────────────────────────────

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

    const url = `${publicUrl}?t=${Date.now()}`
    setPreview(url)
    onUpload(url)

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
          className="text-primary px-2 py-2 text-xs font-medium hover:underline"
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
            className="text-muted-foreground ml-1 px-2 py-2 text-xs hover:underline"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ user }: { user: User }) {
  const router = useRouter()
  const [username, setUsername] = useState(user.username)
  const [bio, setBio] = useState(user.bio ?? '')
  const [country, setCountry] = useState(user.country ?? 'CA')
  const [city, setCity] = useState(user.city ?? '')
  const [province, setProvince] = useState(user.province ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url)
  const [discordUsername, setDiscordUsername] = useState(
    user.discord_username ?? '',
  )
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

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
      country,
      city,
      province,
      avatar_url: avatarUrl,
      discord_username: discordUsername || null,
      phone_number: phoneNumber || null,
    })

    if (updateError) {
      setError(
        updateError.includes('schema cache')
          ? 'Something went wrong. Please try again in a moment.'
          : updateError,
      )
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
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
                    : '\u2014'}
                </p>
                <p className="text-muted-foreground text-xs">Rating</p>
              </div>
              <div>
                <p className="text-xs font-bold">
                  {new Date(user.created_at).toLocaleDateString('en-CA', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </p>
                <p className="text-muted-foreground text-xs">Joined</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
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
              <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={country}
                    onValueChange={(v) => {
                      setCountry(v)
                      setProvince('')
                    }}
                    required
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">
                    {country === 'US' ? 'State' : 'Province / Territory'}
                  </Label>
                  <Select value={province} onValueChange={setProvince} required>
                    <SelectTrigger id="province">
                      <SelectValue
                        placeholder={
                          country === 'US' ? 'Select state' : 'Select province'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {getRegions(country).map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discord">Discord username</Label>
                  <Input
                    id="discord"
                    placeholder="e.g. player#1234"
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    maxLength={50}
                  />
                  <p className="text-muted-foreground text-xs">
                    Shared with trade partners for meetup coordination
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. 604-555-1234"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    maxLength={20}
                  />
                  <p className="text-muted-foreground text-xs">
                    Shared with trade partners for meetup coordination
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading || !province}>
                {loading ? 'Saving...' : 'Save profile'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab({ user }: { user: User }) {
  const router = useRouter()
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    user.notification_preferences ?? {
      trade_updates: true,
      want_list_matches: true,
      review_received: true,
      interest_threshold: true,
    },
  )
  const [emailOptIn, setEmailOptIn] = useState(user.email_updates_opt_in)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSuccess(false)
    await updateUser(user.id, { notification_preferences: notifPrefs })
    setSuccess(true)
    setSaving(false)
    router.refresh()
  }

  const items = [
    {
      key: 'trade_updates' as const,
      label: 'Trade updates',
      desc: 'Proposed, accepted, declined, completed',
      color: 'violet',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      ),
    },
    {
      key: 'want_list_matches' as const,
      label: 'Want list matches',
      desc: 'When a deck matching your list is posted',
      color: 'emerald',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      ),
    },
    {
      key: 'review_received' as const,
      label: 'Reviews',
      desc: 'When someone leaves you a review',
      color: 'yellow',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      ),
    },
    {
      key: 'interest_threshold' as const,
      label: 'Shipping interest',
      desc: 'When traders vote to ship your decks',
      color: 'pink',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      ),
    },
  ]

  const colorMap: Record<string, { bg: string; text: string }> = {
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email notifications</CardTitle>
          <CardDescription>
            Choose which email notifications you receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => {
            const c = colorMap[item.color]
            return (
              <label
                key={item.key}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-white/5 px-4 py-3 transition-colors hover:bg-white/[2%]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}
                  >
                    <svg
                      className={`h-4 w-4 ${c.text}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      {item.icon}
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-muted-foreground text-xs">{item.desc}</p>
                  </div>
                </div>
                <Checkbox
                  checked={notifPrefs[item.key] ?? true}
                  onCheckedChange={(checked) =>
                    setNotifPrefs((p) => ({
                      ...p,
                      [item.key]: checked === true,
                    }))
                  }
                />
              </label>
            )
          })}
        </CardContent>
        <CardFooter className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save preferences'}
          </Button>
          {success && (
            <p className="text-sm text-green-600">Preferences saved.</p>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Marketing emails</CardTitle>
          <CardDescription>
            Occasional updates about new features and local trading activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/5 px-4 py-3 transition-colors hover:bg-white/[2%]">
            <div>
              <p className="text-sm font-medium">Re-engagement emails</p>
              <p className="text-muted-foreground text-xs">
                Featured decks near you and platform updates
              </p>
            </div>
            <Checkbox
              checked={emailOptIn}
              onCheckedChange={async (checked) => {
                const val = checked === true
                setEmailOptIn(val)
                await updateUser(user.id, { email_updates_opt_in: val })
              }}
            />
          </label>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Account Tab ──────────────────────────────────────────────────────────────

function AccountTab({ email, isOAuth }: { email: string; isOAuth: boolean }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser?.email) {
      setError('Could not verify your account.')
      setLoading(false)
      return
    }

    // Verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: currentPassword,
    })

    if (verifyError) {
      setError('Current password is incorrect.')
      setLoading(false)
      return
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email address</CardTitle>
          <CardDescription>
            The email associated with your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-white/5 px-4 py-3">
            <svg
              className="text-muted-foreground h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">{email}</span>
          </div>
        </CardContent>
      </Card>

      {!isOAuth && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change password</CardTitle>
            <CardDescription>
              Update the password you use to sign in.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordChange}>
            <CardContent className="space-y-4">
              {error && <p className="text-destructive text-sm">{error}</p>}
              {success && (
                <p className="text-sm text-green-600">Password updated.</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <AccountDangerZone />
    </div>
  )
}

// ─── Privacy & Data Tab ───────────────────────────────────────────────────────

function PrivacyTab() {
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `deckshark-data-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExported(true)
    } catch {
      // silent fail
    }
    setExporting(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export your data</CardTitle>
          <CardDescription>
            Download a copy of all your DeckShark data including your profile,
            decks, trades, reviews, and want lists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting
              ? 'Preparing export...'
              : exported
                ? 'Download again'
                : 'Export my data'}
          </Button>
          {exported && (
            <p className="text-muted-foreground mt-2 text-xs">
              Your data has been downloaded as a JSON file.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Privacy</CardTitle>
          <CardDescription>
            How your information is used on DeckShark.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-3 text-sm">
          <p>
            Your public profile (username, city, state/province, bio, and trade
            history) is visible to all users. Your email, Discord username, and
            phone number are only shared with a trade partner after both parties
            accept a trade and consent to share contact info.
          </p>
          <p>
            We do not sell your personal information to third parties. See our{' '}
            <a href="/privacy" className="text-primary underline">
              Privacy Policy
            </a>{' '}
            for full details.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Settings Form (tabbed) ──────────────────────────────────────────────

export function SettingsForm({
  user,
  email,
  isOAuth = false,
}: {
  user: User
  email: string
  isOAuth?: boolean
}) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="mb-6 w-full overflow-x-auto">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="privacy">Privacy & Data</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileTab user={user} />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationsTab user={user} />
      </TabsContent>

      <TabsContent value="account">
        <AccountTab email={email} isOAuth={isOAuth} />
      </TabsContent>

      <TabsContent value="privacy">
        <PrivacyTab />
      </TabsContent>
    </Tabs>
  )
}
