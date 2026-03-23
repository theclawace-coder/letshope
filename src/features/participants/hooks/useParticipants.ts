import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type Participant = Tables<'participants'>

export function useParticipants(status?: string, showArchived = false) {
  return useQuery({
    queryKey: ['participants', status, showArchived],
    queryFn: async () => {
      let query = supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      if (showArchived) {
        query = query.not('archived_at', 'is', null)
      } else {
        query = query.is('archived_at', null)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Participant[]
    },
  })
}

export function useParticipant(id: string | undefined) {
  return useQuery({
    queryKey: ['participant', id],
    queryFn: async () => {
      if (!id) throw new Error('No participant ID')
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Participant
    },
    enabled: !!id,
  })
}

export function useCreateParticipant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('participants')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Participant
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] })
    },
  })
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { data: result, error } = await supabase
        .from('participants')
        .update(data as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return result as unknown as Participant
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['participants'] })
      queryClient.invalidateQueries({ queryKey: ['participant', id] })
    },
  })
}

// Archive/restore for participants — use the shared useArchive hook:
// import { useArchiveRecord, useRestoreRecord } from '@/hooks/useArchive'
// const archive = useArchiveRecord()
// archive.mutate({ table: 'participants', id, reason: '...', cascade: true })
