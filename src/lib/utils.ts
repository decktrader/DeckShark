import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(value: string): boolean {
  return UUID_RE.test(value)
}

export function formatPrice(
  cents: number | null,
  options?: { decimals?: boolean },
): string {
  if (cents === null || cents === 0) return '—'
  const decimals = options?.decimals ?? true
  return decimals
    ? `$${(cents / 100).toFixed(2)}`
    : `$${Math.round(cents / 100).toLocaleString()}`
}
