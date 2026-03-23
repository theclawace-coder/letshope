import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables, Json } from '@/lib/types'
import { format } from 'date-fns'

type Booking = Tables<'bookings'>

export interface BookingWithNames extends Booking {
  worker_name?: string
  participant_name?: string
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookingId, location }: { bookingId: string; location?: { lat: number; lng: number; accuracy: number } }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'checked_in',
          actual_start_time: new Date().toISOString(),
          check_in_location: (location as Json) ?? null,
        } as never)
        .eq('id', bookingId)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Booking
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useCheckOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookingId, location }: { bookingId: string; location?: { lat: number; lng: number; accuracy: number } }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'checked_out',
          actual_end_time: new Date().toISOString(),
          check_out_location: (location as Json) ?? null,
        } as never)
        .eq('id', bookingId)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Booking
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useTodaysBookings(workerId: string | undefined) {
  const today = format(new Date(), 'yyyy-MM-dd')
  return useQuery({
    queryKey: ['bookings', { workerId, date: today }],
    queryFn: async () => {
      if (!workerId) return []
      const { data, error } = await supabase
        .from('bookings')
        .select('*, workers(first_name, last_name), participants(first_name, last_name)')
        .eq('worker_id', workerId)
        .eq('booking_date', today)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true })

      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const workers = row.workers as { first_name: string; last_name: string } | null
        const participants = row.participants as { first_name: string; last_name: string } | null
        return {
          ...row,
          worker_name: workers ? `${workers.first_name} ${workers.last_name}` : undefined,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
        } as BookingWithNames
      })
    },
    enabled: !!workerId,
  })
}

function captureLocation(): Promise<{ lat: number; lng: number; accuracy: number } | undefined> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(undefined)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      () => {
        resolve(undefined)
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  })
}

export { captureLocation }
