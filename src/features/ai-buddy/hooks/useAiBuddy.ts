import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from 'sonner'
import type { Tables, Json } from '@/lib/types'
import { serializeRouteMap } from '../lib/routeMap'

type AiConversation = Tables<'ai_conversations'>
type AiMessage = Tables<'ai_messages'>

export interface PolicySource {
  document_id: string
  title: string
  source: string
  category: string
  content: string
  similarity: number
}

// ─── Conversations ───────────────────────────────────────────

export function useConversations() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: ['ai-conversations', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as AiConversation[]
    },
    enabled: !!profile?.id,
  })
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ['ai-conversation', id],
    queryFn: async () => {
      if (!id) throw new Error('No conversation ID')
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as AiConversation
    },
    enabled: !!id,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: async (title?: string) => {
      if (!profile?.id) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({ user_id: profile.id, title: title ?? 'New conversation' } as never)
        .select()
        .single()
      if (error) throw error
      return data as AiConversation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
    },
  })
}

export function useTogglePinConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ is_pinned } as never)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
      queryClient.invalidateQueries({ queryKey: ['ai-conversation', id] })
    },
  })
}

// ─── Messages ────────────────────────────────────────────────

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['ai-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return []
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as AiMessage[]
    },
    enabled: !!conversationId,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      role,
      sources,
    }: {
      conversationId: string
      content: string
      role: 'user' | 'assistant'
      sources?: PolicySource[]
    }) => {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          sources: (sources ?? []) as unknown as Json,
        } as never)
        .select()
        .single()
      if (error) throw error
      return data as AiMessage
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
    },
  })
}

// ─── Policy Search ───────────────────────────────────────────

export function useSearchPolicies() {
  return useMutation({
    mutationFn: async ({
      query,
      currentPage,
    }: {
      query: string
      currentPage?: string
    }) => {
      // Call Supabase Edge Function with route context for internal linking
      const { data, error } = await supabase.functions.invoke('ai-buddy-search', {
        body: {
          query,
          currentPage: currentPage ?? null,
          routeMap: serializeRouteMap(),
        },
      })
      if (error) throw error
      return data as { sources: PolicySource[]; answer: string }
    },
    onError: (err: Error) => {
      toast.error('AI Buddy error', { description: err.message })
    },
  })
}

// ─── Ask AI Buddy (combined search + answer) ─────────────────

export function useAskAiBuddy() {
  const sendMessage = useSendMessage()
  const searchPolicies = useSearchPolicies()
  const createConversation = useCreateConversation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      question,
      conversationId,
      currentPage,
    }: {
      question: string
      conversationId?: string
      currentPage?: string
    }) => {
      // Create conversation if needed
      let convId = conversationId
      if (!convId) {
        const conv = await createConversation.mutateAsync(undefined)
        convId = conv.id
      }

      // Save user message
      await sendMessage.mutateAsync({
        conversationId: convId,
        content: question,
        role: 'user',
      })

      // Search policies and get AI answer with route context
      const result = await searchPolicies.mutateAsync({ query: question, currentPage })

      // Save assistant message with sources
      await sendMessage.mutateAsync({
        conversationId: convId,
        content: result.answer,
        role: 'assistant',
        sources: result.sources,
      })

      return { conversationId: convId, answer: result.answer, sources: result.sources }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
    },
  })
}

// ─── Suggested Questions ─────────────────────────────────────

export function useSuggestedQuestions() {
  return useQuery({
    queryKey: ['ai-buddy-suggested-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisation')
        .select('settings')
        .single()
      if (error) throw error
      const row = data as { settings: Record<string, unknown> } | null
      return (row?.settings?.ai_buddy_suggested_questions as string[]) ?? []
    },
  })
}

// ─── Policy Documents (admin) ────────────────────────────────

export function usePolicyDocuments() {
  return useQuery({
    queryKey: ['policy-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('policy_documents')
        .select('*')
        .eq('is_active', true)
        .order('source')
        .order('chunk_index')
      if (error) throw error
      return (data ?? []) as Tables<'policy_documents'>[]
    },
  })
}

export function usePolicyDocumentSources() {
  return useQuery({
    queryKey: ['policy-document-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('policy_documents')
        .select('source, category, title')
        .eq('is_active', true)
      if (error) throw error
      // Deduplicate by source
      const rows = (data ?? []) as Array<{ source: string; category: string; title: string }>
      const sourcesMap = new Map<string, { source: string; category: string; title: string; chunks: number }>()
      for (const doc of rows) {
        const existing = sourcesMap.get(doc.source)
        if (existing) {
          existing.chunks++
        } else {
          sourcesMap.set(doc.source, { source: doc.source, category: doc.category, title: doc.title, chunks: 1 })
        }
      }
      return Array.from(sourcesMap.values())
    },
  })
}
