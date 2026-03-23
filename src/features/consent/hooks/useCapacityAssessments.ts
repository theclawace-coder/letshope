import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type CapacityAssessment = Tables<'capacity_assessments'>

export interface CapacityWithNames extends CapacityAssessment {
  participant_name?: string
  recorded_by_name?: string
}

export function useCapacityAssessments(participantId?: string) {
  return useQuery({
    queryKey: ['capacity-assessments', participantId],
    queryFn: async () => {
      let query = supabase
        .from('capacity_assessments')
        .select('*, participants(first_name, last_name), profiles!capacity_assessments_recorded_by_fkey(full_name)')
        .order('assessment_date', { ascending: false })

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
        } as CapacityWithNames
      })
    },
  })
}

export function useCreateCapacityAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('capacity_assessments')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as CapacityAssessment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capacity-assessments'] })
    },
  })
}
