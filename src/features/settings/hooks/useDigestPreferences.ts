import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types'

type DigestPreferences = Tables<'email_digest_preferences'>

export function useDigestPreferences() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['digest-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('email_digest_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data as DigestPreferences | null
    },
    enabled: !!user?.id,
  })
}

export function useUpsertDigestPreferences() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (prefs: Partial<Omit<DigestPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_sent_at'>>) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('email_digest_preferences')
        .upsert(
          {
            user_id: user.id,
            ...prefs,
            updated_at: new Date().toISOString(),
          } as never,
          { onConflict: 'user_id' }
        )
        .select()
        .single()

      if (error) throw error
      return data as unknown as DigestPreferences
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digest-preferences'] })
      toast.success('Digest preferences saved')
    },
    onError: () => {
      toast.error('Failed to save digest preferences')
    },
  })
}
