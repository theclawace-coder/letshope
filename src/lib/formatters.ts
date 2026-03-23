import { format, formatDistanceToNow, isValid, parseISO, differenceInMinutes } from 'date-fns'

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '-'
  return format(d, 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '-'
  return format(d, 'dd MMM yyyy, h:mm a')
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '-'
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '$0.00'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount)
}

export function formatFullName(firstName: string, lastName: string, preferredName?: string | null): string {
  if (preferredName) return `${preferredName} ${lastName}`
  return `${firstName} ${lastName}`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function formatPercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function formatDuration(startTime: string | Date, endTime: string | Date): string {
  const start = typeof startTime === 'string' ? parseISO(startTime) : startTime
  const end = typeof endTime === 'string' ? parseISO(endTime) : endTime
  if (!isValid(start) || !isValid(end)) return '-'
  const mins = differenceInMinutes(end, start)
  if (mins < 0) return '-'
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  if (hours === 0) return `${remainingMins}m`
  if (remainingMins === 0) return `${hours}h`
  return `${hours}h ${remainingMins}m`
}

export function formatTimeVariance(scheduledTime: string, actualTime: string): string {
  const scheduled = parseISO(scheduledTime)
  const actual = parseISO(actualTime)
  if (!isValid(scheduled) || !isValid(actual)) return '-'
  const diffMins = differenceInMinutes(actual, scheduled)
  if (diffMins === 0) return 'On time'
  if (diffMins > 0) return `+${diffMins}m late`
  return `${diffMins}m early`
}
