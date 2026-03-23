import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types/database'

export function useDocumentVersions(documentId?: string) {
  return useQuery({
    queryKey: ['document-versions', documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId!)
        .order('version_number', { ascending: false })

      if (error) throw error
      return data as Tables<'document_versions'>[]
    },
  })
}

export function useCreateDocumentVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      documentId,
      file,
      changeSummary,
      uploadedBy,
    }: {
      documentId: string
      file: File
      changeSummary?: string
      uploadedBy?: string
    }) => {
      // Get current document to determine next version number
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('version, file_path, category, participant_id, worker_id')
        .eq('id', documentId)
        .single()

      if (docError) throw docError

      const nextVersion = (doc.version || 1) + 1

      // Build storage path based on existing pattern
      const ext = file.name.split('.').pop()
      const basePath = doc.file_path.replace(/\/[^/]+$/, '')
      const newFilePath = `${basePath}/${file.name.replace(`.${ext}`, '')}_v${nextVersion}.${ext}`

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(newFilePath, file)

      if (uploadError) throw uploadError

      // Create version record
      const { error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: nextVersion,
          file_path: newFilePath,
          file_size: file.size,
          mime_type: file.type,
          change_summary: changeSummary,
          uploaded_by: uploadedBy,
        })

      if (versionError) throw versionError

      // Update the main document record
      const { data: updated, error: updateError } = await supabase
        .from('documents')
        .update({
          version: nextVersion,
          file_path: newFilePath,
          file_size: file.size,
          mime_type: file.type,
        })
        .eq('id', documentId)
        .select()
        .single()

      if (updateError) throw updateError

      return updated
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ['document-versions', documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
