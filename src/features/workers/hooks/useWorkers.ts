import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type Worker = Tables<'workers'>

export function useWorkers(status?: string, showArchived = false) {
  return useQuery({
    queryKey: ['workers', status, showArchived],
    queryFn: async () => {
      let query = supabase
        .from('workers')
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
      return (data ?? []) as Worker[]
    },
  })
}

export function useWorker(id: string | undefined) {
  return useQuery({
    queryKey: ['worker', id],
    queryFn: async () => {
      if (!id) throw new Error('No worker ID')
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Worker
    },
    enabled: !!id,
  })
}

export function useCreateWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('workers')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Worker
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
    },
  })
}

export function useUpdateWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { data: result, error } = await supabase
        .from('workers')
        .update(data as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return result as unknown as Worker
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      queryClient.invalidateQueries({ queryKey: ['worker', id] })
    },
  })
}

export function useArchiveWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, userId, reason }: { id: string; userId: string; reason?: string }) => {
      const { error: updateError } = await supabase
        .from('workers')
        .update({ archived_at: new Date().toISOString(), archived_by: userId, archive_reason: reason || null } as never)
        .eq('id', id)

      if (updateError) throw updateError

      const { error: auditError } = await supabase
        .from('audit_log')
        .insert({
          table_name: 'workers',
          record_id: id,
          action: 'archive',
          changed_by: userId,
          reason: reason || null,
        } as never)

      if (auditError) throw auditError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
    },
  })
}

export function useRestoreWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error: updateError } = await supabase
        .from('workers')
        .update({ archived_at: null, archived_by: null, archive_reason: null } as never)
        .eq('id', id)

      if (updateError) throw updateError

      const { error: auditError } = await supabase
        .from('audit_log')
        .insert({
          table_name: 'workers',
          record_id: id,
          action: 'restore',
          changed_by: userId,
        } as never)

      if (auditError) throw auditError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
    },
  })
}
