import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables, Json } from '@/lib/types'

interface ValidateTokenResult {
  token_id: string
  participant_id: string
  email: string
  role: string
  name: string
  relationship: string | null
  participant_first_name: string
  participant_last_name: string
  participant_preferred_name: string | null
}

export interface PortalSession {
  tokenId: string
  participantId: string
  email: string
  role: string
  name: string
  relationship: string | null
  participantFirstName: string
  participantLastName: string
  participantPreferredName: string | null
}

const PORTAL_TOKEN_KEY = 'hope_portal_token'

export function getStoredToken(): string | null {
  return sessionStorage.getItem(PORTAL_TOKEN_KEY)
}

export function storeToken(token: string) {
  sessionStorage.setItem(PORTAL_TOKEN_KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(PORTAL_TOKEN_KEY)
}

export function usePortalAuth() {
  const queryClient = useQueryClient()

  const session = useQuery({
    queryKey: ['portal-session'],
    queryFn: async (): Promise<PortalSession | null> => {
      const token = getStoredToken()
      if (!token) return null

      const { data: rawData, error } = await supabase.rpc('validate_portal_token' as never, {
        p_token: token,
      } as never)
      const data = rawData as unknown as ValidateTokenResult[] | null
      if (error || !data || data.length === 0) {
        clearToken()
        return null
      }

      const row = data[0]
      return {
        tokenId: row.token_id,
        participantId: row.participant_id,
        email: row.email,
        role: row.role,
        name: row.name,
        relationship: row.relationship,
        participantFirstName: row.participant_first_name,
        participantLastName: row.participant_last_name,
        participantPreferredName: row.participant_preferred_name,
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const login = useMutation({
    mutationFn: async (token: string): Promise<PortalSession> => {
      const { data: rawData, error } = await supabase.rpc('validate_portal_token' as never, {
        p_token: token,
      } as never)
      const data = rawData as unknown as ValidateTokenResult[] | null
      if (error) throw new Error('Invalid or expired access link')
      if (!data || data.length === 0) throw new Error('Invalid or expired access link')

      storeToken(token)
      const row = data[0]
      return {
        tokenId: row.token_id,
        participantId: row.participant_id,
        email: row.email,
        role: row.role,
        name: row.name,
        relationship: row.relationship,
        participantFirstName: row.participant_first_name,
        participantLastName: row.participant_last_name,
        participantPreferredName: row.participant_preferred_name,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-session'] })
    },
  })

  function logout() {
    clearToken()
    queryClient.setQueryData(['portal-session'], null)
    queryClient.removeQueries({ queryKey: ['portal'] })
  }

  return {
    session: session.data ?? null,
    isLoading: session.isLoading,
    login,
    logout,
  }
}

export function usePortalParticipant(participantId: string | undefined) {
  return useQuery({
    queryKey: ['portal', 'participant', participantId],
    queryFn: async () => {
      if (!participantId) throw new Error('No participant ID')
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('id', participantId)
        .single()
      if (error) throw error
      return data as Tables<'participants'>
    },
    enabled: !!participantId,
  })
}

interface BudgetParticipant {
  budget_core: number | null
  budget_capacity_building: number | null
  budget_capital: number | null
  plan_start_date: string | null
  plan_end_date: string | null
  funding_type: string | null
}

interface InvoiceLineItemWithInvoice {
  registration_group: string | null
  total: number
  invoices: { participant_id: string; status: string }
}

export function usePortalBudget(participantId: string | undefined) {
  return useQuery({
    queryKey: ['portal', 'budget', participantId],
    queryFn: async () => {
      if (!participantId) throw new Error('No participant ID')

      // Get participant budget allocations
      const { data: rawParticipant, error: pErr } = await supabase
        .from('participants')
        .select('budget_core, budget_capacity_building, budget_capital, plan_start_date, plan_end_date, funding_type')
        .eq('id', participantId)
        .single()
      if (pErr) throw pErr
      const participant = rawParticipant as unknown as BudgetParticipant

      // Get invoice totals grouped by budget category
      const { data: rawInvoices, error: iErr } = await supabase
        .from('invoice_line_items')
        .select('registration_group, total, invoices!inner(participant_id, status)')
        .eq('invoices.participant_id', participantId)
        .in('invoices.status', ['approved', 'submitted', 'paid'])
      if (iErr) throw iErr
      const invoices = (rawInvoices ?? []) as unknown as InvoiceLineItemWithInvoice[]

      let usedCore = 0
      let usedCapacity = 0
      let usedCapital = 0

      for (const item of invoices) {
        const rg = (item.registration_group ?? '').toLowerCase()
        if (rg.includes('capital')) {
          usedCapital += item.total
        } else if (rg.includes('capacity') || rg.includes('cb_')) {
          usedCapacity += item.total
        } else {
          usedCore += item.total
        }
      }

      return {
        core: { allocated: participant.budget_core ?? 0, used: usedCore },
        capacityBuilding: { allocated: participant.budget_capacity_building ?? 0, used: usedCapacity },
        capital: { allocated: participant.budget_capital ?? 0, used: usedCapital },
        planStartDate: participant.plan_start_date,
        planEndDate: participant.plan_end_date,
        fundingType: participant.funding_type,
      }
    },
    enabled: !!participantId,
  })
}

export interface PortalNote {
  id: string
  note_date: string
  service_type: string | null
  goals_addressed: string[]
  content: string
  presentation: string | null
  actions_taken: string | null
  worker_name: string
}

export function usePortalNotes(participantId: string | undefined) {
  return useQuery({
    queryKey: ['portal', 'notes', participantId],
    queryFn: async (): Promise<PortalNote[]> => {
      if (!participantId) throw new Error('No participant ID')
      const { data, error } = await supabase
        .from('progress_notes')
        .select('id, note_date, service_type, goals_addressed, content, presentation, actions_taken, workers!inner(first_name, last_name)')
        .eq('participant_id', participantId)
        .order('note_date', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []).map((row: Record<string, unknown>) => {
        const worker = row.workers as { first_name: string; last_name: string } | null
        return {
          id: row.id as string,
          note_date: row.note_date as string,
          service_type: row.service_type as string | null,
          goals_addressed: (row.goals_addressed ?? []) as string[],
          content: row.content as string,
          presentation: row.presentation as string | null,
          actions_taken: row.actions_taken as string | null,
          worker_name: worker ? `${worker.first_name} ${worker.last_name}` : 'Unknown',
        }
      })
    },
    enabled: !!participantId,
  })
}

export interface PortalBooking {
  id: string
  booking_date: string
  start_time: string
  end_time: string
  service_description: string | null
  status: string
  worker_name: string
  is_group_booking?: boolean
  group_size?: number | null
}

function mapBookingRow(row: Record<string, unknown>): PortalBooking {
  const worker = row.workers as { first_name: string; last_name: string } | null
  return {
    id: row.id as string,
    booking_date: row.booking_date as string,
    start_time: row.start_time as string,
    end_time: row.end_time as string,
    service_description: row.service_description as string | null,
    status: row.status as string,
    worker_name: worker ? `${worker.first_name} ${worker.last_name}` : 'TBA',
    is_group_booking: (row.is_group_booking as boolean) ?? false,
    group_size: (row.group_size as number | null) ?? null,
  }
}

export function usePortalBookings(participantId: string | undefined) {
  return useQuery({
    queryKey: ['portal', 'bookings', participantId],
    queryFn: async (): Promise<PortalBooking[]> => {
      if (!participantId) throw new Error('No participant ID')
      const now = new Date().toISOString()

      // Direct bookings (single or primary participant)
      const { data: directData, error: directError } = await supabase
        .from('bookings')
        .select('id, booking_date, start_time, end_time, service_description, status, is_group_booking, group_size, workers(first_name, last_name)')
        .eq('participant_id', participantId)
        .gte('start_time', now)
        .in('status', ['scheduled', 'checked_in'])
        .order('start_time', { ascending: true })
        .limit(20)
      if (directError) throw directError

      // Group bookings where participant is in booking_participants (but not primary)
      const { data: groupData, error: groupError } = await supabase
        .from('booking_participants')
        .select('booking_id, bookings(id, booking_date, start_time, end_time, service_description, status, is_group_booking, group_size, workers(first_name, last_name))')
        .eq('participant_id', participantId)
        .limit(20)
      if (groupError) throw groupError

      const directBookings = (directData ?? []).map((row: Record<string, unknown>) => mapBookingRow(row))
      const directIds = new Set(directBookings.map((b) => b.id))

      // Add group bookings not already included
      const groupBookings = (groupData ?? [])
        .map((row: Record<string, unknown>) => {
          const booking = row.bookings as Record<string, unknown> | null
          if (!booking) return null
          return mapBookingRow(booking)
        })
        .filter((b): b is PortalBooking => b !== null && !directIds.has(b.id))
        .filter((b) => b.status === 'scheduled' || b.status === 'checked_in')

      const all = [...directBookings, ...groupBookings]
      all.sort((a, b) => a.start_time.localeCompare(b.start_time))
      return all.slice(0, 20)
    },
    enabled: !!participantId,
  })
}

export interface PortalDocument {
  id: string
  name: string
  category: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  created_at: string
}

export function usePortalDocuments(participantId: string | undefined) {
  return useQuery({
    queryKey: ['portal', 'documents', participantId],
    queryFn: async (): Promise<PortalDocument[]> => {
      if (!participantId) throw new Error('No participant ID')
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, category, file_path, file_size, mime_type, created_at')
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as PortalDocument[]
    },
    enabled: !!participantId,
  })
}

export interface PortalGoal {
  id: string
  title: string
  description: string | null
  domain: string
  status: string
  current_progress: number
  target_date: string | null
}

export function usePortalGoals(participantId: string | undefined) {
  return useQuery({
    queryKey: ['portal', 'goals', participantId],
    queryFn: async (): Promise<PortalGoal[]> => {
      if (!participantId) throw new Error('No participant ID')
      const { data, error } = await supabase
        .from('goals')
        .select('id, title, description, domain, status, current_progress, target_date')
        .eq('participant_id', participantId)
        .in('status', ['not_started', 'in_progress', 'achieved'])
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as PortalGoal[]
    },
    enabled: !!participantId,
  })
}

export interface PortalService {
  id: string
  registration_group: string
  is_active: boolean
  worker_name: string
  worker_role?: string
}

export function usePortalServices(participantId: string | undefined) {
  return useQuery({
    queryKey: ['portal', 'services', participantId],
    queryFn: async (): Promise<PortalService[]> => {
      if (!participantId) throw new Error('No participant ID')
      const { data, error } = await supabase
        .from('worker_participant_assignments')
        .select('id, registration_group, is_active, workers(first_name, last_name, role_title)')
        .eq('participant_id', participantId)
        .eq('is_active', true)
      if (error) throw error
      return (data ?? []).map((row: Record<string, unknown>) => {
        const worker = row.workers as { first_name: string; last_name: string; role_title: string | null } | null
        return {
          id: row.id as string,
          registration_group: row.registration_group as string,
          is_active: row.is_active as boolean,
          worker_name: worker ? `${worker.first_name} ${worker.last_name}` : 'Unassigned',
          worker_role: worker?.role_title ?? undefined,
        }
      })
    },
    enabled: !!participantId,
  })
}

export function usePortalLogActivity() {
  return useMutation({
    mutationFn: async (input: { portal_token_id: string; participant_id: string; action: string; metadata?: Json }) => {
      const { error } = await supabase.from('portal_activity_log').insert({
        portal_token_id: input.portal_token_id,
        participant_id: input.participant_id,
        action: input.action,
        metadata: input.metadata ?? {},
      } as never)
      if (error) throw error
    },
  })
}

// Admin hooks for managing portal access
export function usePortalTokens(participantId: string | undefined) {
  return useQuery({
    queryKey: ['portal-tokens', participantId],
    queryFn: async () => {
      if (!participantId) throw new Error('No participant ID')
      const { data, error } = await supabase
        .from('portal_access_tokens')
        .select('*')
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Tables<'portal_access_tokens'>[]
    },
    enabled: !!participantId,
  })
}

export function useCreatePortalToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      participant_id: string
      email: string
      name: string
      role: 'participant' | 'guardian' | 'support_coordinator'
      relationship?: string
      created_by?: string
    }) => {
      const { data, error } = await supabase
        .from('portal_access_tokens')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Tables<'portal_access_tokens'>
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['portal-tokens', vars.participant_id] })
    },
  })
}

export function useTogglePortalToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean; participant_id: string }) => {
      const { error } = await supabase
        .from('portal_access_tokens')
        .update({ is_active } as never)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['portal-tokens', vars.participant_id] })
    },
  })
}

export function useDeletePortalToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; participant_id: string }) => {
      const { error } = await supabase
        .from('portal_access_tokens')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['portal-tokens', vars.participant_id] })
    },
  })
}
