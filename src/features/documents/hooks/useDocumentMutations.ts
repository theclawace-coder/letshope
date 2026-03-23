import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { UpdateTables } from '@/lib/types/database'

export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & UpdateTables<'documents'>) => {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      name,
      category,
      participantId,
      workerId,
      folderId,
      description,
      tags,
      status,
      uploadedBy,
    }: {
      file: File
      name: string
      category: string
      participantId?: string
      workerId?: string
      folderId?: string
      description?: string
      tags?: string[]
      status?: 'draft' | 'pending_review' | 'approved'
      uploadedBy?: string
    }) => {
      // Build storage path
      const entityType = participantId ? 'participants' : workerId ? 'workers' : 'organisation'
      const entityId = participantId || workerId || 'general'
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `${entityType}/${entityId}/${category}/${sanitizedName}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          name,
          category,
          participant_id: participantId,
          worker_id: workerId,
          folder_id: folderId,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          description,
          tags: tags || [],
          status: status || 'approved',
          uploaded_by: uploadedBy,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useArchiveDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('documents')
        .update({ status: 'archived' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useMoveDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string | null }) => {
      const { data, error } = await supabase
        .from('documents')
        .update({ folder_id: folderId })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
