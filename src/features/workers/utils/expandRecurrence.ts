import { addWeeks, format, isBefore, isEqual, parseISO } from 'date-fns'

interface RecurrenceInput {
  startDate: string // yyyy-MM-dd
  endDate: string // yyyy-MM-dd
  recurrence: 'weekly' | 'fortnightly'
}

/**
 * Generates an array of dates (yyyy-MM-dd) for a recurring booking series.
 * The start date itself is always included as the first date.
 */
export function expandRecurrenceDates({ startDate, endDate, recurrence }: RecurrenceInput): string[] {
  const dates: string[] = []
  const end = parseISO(endDate)
  const interval = recurrence === 'weekly' ? 1 : 2
  let current = parseISO(startDate)

  while (isBefore(current, end) || isEqual(current, end)) {
    dates.push(format(current, 'yyyy-MM-dd'))
    current = addWeeks(current, interval)
  }

  return dates
}
