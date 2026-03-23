import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type AuthorisedRep = Tables<'authorised_representatives'>

export interface RepWithNames extends AuthorisedRep {
  participant_name?: string
  recorded_by_name?: string
}

export function useAuthorisedReps(participantId?: string) {
  return useQuery({
    queryKey: ['authorised-reps', participantId],
    queryFn: async () => {
      let query = supabase
        .from('authorised_representatives')
        .select('*, participants(first_name, last_name), profiles!authorised_representatives_recorded_by_fkey(full_name)')
        .order('created_at', { ascending: false })

      if (participantId) {
        query = query.eq('participant_id', participantId)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const participants = row.participants as { first_name: string; last_name: string } | null
        const profiles = row.profiles as { full_name: string } | null
        return {
          ...row,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
          recorded_by_name: profiles?.full_name ?? undefined,
        } as RepWithNames
      })
    },
  })
}

export function useCreateAuthorisedRep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('authorised_representatives')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as AuthorisedRep
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorised-reps'] })
    },
  })
}

export function useUpdateAuthorisedRep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('authorised_representatives')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as AuthorisedRep
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorised-reps'] })
    },
  })
}
