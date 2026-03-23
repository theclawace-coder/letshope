import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type RightsAcknowledgment = Tables<'rights_acknowledgments'>

export interface RightsAckWithNames extends RightsAcknowledgment {
  participant_name?: string
  recorded_by_name?: string
}

export function useRightsAcknowledgments(participantId?: string) {
  return useQuery({
    queryKey: ['rights-acknowledgments', participantId],
    queryFn: async () => {
      let query = supabase
        .from('rights_acknowledgments')
        .select('*, participants(first_name, last_name), profiles!rights_acknowledgments_recorded_by_fkey(full_name)')
        .order('acknowledged_date', { ascending: false })

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
        } as RightsAckWithNames
      })
    },
  })
}

export function useCreateRightsAcknowledgment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('rights_acknowledgments')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as RightsAcknowledgment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rights-acknowledgments'] })
    },
  })
}

export function useNdisParticipantRights() {
  return useQuery({
    queryKey: ['ndis-rights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ndis_participant_rights')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}
