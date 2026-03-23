import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type NdisPlan = Tables<'ndis_plans'>

export interface NdisPlanWithParticipant extends NdisPlan {
  participant_name?: string
}

export function useNdisPlans(participantId?: string) {
  return useQuery({
    queryKey: ['ndis-plans', participantId],
    queryFn: async () => {
      let query = supabase
        .from('ndis_plans')
        .select('*, participants(first_name, last_name)')
        .order('start_date', { ascending: false })

      if (participantId) {
        query = query.eq('participant_id', participantId)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const participants = row.participants as { first_name: string; last_name: string } | null
        return {
          ...row,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
        } as NdisPlanWithParticipant
      })
    },
  })
}

export function useNdisPlan(id: string | undefined) {
  return useQuery({
    queryKey: ['ndis-plan', id],
    queryFn: async () => {
      if (!id) throw new Error('No plan ID')
      const { data, error } = await supabase
        .from('ndis_plans')
        .select('*, participants(first_name, last_name, ndis_number)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as unknown as NdisPlanWithParticipant & { participants: Record<string, unknown> }
    },
    enabled: !!id,
  })
}

export function useActivePlan(participantId: string | undefined) {
  return useQuery({
    queryKey: ['ndis-plan-active', participantId],
    queryFn: async () => {
      if (!participantId) throw new Error('No participant ID')
      const { data, error } = await supabase
        .from('ndis_plans')
        .select('*')
        .eq('participant_id', participantId)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as NdisPlan | null
    },
    enabled: !!participantId,
  })
}

export function useCreateNdisPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (plan: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('ndis_plans')
        .insert(plan as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as NdisPlan
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ndis-plans'] })
      queryClient.invalidateQueries({ queryKey: ['ndis-plan-active', data.participant_id] })
    },
  })
}

export function useUpdateNdisPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Record<string, unknown> & { id: string }) => {
      const { data, error } = await supabase
        .from('ndis_plans')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as NdisPlan
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ndis-plans'] })
      queryClient.invalidateQueries({ queryKey: ['ndis-plan', data.id] })
      queryClient.invalidateQueries({ queryKey: ['ndis-plan-active', data.participant_id] })
    },
  })
}
