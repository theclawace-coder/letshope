import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types'

type Concern = Tables<'concerns'>

interface ConcernFilters {
  participantId?: string
  severity?: string
  status?: string
  concernType?: string
}

export interface ConcernWithNames extends Concern {
  participant_name?: string
  raised_by_name?: string
}

export function useConcerns(filters?: ConcernFilters) {
  return useQuery({
    queryKey: ['concerns', filters],
    queryFn: async () => {
      let query = supabase
        .from('concerns')
        .select('*, participants(first_name, last_name), profiles!concerns_raised_by_fkey(full_name)')
        .order('created_at', { ascending: false })

      if (filters?.participantId) {
        query = query.eq('participant_id', filters.participantId)
      }
      if (filters?.severity && filters.severity !== 'all') {
        query = query.eq('severity', filters.severity)
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters?.concernType && filters.concernType !== 'all') {
        query = query.eq('concern_type', filters.concernType)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const participants = row.participants as { first_name: string; last_name: string } | null
        const profiles = row.profiles as { full_name: string } | null
        return {
          ...row,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
          raised_by_name: profiles?.full_name ?? undefined,
        } as ConcernWithNames
      })
    },
  })
}

export function useConcern(id: string | undefined) {
  return useQuery({
    queryKey: ['concern', id],
    queryFn: async () => {
      if (!id) throw new Error('No concern ID')
      const { data, error } = await supabase
        .from('concerns')
        .select('*, participants(first_name, last_name), profiles!concerns_raised_by_fkey(full_name)')
        .eq('id', id)
        .single()
      if (error) throw error

      const row = data as Record<string, unknown>
      const participants = row.participants as { first_name: string; last_name: string } | null
      const profiles = row.profiles as { full_name: string } | null
      return {
        ...row,
        participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
        raised_by_name: profiles?.full_name ?? undefined,
      } as ConcernWithNames
    },
    enabled: !!id,
  })
}

export function useParticipantConcerns(participantId: string | undefined) {
  return useConcerns(participantId ? { participantId } : undefined)
}

export function useCreateConcern() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('concerns')
        .insert(input as never)
        .select('*, participants(first_name, last_name)')
        .single()
      if (error) throw error
      return data as unknown as Concern & { participants: { first_name: string; last_name: string } | null }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['concerns'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      if (data.severity === 'critical') {
        const participants = (data as Record<string, unknown>).participants as { first_name: string; last_name: string } | null
        const name = participants ? `${participants.first_name} ${participants.last_name}` : 'a participant'
        toast.error(`CRITICAL concern flagged for ${name}`, {
          description: (data as Concern).title,
          duration: 10000,
        })
      }
    },
  })
}

export function useResolveConcern() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      resolution_notes,
      resolved_by,
    }: {
      id: string
      status: 'resolved' | 'dismissed'
      resolution_notes: string
      resolved_by: string
    }) => {
      const { data, error } = await supabase
        .from('concerns')
        .update({
          status,
          resolution_notes,
          resolved_by,
          resolved_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Concern
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['concerns'] })
      queryClient.invalidateQueries({ queryKey: ['concern', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useOpenConcernsCount() {
  return useQuery({
    queryKey: ['concerns-count-open'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('concerns')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open')
      if (error) throw error
      return count ?? 0
    },
  })
}
