import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type ProgressNote = Tables<'progress_notes'>

interface ProgressNoteFilters {
  participantId?: string
  workerId?: string
  dateFrom?: string
  dateTo?: string
}

export interface ProgressNoteWithNames extends ProgressNote {
  worker_name?: string
  participant_name?: string
}

export function useProgressNotes(filters?: ProgressNoteFilters) {
  return useQuery({
    queryKey: ['progress-notes', filters],
    queryFn: async () => {
      let query = supabase
        .from('progress_notes')
        .select('*, workers(first_name, last_name), participants(first_name, last_name)')
        .order('note_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters?.participantId) {
        query = query.eq('participant_id', filters.participantId)
      }
      if (filters?.workerId) {
        query = query.eq('worker_id', filters.workerId)
      }
      if (filters?.dateFrom) {
        query = query.gte('note_date', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('note_date', filters.dateTo)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const workers = row.workers as { first_name: string; last_name: string } | null
        const participants = row.participants as { first_name: string; last_name: string } | null
        return {
          ...row,
          worker_name: workers ? `${workers.first_name} ${workers.last_name}` : undefined,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
        } as ProgressNoteWithNames
      })
    },
  })
}

export function useProgressNote(id: string | undefined) {
  return useQuery({
    queryKey: ['progress-note', id],
    queryFn: async () => {
      if (!id) throw new Error('No progress note ID')
      const { data, error } = await supabase
        .from('progress_notes')
        .select('*, workers(first_name, last_name), participants(first_name, last_name)')
        .eq('id', id)
        .single()
      if (error) throw error

      const row = data as Record<string, unknown>
      const workers = row.workers as { first_name: string; last_name: string } | null
      const participants = row.participants as { first_name: string; last_name: string } | null
      return {
        ...row,
        worker_name: workers ? `${workers.first_name} ${workers.last_name}` : undefined,
        participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
      } as ProgressNoteWithNames
    },
    enabled: !!id,
  })
}

export function useParticipantProgressNotes(participantId: string | undefined) {
  return useProgressNotes(participantId ? { participantId } : undefined)
}

export function useCreateProgressNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('progress_notes')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as ProgressNote
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-notes'] })
    },
  })
}

export function useUpdateProgressNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { data: result, error } = await supabase
        .from('progress_notes')
        .update(data as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return result as unknown as ProgressNote
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['progress-notes'] })
      queryClient.invalidateQueries({ queryKey: ['progress-note', id] })
    },
  })
}
