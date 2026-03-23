import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types'

type ConsentRecord = Tables<'consent_records'>

interface ConsentFilters {
  participantId?: string
  consentType?: string
  status?: string
}

export interface ConsentWithNames extends ConsentRecord {
  participant_name?: string
  recorded_by_name?: string
}

export function useConsents(filters?: ConsentFilters) {
  return useQuery({
    queryKey: ['consents', filters],
    queryFn: async () => {
      let query = supabase
        .from('consent_records')
        .select('*, participants(first_name, last_name), profiles!consent_records_recorded_by_fkey(full_name)')
        .order('created_at', { ascending: false })

      if (filters?.participantId) {
        query = query.eq('participant_id', filters.participantId)
      }
      if (filters?.consentType && filters.consentType !== 'all') {
        query = query.eq('consent_type', filters.consentType)
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('consent_status', filters.status)
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
        } as ConsentWithNames
      })
    },
  })
}

export function useConsent(id: string | undefined) {
  return useQuery({
    queryKey: ['consent', id],
    queryFn: async () => {
      if (!id) throw new Error('No consent ID')
      const { data, error } = await supabase
        .from('consent_records')
        .select('*, participants(first_name, last_name), profiles!consent_records_recorded_by_fkey(full_name)')
        .eq('id', id)
        .single()
      if (error) throw error

      const row = data as Record<string, unknown>
      const participants = row.participants as { first_name: string; last_name: string } | null
      const profiles = row.profiles as { full_name: string } | null
      return {
        ...row,
        participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
        recorded_by_name: profiles?.full_name ?? undefined,
      } as ConsentWithNames
    },
    enabled: !!id,
  })
}

export function useCreateConsent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('consent_records')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as ConsentRecord
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateConsent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('consent_records')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as ConsentRecord
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['consents'] })
      queryClient.invalidateQueries({ queryKey: ['consent', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useConsentAuditLog(consentId: string | undefined) {
  return useQuery({
    queryKey: ['consent-audit', consentId],
    queryFn: async () => {
      if (!consentId) throw new Error('No consent ID')
      const { data, error } = await supabase
        .from('consent_audit_log')
        .select('*, profiles!consent_audit_log_changed_by_fkey(full_name)')
        .eq('consent_id', consentId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((row: Record<string, unknown>) => {
        const profiles = row.profiles as { full_name: string } | null
        return { ...row, changed_by_name: profiles?.full_name ?? undefined }
      })
    },
    enabled: !!consentId,
  })
}

export function useConsentsRequiringAttention() {
  return useQuery({
    queryKey: ['consents-attention'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consents_requiring_attention')
        .select('*')
      if (error) throw error
      return data ?? []
    },
  })
}
