import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types'

type Incident = Tables<'incidents'>

interface IncidentFilters {
  participantId?: string
  severity?: string
  status?: string
  incidentType?: string
}

export interface IncidentWithNames extends Incident {
  participant_name?: string
  worker_name?: string
  logged_by_name?: string
}

export function useIncidents(filters?: IncidentFilters) {
  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: async () => {
      let query = supabase
        .from('incidents')
        .select('*, participants(first_name, last_name), workers(first_name, last_name), profiles!incidents_logged_by_fkey(full_name)')
        .order('incident_date', { ascending: false })

      if (filters?.participantId) {
        query = query.eq('participant_id', filters.participantId)
      }
      if (filters?.severity && filters.severity !== 'all') {
        query = query.eq('severity', filters.severity)
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters?.incidentType && filters.incidentType !== 'all') {
        query = query.eq('incident_type', filters.incidentType)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const participants = row.participants as { first_name: string; last_name: string } | null
        const workers = row.workers as { first_name: string; last_name: string } | null
        const profiles = row.profiles as { full_name: string } | null
        return {
          ...row,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
          worker_name: workers ? `${workers.first_name} ${workers.last_name}` : undefined,
          logged_by_name: profiles?.full_name ?? undefined,
        } as IncidentWithNames
      })
    },
  })
}

export function useIncident(id: string | undefined) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: async () => {
      if (!id) throw new Error('No incident ID')
      const { data, error } = await supabase
        .from('incidents')
        .select('*, participants(first_name, last_name), workers(first_name, last_name), profiles!incidents_logged_by_fkey(full_name)')
        .eq('id', id)
        .single()
      if (error) throw error

      const row = data as Record<string, unknown>
      const participants = row.participants as { first_name: string; last_name: string } | null
      const workers = row.workers as { first_name: string; last_name: string } | null
      const profiles = row.profiles as { full_name: string } | null
      return {
        ...row,
        participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
        worker_name: workers ? `${workers.first_name} ${workers.last_name}` : undefined,
        logged_by_name: profiles?.full_name ?? undefined,
      } as IncidentWithNames
    },
    enabled: !!id,
  })
}

export function useCreateIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('incidents')
        .insert(input as never)
        .select('*, participants(first_name, last_name)')
        .single()
      if (error) throw error
      return data as unknown as Incident & { participants: { first_name: string; last_name: string } | null }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      if (data.severity === 'critical' || data.severity === 'major') {
        const participants = (data as Record<string, unknown>).participants as { first_name: string; last_name: string } | null
        const name = participants ? `${participants.first_name} ${participants.last_name}` : 'a participant'
        toast.error(`${(data.severity ?? '').toUpperCase()} incident logged for ${name}`, {
          description: data.is_reportable ? 'This incident is reportable to the NDIS Commission' : undefined,
          duration: 10000,
        })
      }
    },
  })
}

export function useUpdateIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string
      status?: string
      investigation_notes?: string
      corrective_actions?: unknown
      reported_to_commission?: boolean
    }) => {
      const { data, error } = await supabase
        .from('incidents')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Incident
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['incident', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
