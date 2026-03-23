import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types'

type Risk = Tables<'risks'>

interface RiskFilters {
  participantId?: string
  category?: string
  status?: string
  riskLevel?: string
}

export interface RiskWithNames extends Risk {
  participant_name?: string
  identified_by_name?: string
}

export function useRisks(filters?: RiskFilters) {
  return useQuery({
    queryKey: ['risks', filters],
    queryFn: async () => {
      let query = supabase
        .from('risks')
        .select('*, participants(first_name, last_name), profiles!risks_identified_by_fkey(full_name)')
        .order('created_at', { ascending: false })

      if (filters?.participantId) {
        query = query.eq('participant_id', filters.participantId)
      }
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters?.riskLevel && filters.riskLevel !== 'all') {
        query = query.eq('risk_level', filters.riskLevel)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const participants = row.participants as { first_name: string; last_name: string } | null
        const profiles = row.profiles as { full_name: string } | null
        return {
          ...row,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
          identified_by_name: profiles?.full_name ?? undefined,
        } as RiskWithNames
      })
    },
  })
}

export function useRisk(id: string | undefined) {
  return useQuery({
    queryKey: ['risk', id],
    queryFn: async () => {
      if (!id) throw new Error('No risk ID')
      const { data, error } = await supabase
        .from('risks')
        .select('*, participants(first_name, last_name), profiles!risks_identified_by_fkey(full_name)')
        .eq('id', id)
        .single()
      if (error) throw error

      const row = data as Record<string, unknown>
      const participants = row.participants as { first_name: string; last_name: string } | null
      const profiles = row.profiles as { full_name: string } | null
      return {
        ...row,
        participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
        identified_by_name: profiles?.full_name ?? undefined,
      } as RiskWithNames
    },
    enabled: !!id,
  })
}

export function useParticipantRisks(participantId: string | undefined) {
  return useRisks(participantId ? { participantId } : undefined)
}

export function useCreateRisk() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('risks')
        .insert(input as never)
        .select('*, participants(first_name, last_name)')
        .single()
      if (error) throw error
      return data as unknown as Risk & { participants: { first_name: string; last_name: string } | null }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['risks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      if ((data as Risk).risk_level === 'critical') {
        const participants = (data as Record<string, unknown>).participants as { first_name: string; last_name: string } | null
        const name = participants ? `${participants.first_name} ${participants.last_name}` : 'a participant'
        toast.error(`CRITICAL risk identified for ${name}`, {
          description: (data as Risk).title,
          duration: 10000,
        })
      }
    },
  })
}

export function useUpdateRiskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('risks')
        .update({ status } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Risk
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['risks'] })
      queryClient.invalidateQueries({ queryKey: ['risk', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// Risk Assessments
export function useRiskAssessments(riskId: string | undefined) {
  return useQuery({
    queryKey: ['risk-assessments', riskId],
    queryFn: async () => {
      if (!riskId) throw new Error('No risk ID')
      const { data, error } = await supabase
        .from('risk_assessments')
        .select('*, profiles!risk_assessments_assessed_by_fkey(full_name)')
        .eq('risk_id', riskId)
        .order('assessment_date', { ascending: false })
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const profiles = row.profiles as { full_name: string } | null
        return {
          ...row,
          assessed_by_name: profiles?.full_name ?? undefined,
        }
      })
    },
    enabled: !!riskId,
  })
}

export function useCreateAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('risk_assessments')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      const riskId = (data as Record<string, unknown>).risk_id as string
      queryClient.invalidateQueries({ queryKey: ['risk-assessments', riskId] })
      queryClient.invalidateQueries({ queryKey: ['risk', riskId] })
      queryClient.invalidateQueries({ queryKey: ['risks'] })
      toast.success('Assessment recorded')
    },
  })
}

// Mitigation Plans
export function useRiskMitigations(riskId: string | undefined) {
  return useQuery({
    queryKey: ['risk-mitigations', riskId],
    queryFn: async () => {
      if (!riskId) throw new Error('No risk ID')
      const { data, error } = await supabase
        .from('risk_mitigation_plans')
        .select('*, profiles!risk_mitigation_plans_responsible_person_fkey(full_name)')
        .eq('risk_id', riskId)
        .order('created_at', { ascending: false })
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const profiles = row.profiles as { full_name: string } | null
        return {
          ...row,
          responsible_person_name: profiles?.full_name ?? undefined,
        }
      })
    },
    enabled: !!riskId,
  })
}

export function useCreateMitigation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('risk_mitigation_plans')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      const riskId = (data as Record<string, unknown>).risk_id as string
      queryClient.invalidateQueries({ queryKey: ['risk-mitigations', riskId] })
      toast.success('Mitigation plan added')
    },
  })
}

export function useUpdateMitigationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      completion_notes,
      riskId,
    }: {
      id: string
      status: string
      completion_notes?: string
      riskId: string
    }) => {
      const updates: Record<string, unknown> = { status }
      if (status === 'completed') {
        updates.completion_date = new Date().toISOString().split('T')[0]
        if (completion_notes) updates.completion_notes = completion_notes
      }
      const { data, error } = await supabase
        .from('risk_mitigation_plans')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { riskId }) => {
      queryClient.invalidateQueries({ queryKey: ['risk-mitigations', riskId] })
    },
  })
}

// Review Log
export function useRiskReviews(riskId: string | undefined) {
  return useQuery({
    queryKey: ['risk-reviews', riskId],
    queryFn: async () => {
      if (!riskId) throw new Error('No risk ID')
      const { data, error } = await supabase
        .from('risk_review_log')
        .select('*, profiles!risk_review_log_reviewed_by_fkey(full_name)')
        .eq('risk_id', riskId)
        .order('review_date', { ascending: false })
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const profiles = row.profiles as { full_name: string } | null
        return {
          ...row,
          reviewed_by_name: profiles?.full_name ?? undefined,
        }
      })
    },
    enabled: !!riskId,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('risk_review_log')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      const riskId = (data as Record<string, unknown>).risk_id as string
      queryClient.invalidateQueries({ queryKey: ['risk-reviews', riskId] })
      queryClient.invalidateQueries({ queryKey: ['risk', riskId] })
      queryClient.invalidateQueries({ queryKey: ['risks'] })
      toast.success('Review recorded')
    },
  })
}

// Dashboard count
export function useActiveRisksCount() {
  return useQuery({
    queryKey: ['risks-count-active'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('risks')
        .select('id', { count: 'exact', head: true })
        .in('status', ['active', 'monitoring', 'escalated'])
      if (error) throw error
      return count ?? 0
    },
  })
}
