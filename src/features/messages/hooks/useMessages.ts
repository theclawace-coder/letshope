import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types'

type MessageThread = Tables<'message_threads'>
type Message = Tables<'messages'>

export interface ThreadWithDetails extends MessageThread {
  participants: Array<{ user_id: string; full_name: string; last_read_at: string | null }>
  last_message?: { content: string; sender_name: string; created_at: string }
  unread_count: number
}

export function useMessageThreads() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['message-threads', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      // Get threads the user participates in
      const { data: threadIds, error: tErr } = await supabase
        .from('message_thread_participants')
        .select('thread_id, last_read_at')
        .eq('user_id', profile.id)

      if (tErr) throw tErr
      if (!threadIds?.length) return []

      const ids = threadIds.map((t) => t.thread_id)
      const lastReadMap = Object.fromEntries(threadIds.map((t) => [t.thread_id, t.last_read_at]))

      // Get thread details
      const { data: threads, error: thErr } = await supabase
        .from('message_threads')
        .select('*')
        .in('id', ids)
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false })

      if (thErr) throw thErr

      // Get participants for all threads
      const { data: allParticipants, error: pErr } = await supabase
        .from('message_thread_participants')
        .select('thread_id, user_id, last_read_at, profiles(full_name)')
        .in('thread_id', ids)

      if (pErr) throw pErr

      // Get latest message per thread
      const threadDetails: ThreadWithDetails[] = await Promise.all(
        (threads ?? []).map(async (thread) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, profiles!messages_sender_id_fkey(full_name)')
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('thread_id', thread.id)
            .neq('sender_id', profile.id)
            .gt('created_at', lastReadMap[thread.id] ?? '1970-01-01')

          const participants = (allParticipants ?? [])
            .filter((p) => p.thread_id === thread.id)
            .map((p) => ({
              user_id: p.user_id,
              full_name: (p.profiles as { full_name: string } | null)?.full_name ?? 'Unknown',
              last_read_at: p.last_read_at,
            }))

          const msgRow = lastMsg as Record<string, unknown> | null
          const senderProfile = msgRow?.profiles as { full_name: string } | null

          return {
            ...thread,
            participants,
            last_message: msgRow
              ? {
                  content: msgRow.content as string,
                  sender_name: senderProfile?.full_name ?? 'Unknown',
                  created_at: msgRow.created_at as string,
                }
              : undefined,
            unread_count: unreadCount ?? 0,
          } as ThreadWithDetails
        })
      )

      return threadDetails
    },
    enabled: !!profile?.id,
  })
}

export function useTotalUnreadMessages() {
  const { data: threads } = useMessageThreads()
  return (threads ?? []).reduce((sum, t) => sum + t.unread_count, 0)
}

export function useThreadMessages(threadId: string | undefined) {
  return useQuery({
    queryKey: ['thread-messages', threadId],
    queryFn: async () => {
      if (!threadId) return []

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles!messages_sender_id_fkey(full_name)')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data ?? []).map((row: Record<string, unknown>) => {
        const profiles = row.profiles as { full_name: string } | null
        return {
          ...row,
          sender_name: profiles?.full_name ?? 'Unknown',
        } as Message & { sender_name: string }
      })
    },
    enabled: !!threadId,
    refetchInterval: 5000, // Poll for new messages
  })
}

export function useCreateThread() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      subject: string
      participant_ids: string[]
      initial_message: string
      entity_type?: string
      entity_id?: string
    }) => {
      if (!profile?.id) throw new Error('Not authenticated')

      // Create thread
      const { data: thread, error: tErr } = await supabase
        .from('message_threads')
        .insert({
          subject: input.subject,
          created_by: profile.id,
          entity_type: input.entity_type,
          entity_id: input.entity_id,
        })
        .select()
        .single()

      if (tErr) throw tErr

      // Add all participants (including creator)
      const allParticipantIds = [...new Set([profile.id, ...input.participant_ids])]
      const { error: pErr } = await supabase
        .from('message_thread_participants')
        .insert(
          allParticipantIds.map((uid) => ({
            thread_id: thread.id,
            user_id: uid,
          }))
        )

      if (pErr) throw pErr

      // Send initial message
      const { error: mErr } = await supabase
        .from('messages')
        .insert({
          thread_id: thread.id,
          sender_id: profile.id,
          content: input.initial_message,
        })

      if (mErr) throw mErr

      // Notify participants
      const notifInserts = input.participant_ids
        .filter((uid) => uid !== profile.id)
        .map((uid) => ({
          user_id: uid,
          category: 'message' as const,
          priority: 'normal' as const,
          title: `New message from ${profile.full_name}`,
          body: input.subject,
          entity_type: 'message_thread',
          entity_id: thread.id,
          action_url: `/messages/${thread.id}`,
        }))

      if (notifInserts.length > 0) {
        await supabase.from('notifications').insert(notifInserts)
      }

      return thread as MessageThread
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads'] })
      toast.success('Thread created')
    },
  })
}

export function useSendMessage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { thread_id: string; content: string }) => {
      if (!profile?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id: input.thread_id,
          sender_id: profile.id,
          content: input.content,
        })
        .select()
        .single()

      if (error) throw error

      // Mark thread as read for sender
      await supabase
        .from('message_thread_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('thread_id', input.thread_id)
        .eq('user_id', profile.id)

      // Notify other participants
      const { data: participants } = await supabase
        .from('message_thread_participants')
        .select('user_id')
        .eq('thread_id', input.thread_id)
        .neq('user_id', profile.id)

      if (participants?.length) {
        const { data: thread } = await supabase
          .from('message_threads')
          .select('subject')
          .eq('id', input.thread_id)
          .single()

        await supabase.from('notifications').insert(
          participants.map((p) => ({
            user_id: p.user_id,
            category: 'message' as const,
            priority: 'normal' as const,
            title: `${profile.full_name} replied`,
            body: thread?.subject ?? 'New message',
            entity_type: 'message_thread',
            entity_id: input.thread_id,
            action_url: `/messages/${input.thread_id}`,
          }))
        )
      }

      return data as Message
    },
    onSuccess: (_, { thread_id }) => {
      queryClient.invalidateQueries({ queryKey: ['thread-messages', thread_id] })
      queryClient.invalidateQueries({ queryKey: ['message-threads'] })
    },
  })
}

export function useMarkThreadRead() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (threadId: string) => {
      if (!profile?.id) return

      const { error } = await supabase
        .from('message_thread_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .eq('user_id', profile.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

export function useStaffMembers() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('is_active', true)
        .neq('role', 'participant_portal')
        .order('full_name')

      if (error) throw error
      return (data ?? []).filter((p) => p.id !== profile?.id)
    },
    enabled: !!profile?.id,
  })
}
