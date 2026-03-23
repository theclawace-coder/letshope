import { z } from 'zod'

// NDIS number: 9 digits, optionally space-separated as ### ### ###
export const ndisNumberSchema = z
  .string()
  .transform((val) => val.replace(/\s/g, ''))
  .pipe(z.string().regex(/^\d{9}$/, 'NDIS number must be 9 digits'))

// Australian phone number
export const phoneSchema = z
  .string()
  .regex(/^(\+?61|0)[2-478]\d{8}$/, 'Enter a valid Australian phone number')
  .or(z.literal(''))

// ABN: 11 digits
export const abnSchema = z
  .string()
  .transform((val) => val.replace(/\s/g, ''))
  .pipe(z.string().regex(/^\d{11}$/, 'ABN must be 11 digits'))

// Format NDIS number for display: 123456789 -> 123 456 789
export function formatNdisNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}

// Format Australian phone for display
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 4) return digits
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
}

// Format ABN for display: 59677810498 -> 59 677 810 498
export function formatAbn(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
}
