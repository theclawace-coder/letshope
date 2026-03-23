import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type ServiceAgreement = Tables<'service_agreements'>

export interface ServiceAgreementWithNames extends ServiceAgreement {
  participant_name?: string
  plan_number?: string | null
  plan_start?: string | null
  plan_end?: string | null
}

interface AgreementFilters {
  participantId?: string
  planId?: string
  status?: string
}

export function useServiceAgreements(filters?: AgreementFilters) {
  return useQuery({
    queryKey: ['service-agreements', filters],
    queryFn: async () => {
      let query = supabase
        .from('service_agreements')
        .select('*, participants(first_name, last_name), ndis_plans(plan_number, start_date, end_date)')
        .order('created_at', { ascending: false })

      if (filters?.participantId) {
        query = query.eq('participant_id', filters.participantId)
      }
      if (filters?.planId) {
        query = query.eq('plan_id', filters.planId)
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const participants = row.participants as { first_name: string; last_name: string } | null
        const plan = row.ndis_plans as { plan_number: string | null; start_date: string; end_date: string } | null
        return {
          ...row,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
          plan_number: plan?.plan_number,
          plan_start: plan?.start_date,
          plan_end: plan?.end_date,
        } as ServiceAgreementWithNames
      })
    },
  })
}

export function useServiceAgreement(id: string | undefined) {
  return useQuery({
    queryKey: ['service-agreement', id],
    queryFn: async () => {
      if (!id) throw new Error('No agreement ID')
      const { data, error } = await supabase
        .from('service_agreements')
        .select('*, participants(first_name, last_name, ndis_number, funding_type, phone, email, address), ndis_plans(id, plan_number, start_date, end_date, funding_type, budget_core, budget_capacity_building, budget_capital, status)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as unknown as ServiceAgreementWithNames & { participants: Record<string, unknown>; ndis_plans: Record<string, unknown> | null }
    },
    enabled: !!id,
  })
}

export function useCreateServiceAgreement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (agreement: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('service_agreements')
        .insert(agreement as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as ServiceAgreement
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-agreements'] })
    },
  })
}

export function useUpdateServiceAgreement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Record<string, unknown> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_agreements')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as ServiceAgreement
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['service-agreements'] })
      queryClient.invalidateQueries({ queryKey: ['service-agreement', id] })
    },
  })
}
