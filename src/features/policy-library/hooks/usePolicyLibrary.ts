import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from 'sonner'

// ─── Types (local until types are regenerated) ────────────────

export interface PolicyMaster {
  id: string
  title: string
  source: string
  category: string
  description: string | null
  owner_id: string | null
  review_cycle_months: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PolicyVersion {
  id: string
  master_id: string
  version_number: number
  status: 'draft' | 'current' | 'superseded'
  effective_date: string | null
  review_date: string | null
  change_summary: string | null
  superseded_by: string | null
  superseded_at: string | null
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  created_at: string
}

export interface PolicyMasterWithVersion extends PolicyMaster {
  current_version: PolicyVersion | null
  version_count: number
}

// ─── Masters ──────────────────────────────────────────────────

export function usePolicyMasters() {
  return useQuery({
    queryKey: ['policy-masters'],
    queryFn: async () => {
      // Fetch masters
      const { data: masters, error: mErr } = await supabase
        .from('policy_document_masters')
        .select('*')
        .order('title')
      if (mErr) throw mErr

      // Fetch all versions to compute current + count
      const { data: versions, error: vErr } = await supabase
        .from('policy_document_versions')
        .select('*')
        .order('version_number', { ascending: false })
      if (vErr) throw vErr

      const versionsByMaster = new Map<string, PolicyVersion[]>()
      for (const v of (versions ?? []) as PolicyVersion[]) {
        const existing = versionsByMaster.get(v.master_id) ?? []
        existing.push(v)
        versionsByMaster.set(v.master_id, existing)
      }

      return ((masters ?? []) as PolicyMaster[]).map((m): PolicyMasterWithVersion => {
        const mvs = versionsByMaster.get(m.id) ?? []
        return {
          ...m,
          current_version: mvs.find((v) => v.status === 'current') ?? null,
          version_count: mvs.length,
        }
      })
    },
  })
}

export function usePolicyMaster(id: string | undefined) {
  return useQuery({
    queryKey: ['policy-master', id],
    queryFn: async () => {
      if (!id) throw new Error('No master ID')
      const { data, error } = await supabase
        .from('policy_document_masters')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as PolicyMaster
    },
    enabled: !!id,
  })
}

export function useUpdatePolicyMaster() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<PolicyMaster> & { id: string }) => {
      const { data, error } = await supabase
        .from('policy_document_masters')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as PolicyMaster
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['policy-masters'] })
      qc.invalidateQueries({ queryKey: ['policy-master', id] })
    },
  })
}

// ─── Versions ─────────────────────────────────────────────────

export function usePolicyVersions(masterId: string | undefined) {
  return useQuery({
    queryKey: ['policy-versions', masterId],
    queryFn: async () => {
      if (!masterId) return []
      const { data, error } = await supabase
        .from('policy_document_versions')
        .select('*')
        .eq('master_id', masterId)
        .order('version_number', { ascending: false })
      if (error) throw error
      return (data ?? []) as PolicyVersion[]
    },
    enabled: !!masterId,
  })
}

// ─── Supersede (create new version via RPC) ───────────────────

export function useSupersedePolicy() {
  const qc = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({
      masterId,
      changeSummary,
      effectiveDate,
      reviewDate,
    }: {
      masterId: string
      changeSummary: string
      effectiveDate?: string
      reviewDate?: string
    }) => {
      const { data, error } = await supabase.rpc('supersede_policy_version', {
        p_master_id: masterId,
        p_change_summary: changeSummary,
        p_effective_date: effectiveDate ?? new Date().toISOString().split('T')[0],
        p_review_date: reviewDate ?? null,
        p_created_by: profile?.id ?? null,
      } as never)
      if (error) throw error
      return data as string // new version ID
    },
    onSuccess: (_, { masterId }) => {
      qc.invalidateQueries({ queryKey: ['policy-versions', masterId] })
      qc.invalidateQueries({ queryKey: ['policy-masters'] })
      qc.invalidateQueries({ queryKey: ['policy-master', masterId] })
      qc.invalidateQueries({ queryKey: ['policy-documents'] })
      toast.success('New version created — previous version superseded')
    },
    onError: (err: Error) => {
      toast.error('Failed to supersede', { description: err.message })
    },
  })
}

// ─── Publish Draft ────────────────────────────────────────────

export function usePublishDraft() {
  const qc = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({
      versionId,
    }: {
      versionId: string
      masterId: string
    }) => {
      const { error } = await supabase.rpc('publish_policy_draft', {
        p_version_id: versionId,
        p_approved_by: profile?.id ?? null,
      } as never)
      if (error) throw error
    },
    onSuccess: (_, { masterId }) => {
      qc.invalidateQueries({ queryKey: ['policy-versions', masterId] })
      qc.invalidateQueries({ queryKey: ['policy-masters'] })
      qc.invalidateQueries({ queryKey: ['policy-master', masterId] })
      qc.invalidateQueries({ queryKey: ['policy-documents'] })
      toast.success('Draft published — now the current version')
    },
    onError: (err: Error) => {
      toast.error('Failed to publish draft', { description: err.message })
    },
  })
}

// ─── Version Chunks ───────────────────────────────────────────

export function useVersionChunks(versionId: string | undefined) {
  return useQuery({
    queryKey: ['policy-version-chunks', versionId],
    queryFn: async () => {
      if (!versionId) return []
      const { data, error } = await supabase
        .from('policy_documents')
        .select('id, title, chunk_index, content, category, created_at')
        .eq('version_id' as never, versionId)
        .order('chunk_index' as never)
      if (error) throw error
      return (data ?? []) as Array<{ id: string; title: string; chunk_index: number; content: string; category: string | null; created_at: string }>
    },
    enabled: !!versionId,
  })
}
