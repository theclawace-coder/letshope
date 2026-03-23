import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types/database'

export function useDocuments(filters?: { participantId?: string; workerId?: string; category?: string }) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.participantId) {
        query = query.eq('participant_id', filters.participantId)
      }
      if (filters?.workerId) {
        query = query.eq('worker_id', filters.workerId)
      }
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Tables<'documents'>[]
    },
  })
}

export function useParticipantDocuments(participantId?: string) {
  return useDocuments(participantId ? { participantId } : undefined)
}

export function useDocumentDownload() {
  async function downloadDocument(doc: Tables<'documents'>) {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(doc.file_path)

    if (error) throw error

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function previewDocument(doc: Tables<'documents'>) {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(doc.file_path)

    if (error) throw error

    const url = URL.createObjectURL(data)
    window.open(url, '_blank')
  }

  return { downloadDocument, previewDocument }
}
