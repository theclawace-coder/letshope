import type { Tables } from '@/lib/types'

type PriceGuideItem = Tables<'ndis_price_guide'>

/**
 * Calculate hours between two time strings (HH:mm format)
 */
export function calculateHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  const diff = endMinutes - startMinutes
  return diff > 0 ? diff / 60 : 0
}

/**
 * Calculate estimated cost for a booking based on NDIS price guide item and duration
 */
export function calculateBookingCost(
  item: PriceGuideItem,
  startTime: string,
  endTime: string,
): { unitPrice: number; quantity: number; estimatedCost: number } {
  const unitPrice = item.price_national

  let quantity: number
  if (item.unit === 'hour') {
    quantity = calculateHours(startTime, endTime)
  } else {
    // For 'each', 'day', 'week', 'km' — default to 1 unit
    quantity = 1
  }

  const estimatedCost = Math.round(unitPrice * quantity * 100) / 100

  return { unitPrice, quantity, estimatedCost }
}

/**
 * Parse a ratio string like "1:3" and return the participant count
 */
export function parseRatio(ratio: string): { workers: number; participants: number } {
  const [w, p] = ratio.split(':').map(Number)
  return { workers: w || 1, participants: p || 1 }
}

/**
 * Calculate per-participant cost for a group booking.
 * NDIS group pricing: total booking cost is split across participants.
 */
export function calculateGroupCostPerParticipant(
  totalCost: number,
  participantCount: number,
): number {
  if (participantCount <= 0) return totalCost
  return Math.round((totalCost / participantCount) * 100) / 100
}
