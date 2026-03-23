import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/** Tables that support archiving */
export type ArchivableTable =
  | 'participants'
  | 'workers'
  | 'bookings'
  | 'service_agreements'
  | 'concerns'
  | 'communications'
  | 'worker_participant_assignments'

/** Map table names to their query key prefixes for cache invalidation */
const QUERY_KEYS: Record<ArchivableTable, string[]> = {
  participants: ['participants', 'participant'],
  workers: ['workers', 'worker'],
  bookings: ['bookings', 'booking'],
  service_agreements: ['service-agreements', 'service_agreements'],
  concerns: ['concerns', 'concern'],
  communications: ['communications'],
  worker_participant_assignments: ['assignments'],
}

interface ArchiveParams {
  table: ArchivableTable
  id: string
  reason?: string
  /** Use cascade for participants/workers to also archive related records */
  cascade?: boolean
}

interface RestoreParams {
  table: ArchivableTable
  id: string
}

/**
 * Archive a record (soft delete). Calls the DB archive_record() function
 * which sets archived_at/archived_by and logs to audit_logs.
 */
export function useArchiveRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ table, id, reason, cascade }: ArchiveParams) => {
      // Use cascade functions for participants/workers if requested
      if (cascade && table === 'participants') {
        const { error } = await supabase.rpc('archive_participant_cascade', {
          p_participant_id: id,
          p_reason: reason ?? 'Archived',
        } as never)
        if (error) throw error
        return
      }

      if (cascade && table === 'workers') {
        const { error } = await supabase.rpc('archive_worker_cascade', {
          p_worker_id: id,
          p_reason: reason ?? 'Archived',
        } as never)
        if (error) throw error
        return
      }

      // Standard single-record archive
      const { error } = await supabase.rpc('archive_record', {
        p_table_name: table,
        p_record_id: id,
        p_reason: reason ?? null,
      } as never)
      if (error) throw error
    },
    onSuccess: (_, { table }) => {
      // Invalidate all related queries
      for (const key of QUERY_KEYS[table]) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
      // Also invalidate archived records view
      queryClient.invalidateQueries({ queryKey: ['archived-records'] })
    },
  })
}

/**
 * Restore an archived record. Calls the DB restore_record() function
 * which clears archived_at/archived_by and logs to audit_logs.
 */
export function useRestoreRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ table, id }: RestoreParams) => {
      const { error } = await supabase.rpc('restore_record', {
        p_table_name: table,
        p_record_id: id,
      } as never)
      if (error) throw error
    },
    onSuccess: (_, { table }) => {
      for (const key of QUERY_KEYS[table]) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
      queryClient.invalidateQueries({ queryKey: ['archived-records'] })
    },
  })
}

export interface ArchivedRecord {
  entity_type: string
  entity_id: string
  display_name: string
  archived_at: string
  archived_by: string
  archive_reason: string | null
}

/**
 * Fetch all archived records across all tables (uses the archived_records view).
 */
export function useArchivedRecords() {
  return {
    queryKey: ['archived-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('archived_records' as never)
        .select('*')
        .order('archived_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ArchivedRecord[]
    },
  }
}
