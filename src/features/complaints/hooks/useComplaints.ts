import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type Complaint = Tables<'complaints'>

interface ComplaintFilters {
  participantId?: string
  status?: string
  category?: string
}

export interface ComplaintWithNames extends Complaint {
  participant_name?: string
  logged_by_name?: string
}

export function useComplaints(filters?: ComplaintFilters) {
  return useQuery({
    queryKey: ['complaints', filters],
    queryFn: async () => {
      let query = supabase
        .from('complaints')
        .select('*, participants(first_name, last_name), profiles!complaints_logged_by_fkey(full_name)')
        .order('complaint_date', { ascending: false })

      if (filters?.participantId) {
        query = query.eq('participant_id', filters.participantId)
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const participants = row.participants as { first_name: string; last_name: string } | null
        const profiles = row.profiles as { full_name: string } | null
        return {
          ...row,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
          logged_by_name: profiles?.full_name ?? undefined,
        } as ComplaintWithNames
      })
    },
  })
}

export function useComplaint(id: string | undefined) {
  return useQuery({
    queryKey: ['complaint', id],
    queryFn: async () => {
      if (!id) throw new Error('No complaint ID')
      const { data, error } = await supabase
        .from('complaints')
        .select('*, participants(first_name, last_name), profiles!complaints_logged_by_fkey(full_name)')
        .eq('id', id)
        .single()
      if (error) throw error

      const row = data as Record<string, unknown>
      const participants = row.participants as { first_name: string; last_name: string } | null
      const profiles = row.profiles as { full_name: string } | null
      return {
        ...row,
        participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
        logged_by_name: profiles?.full_name ?? undefined,
      } as ComplaintWithNames
    },
    enabled: !!id,
  })
}

export function useCreateComplaint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('complaints')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Complaint
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateComplaint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string
      status?: string
      acknowledged?: boolean
      acknowledged_date?: string
      resolution?: string
      resolution_date?: string
    }) => {
      const { data, error } = await supabase
        .from('complaints')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Complaint
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['complaint', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
