import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'
import type { CancellationType, CancelledBy, CancellationReasonValue } from '../utils/cancellationRules'
import {
  determineCancellationType,
  calculateCancellationCharge,
  isChargeableCancel,
} from '../utils/cancellationRules'

type Booking = Tables<'bookings'>

interface BookingFilters {
  workerId?: string
  participantId?: string
  dateFrom?: string
  dateTo?: string
  status?: string
}

export interface GroupParticipant {
  participant_id: string
  participant_name: string
}

export interface BookingWithNames extends Booking {
  worker_name?: string
  participant_name?: string
  group_participants?: GroupParticipant[]
}

export function useBookings(filters?: BookingFilters & { showArchived?: boolean }) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('*, workers(first_name, last_name), participants(first_name, last_name), booking_participants(participant_id, participants(first_name, last_name))')
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (filters?.workerId) {
        query = query.eq('worker_id', filters.workerId)
      }
      if (filters?.participantId) {
        query = query.eq('participant_id', filters.participantId)
      }
      if (filters?.dateFrom) {
        query = query.gte('booking_date', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('booking_date', filters.dateTo)
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      // Filter archived by default
      if (filters?.showArchived) {
        query = query.not('archived_at', 'is', null)
      } else {
        query = query.is('archived_at', null)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const workers = row.workers as { first_name: string; last_name: string } | null
        const participants = row.participants as { first_name: string; last_name: string } | null
        const bpRows = row.booking_participants as Array<{
          participant_id: string
          participants: { first_name: string; last_name: string } | null
        }> | null
        const groupParticipants: GroupParticipant[] = (bpRows ?? [])
          .filter((bp) => bp.participants)
          .map((bp) => ({
            participant_id: bp.participant_id,
            participant_name: `${bp.participants!.first_name} ${bp.participants!.last_name}`,
          }))
        return {
          ...row,
          worker_name: workers ? `${workers.first_name} ${workers.last_name}` : undefined,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
          group_participants: groupParticipants.length > 0 ? groupParticipants : undefined,
        } as BookingWithNames
      })
    },
  })
}

export interface CreateBookingInput {
  bookingData: Record<string, unknown>
  groupParticipantIds?: string[]
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert(input.bookingData as never)
        .select()
        .single()
      if (error) throw error

      const booking = data as unknown as Booking

      // Insert group participants if this is a group booking
      if (input.groupParticipantIds && input.groupParticipantIds.length > 0) {
        const rows = input.groupParticipantIds.map((pid) => ({
          booking_id: booking.id,
          participant_id: pid,
        }))
        const { error: bpError } = await supabase
          .from('booking_participants')
          .insert(rows as never)
        if (bpError) throw bpError
      }

      return booking
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

/** Create a recurring booking series: inserts the parent + all expanded child bookings */
export function useCreateRecurringSeries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      baseBooking,
      dates,
      groupParticipantIds,
    }: {
      baseBooking: Record<string, unknown>
      dates: string[] // all dates including the first
      groupParticipantIds?: string[]
    }) => {
      if (dates.length === 0) throw new Error('No dates to create')

      // Insert the parent (first date)
      const parentInput = { ...baseBooking, booking_date: dates[0], recurrence_parent_id: null }
      const { data: parent, error: parentErr } = await supabase
        .from('bookings')
        .insert(parentInput as never)
        .select()
        .single()
      if (parentErr) throw parentErr

      const parentId = (parent as Record<string, unknown>).id as string
      const allBookingIds: string[] = [parentId]

      // Insert the remaining dates as children linked to parent
      if (dates.length > 1) {
        const children = dates.slice(1).map((date) => ({
          ...baseBooking,
          booking_date: date,
          recurrence_parent_id: parentId,
        }))
        const { data: childRows, error: childErr } = await supabase
          .from('bookings')
          .insert(children as never)
          .select('id')
        if (childErr) throw childErr
        if (childRows) {
          for (const row of childRows as Array<{ id: string }>) {
            allBookingIds.push(row.id)
          }
        }
      }

      // Insert group participants for every booking in the series
      if (groupParticipantIds && groupParticipantIds.length > 0) {
        const bpRows = allBookingIds.flatMap((bookingId) =>
          groupParticipantIds.map((pid) => ({
            booking_id: bookingId,
            participant_id: pid,
          }))
        )
        const { error: bpErr } = await supabase
          .from('booking_participants')
          .insert(bpRows as never)
        if (bpErr) throw bpErr
      }

      return { parentId, count: dates.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export type SeriesEditScope = 'this' | 'this_and_future' | 'all'

/** Update bookings in a series based on scope */
export function useUpdateBookingSeries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      booking,
      data,
      scope,
    }: {
      booking: BookingWithNames
      data: Record<string, unknown>
      scope: SeriesEditScope
    }) => {
      const parentId = booking.recurrence_parent_id || booking.id

      if (scope === 'this') {
        const { error } = await supabase
          .from('bookings')
          .update(data as never)
          .eq('id', booking.id)
        if (error) throw error
      } else if (scope === 'all') {
        // Update the parent
        const { error: parentErr } = await supabase
          .from('bookings')
          .update(data as never)
          .eq('id', parentId)
        if (parentErr) throw parentErr
        // Update all children
        const { error: childErr } = await supabase
          .from('bookings')
          .update(data as never)
          .eq('recurrence_parent_id', parentId)
        if (childErr) throw childErr
      } else {
        // this_and_future: update this booking and all future siblings
        const { error: thisErr } = await supabase
          .from('bookings')
          .update(data as never)
          .eq('id', booking.id)
        if (thisErr) throw thisErr

        // Update future siblings (same parent, date >= this booking's date, excluding this one)
        let query = supabase
          .from('bookings')
          .update(data as never)
          .gte('booking_date', booking.booking_date)
          .neq('id', booking.id)

        if (booking.recurrence_parent_id) {
          // This is a child — update parent too if it's in the future, plus siblings
          query = query.or(`recurrence_parent_id.eq.${parentId},id.eq.${parentId}`)
        } else {
          // This is the parent — just update children
          query = query.eq('recurrence_parent_id', parentId)
        }

        const { error: futureErr } = await query
        if (futureErr) throw futureErr
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

/** Input for NDIS-compliant booking cancellation */
export interface CancelBookingInput {
  bookingId: string
  bookingDate: string
  estimatedCost: number | null
  cancelledBy: CancelledBy
  cancellationReason: CancellationReasonValue | string
  /** Override the auto-detected type (e.g. force 'no_show') */
  cancellationTypeOverride?: CancellationType
  timeSlotFilled?: boolean
}

/** NDIS-compliant single booking cancellation with charge calculation */
export function useCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CancelBookingInput) => {
      const now = new Date()

      // Determine cancellation type
      let cancellationType: CancellationType
      if (input.cancellationTypeOverride) {
        cancellationType = input.cancellationTypeOverride
      } else {
        const bookingDate = new Date(input.bookingDate)
        cancellationType = determineCancellationType(now, bookingDate)
      }

      // Only charge participant-initiated cancellations
      const chargeable = isChargeableCancel(input.cancelledBy)
      const { charge, rate } = chargeable
        ? calculateCancellationCharge(cancellationType, input.estimatedCost, input.timeSlotFilled)
        : { charge: 0, rate: 0 }

      const status = input.cancellationTypeOverride === 'no_show' ? 'no_show' : 'cancelled'

      const cancelData = {
        status,
        cancellation_type: cancellationType,
        cancellation_reason: input.cancellationReason,
        cancelled_by: input.cancelledBy,
        cancelled_at: now.toISOString(),
        cancellation_charge: charge,
        cancellation_charge_rate: rate,
        time_slot_filled: input.timeSlotFilled ?? false,
        updated_at: now.toISOString(),
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(cancelData as never)
        .eq('id', input.bookingId)
        .select()
        .single()
      if (error) throw error

      return {
        booking: data as unknown as Booking,
        cancellationType,
        charge,
        rate,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

/** Cancel bookings in a series based on scope (with NDIS cancellation fields) */
export function useCancelBookingSeries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      booking,
      scope,
      cancelledBy,
      cancellationReason,
    }: {
      booking: BookingWithNames
      scope: SeriesEditScope
      cancelledBy: CancelledBy
      cancellationReason: string
    }) => {
      const now = new Date()
      const bookingDate = new Date(booking.booking_date)
      const cancellationType = determineCancellationType(now, bookingDate)
      const chargeable = isChargeableCancel(cancelledBy)
      const { charge, rate } = chargeable
        ? calculateCancellationCharge(cancellationType, booking.estimated_cost)
        : { charge: 0, rate: 0 }

      const cancelData = {
        status: 'cancelled' as const,
        cancellation_type: cancellationType,
        cancellation_reason: cancellationReason,
        cancelled_by: cancelledBy,
        cancelled_at: now.toISOString(),
        cancellation_charge: charge,
        cancellation_charge_rate: rate,
        updated_at: now.toISOString(),
      }

      const parentId = booking.recurrence_parent_id || booking.id

      if (scope === 'this') {
        const { error } = await supabase
          .from('bookings')
          .update(cancelData as never)
          .eq('id', booking.id)
        if (error) throw error
      } else if (scope === 'all') {
        const { error: parentErr } = await supabase
          .from('bookings')
          .update(cancelData as never)
          .eq('id', parentId)
        if (parentErr) throw parentErr
        const { error: childErr } = await supabase
          .from('bookings')
          .update(cancelData as never)
          .eq('recurrence_parent_id', parentId)
        if (childErr) throw childErr
      } else {
        // this_and_future
        const { error: thisErr } = await supabase
          .from('bookings')
          .update(cancelData as never)
          .eq('id', booking.id)
        if (thisErr) throw thisErr

        let query = supabase
          .from('bookings')
          .update(cancelData as never)
          .gte('booking_date', booking.booking_date)
          .neq('id', booking.id)

        if (booking.recurrence_parent_id) {
          query = query.or(`recurrence_parent_id.eq.${parentId},id.eq.${parentId}`)
        } else {
          query = query.eq('recurrence_parent_id', parentId)
        }

        const { error: futureErr } = await query
        if (futureErr) throw futureErr
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data, groupParticipantIds }: { id: string; data: Record<string, unknown>; groupParticipantIds?: string[] }) => {
      const { data: result, error } = await supabase
        .from('bookings')
        .update(data as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      // Sync group participants if provided
      if (groupParticipantIds !== undefined) {
        // Delete existing participants
        const { error: delError } = await supabase
          .from('booking_participants')
          .delete()
          .eq('booking_id', id)
        if (delError) throw delError

        // Insert new participants
        if (groupParticipantIds.length > 0) {
          const rows = groupParticipantIds.map((pid) => ({
            booking_id: id,
            participant_id: pid,
          }))
          const { error: insError } = await supabase
            .from('booking_participants')
            .insert(rows as never)
          if (insError) throw insError
        }
      }

      return result as unknown as Booking
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useBookingConflicts(
  workerId: string | undefined,
  date: string | undefined,
  startTime: string | undefined,
  endTime: string | undefined,
  excludeBookingId?: string,
) {
  return useQuery({
    queryKey: ['booking-conflicts', workerId, date, startTime, endTime, excludeBookingId],
    queryFn: async () => {
      if (!workerId || !date || !startTime || !endTime) return { hasConflict: false, conflictingBookings: [] }

      let query = supabase
        .from('bookings')
        .select('*, participants(first_name, last_name)')
        .eq('worker_id', workerId)
        .eq('booking_date', date)
        .neq('status', 'cancelled')
        .lt('start_time', endTime)
        .gt('end_time', startTime)

      if (excludeBookingId) {
        query = query.neq('id', excludeBookingId)
      }

      const { data, error } = await query
      if (error) throw error

      return {
        hasConflict: (data?.length ?? 0) > 0,
        conflictingBookings: (data ?? []) as Booking[],
      }
    },
    enabled: !!workerId && !!date && !!startTime && !!endTime,
  })
}
