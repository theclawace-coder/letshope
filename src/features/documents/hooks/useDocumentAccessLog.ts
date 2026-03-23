import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables, InsertTables } from '@/lib/types/database'

export function useDocumentAccessLog(documentId?: string) {
  return useQuery({
    queryKey: ['document-access-log', documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_access_log')
        .select('*, profiles:performed_by(full_name)')
        .eq('document_id', documentId!)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as (Tables<'document_access_log'> & { profiles: { full_name: string } | null })[]
    },
  })
}

export function useLogDocumentAccess() {
  return useMutation({
    mutationFn: async (entry: InsertTables<'document_access_log'>) => {
      const { error } = await supabase
        .from('document_access_log')
        .insert(entry)

      if (error) throw error
    },
  })
}
