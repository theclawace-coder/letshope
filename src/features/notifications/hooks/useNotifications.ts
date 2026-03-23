import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from 'sonner'
import type { Tables, InsertTables } from '@/lib/types'

type Notification = Tables<'notifications'>
type NotificationPreference = Tables<'notification_preferences'>

interface NotificationFilters {
  category?: string
  isRead?: boolean
  limit?: number
}

export function useNotifications(filters?: NotificationFilters) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['notifications', profile?.id, filters],
    queryFn: async () => {
      if (!profile?.id) return []

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }
      if (filters?.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead)
      }
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Notification[]
    },
    enabled: !!profile?.id,
  })
}

export function useUnreadCount() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['notifications-unread-count', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0

      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false)
        .eq('is_archived', false)

      if (error) throw error
      return count ?? 0
    },
    enabled: !!profile?.id,
    refetchInterval: 30000, // Poll every 30 seconds
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as never)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

export function useMarkAllRead() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!profile?.id) return
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as never)
        .eq('user_id', profile.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      toast.success('All notifications marked as read')
    },
  })
}

export function useArchiveNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_archived: true } as never)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

export function useCreateNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: InsertTables<'notifications'>) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data as Notification
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

// Notification preferences
export function useNotificationPreferences() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['notification-preferences', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', profile.id)

      if (error) throw error
      return (data ?? []) as NotificationPreference[]
    },
    enabled: !!profile?.id,
  })
}

export function useUpsertNotificationPreference() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Omit<InsertTables<'notification_preferences'>, 'user_id'>) => {
      if (!profile?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(
          { ...input, user_id: profile.id } as never,
          { onConflict: 'user_id,category' }
        )
        .select()
        .single()

      if (error) throw error
      return data as NotificationPreference
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
      toast.success('Preference saved')
    },
  })
}
