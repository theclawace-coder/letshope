import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type AuditLog = Tables<'audit_logs'>

export interface AuditLogWithUser extends AuditLog {
  user_name?: string
}

export interface AuditLogFilters {
  entityType?: string
  entityId?: string
  action?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
}

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*, profiles:user_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(200)

      if (filters?.entityType && filters.entityType !== 'all') {
        query = query.eq('entity_type', filters.entityType)
      }
      if (filters?.entityId) {
        query = query.eq('entity_id', filters.entityId)
      }
      if (filters?.action && filters.action !== 'all') {
        query = query.eq('action', filters.action)
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59')
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const profiles = row.profiles as { full_name: string } | null
        return {
          ...row,
          user_name: profiles?.full_name ?? 'System',
        } as AuditLogWithUser
      })
    },
  })
}

export function useEntityAuditLogs(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ['audit-logs', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return []
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profiles:user_id(full_name)')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const profiles = row.profiles as { full_name: string } | null
        return {
          ...row,
          user_name: profiles?.full_name ?? 'System',
        } as AuditLogWithUser
      })
    },
    enabled: !!entityId,
  })
}
