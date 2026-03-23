/**
 * NDIS Cancellation Rules
 *
 * Per NDIS Price Guide & NDIS Terms of Business:
 * - Participants must give at least 2 clear business days notice to cancel
 * - Short notice cancellation (< 2 business days): provider may charge up to 90% of agreed price
 * - No-show: provider may charge up to 100% of agreed price
 * - Provider can only claim if they were unable to fill the time slot
 */

import { differenceInCalendarDays, isWeekend, addDays, isBefore, startOfDay } from 'date-fns'

export type CancellationType = 'standard' | 'short_notice' | 'no_show'
export type CancelledBy = 'participant' | 'provider' | 'worker' | 'system'

/** Charge rates per NDIS rules */
export const CANCELLATION_CHARGE_RATES: Record<CancellationType, number> = {
  standard: 0,       // No charge — sufficient notice given
  short_notice: 0.9,  // 90% of agreed rate
  no_show: 1.0,       // 100% of agreed rate
}

export const CANCELLATION_REASONS = [
  { value: 'participant_unwell', label: 'Participant unwell' },
  { value: 'participant_hospitalised', label: 'Participant hospitalised' },
  { value: 'participant_request', label: 'Participant request (other)' },
  { value: 'family_emergency', label: 'Family / carer emergency' },
  { value: 'transport_issue', label: 'Transport issue' },
  { value: 'weather', label: 'Severe weather / natural disaster' },
  { value: 'worker_unavailable', label: 'Worker unavailable' },
  { value: 'provider_decision', label: 'Provider decision' },
  { value: 'plan_ended', label: 'NDIS plan ended / funding exhausted' },
  { value: 'service_agreement_ended', label: 'Service agreement ended' },
  { value: 'other', label: 'Other' },
] as const

export type CancellationReasonValue = (typeof CANCELLATION_REASONS)[number]['value']

/** Required minimum notice period in clear business days */
const REQUIRED_BUSINESS_DAYS_NOTICE = 2

/**
 * Count clear business days between now and the booking date.
 * "Clear" means we exclude both the cancellation day and the booking day.
 * Only weekdays (Mon-Fri) count. Public holidays are not tracked here
 * — they can be handled via an optional holidays array if needed.
 */
export function countBusinessDaysBetween(
  cancellationDate: Date,
  bookingDate: Date,
): number {
  const start = startOfDay(cancellationDate)
  const end = startOfDay(bookingDate)

  if (!isBefore(start, end)) return 0

  let count = 0
  // Count business days strictly between start and end (exclusive of both)
  let current = addDays(start, 1)
  while (isBefore(current, end)) {
    if (!isWeekend(current)) {
      count++
    }
    current = addDays(current, 1)
  }
  return count
}

/**
 * Determine the cancellation type based on how much notice was given.
 */
export function determineCancellationType(
  cancellationDate: Date,
  bookingDate: Date,
): CancellationType {
  const businessDays = countBusinessDaysBetween(cancellationDate, bookingDate)
  if (businessDays >= REQUIRED_BUSINESS_DAYS_NOTICE) {
    return 'standard'
  }
  return 'short_notice'
}

/**
 * Calculate the cancellation charge amount.
 * Returns 0 if standard cancellation or if the time slot was filled.
 */
export function calculateCancellationCharge(
  cancellationType: CancellationType,
  estimatedCost: number | null,
  timeSlotFilled: boolean = false,
): { charge: number; rate: number } {
  // NDIS rule: provider can only charge if they couldn't fill the slot
  if (timeSlotFilled) {
    return { charge: 0, rate: 0 }
  }

  const rate = CANCELLATION_CHARGE_RATES[cancellationType]
  const charge = Math.round((estimatedCost ?? 0) * rate * 100) / 100

  return { charge, rate }
}

/**
 * Get a human-readable label for the cancellation type.
 */
export function getCancellationTypeLabel(type: CancellationType): string {
  switch (type) {
    case 'standard':
      return 'Standard (no charge)'
    case 'short_notice':
      return 'Short Notice (< 2 business days)'
    case 'no_show':
      return 'No Show'
  }
}

/**
 * Check if a booking is still cancellable (not already cancelled/completed).
 */
export function isBookingCancellable(status: string): boolean {
  return ['scheduled', 'checked_in'].includes(status)
}

/**
 * Determine if a cancellation by the provider/worker (not participant) should be charged.
 * Provider-initiated cancellations are never charged to the participant.
 */
export function isChargeableCancel(cancelledBy: CancelledBy): boolean {
  return cancelledBy === 'participant'
}
