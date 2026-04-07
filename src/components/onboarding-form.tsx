'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { updateUser, isUsernameAvailable } from '@/lib/services/users'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CityAutocomplete } from '@/components/ui/city-autocomplete'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

export function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      setError(
        'Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores.',
      )
      setLoading(false)
      return
    }

    // Check username availability
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

    const { error: updateError } = await updateUser(userId, {
      username,
      city,
      province,
    })

    if (updateError) {
      setError(updateError)
      setLoading(false)
      return
    }

    router.push('/decks')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left branding panel */}
      <div className="hidden flex-1 flex-col justify-center bg-gradient-to-br from-purple-900/20 via-black to-black p-12 lg:flex">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-2xl font-bold"
        >
          <Image
            src="/logo.png"
            alt="DeckShark"
            width={36}
            height={36}
            className="h-9 w-auto"
            priority
          />
          DeckShark<span className="text-primary">.gg</span>
        </Link>
        <h2 className="text-3xl leading-tight font-black">
          Almost there!
          <br />
          <span className="text-primary">Set up your profile</span>
        </h2>
        <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
          Your username and location help traders find you. After this, you can
          browse decks, list your own, and start proposing trades.
        </p>
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm text-white/80">Account created</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
              2
            </div>
            <span className="text-sm font-medium text-white">
              Complete your profile
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
              3
            </div>
            <span className="text-muted-foreground text-sm">Start trading</span>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <Link
              href="/"
              className="flex items-center gap-2 text-2xl font-bold"
            >
              <Image
                src="/logo.png"
                alt="DeckShark"
                width={32}
                height={32}
                className="h-8 w-auto"
                priority
              />
              DeckShark<span className="text-primary">.gg</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold">Complete your profile</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            Tell us a bit about yourself so traders can find you.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={30}
                  className="h-11"
                />
                <p className="text-muted-foreground text-xs">
                  3-30 characters. Letters, numbers, hyphens, underscores.
                </p>
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
              <div className="space-y-2">
                <Label htmlFor="province">Province / Territory</Label>
                <Select value={province} onValueChange={setProvince} required>
                  <SelectTrigger id="province" className="h-11">
                    <SelectValue placeholder="Select province" />
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
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !province}
              >
                {loading ? 'Saving...' : 'Continue'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
