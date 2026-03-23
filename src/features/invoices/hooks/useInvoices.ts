import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type Invoice = Tables<'invoices'>
type LineItem = Tables<'invoice_line_items'>

export interface InvoiceWithNames extends Invoice {
  participant_name?: string
  line_items?: LineItem[]
}

interface InvoiceFilters {
  participantId?: string
  status?: string
  fundingType?: string
}

export function useInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*, participants(first_name, last_name)')
        .order('created_at', { ascending: false })

      if (filters?.participantId) {
        query = query.eq('participant_id', filters.participantId)
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters?.fundingType && filters.fundingType !== 'all') {
        query = query.eq('funding_type', filters.fundingType)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const participants = row.participants as { first_name: string; last_name: string } | null
        return {
          ...row,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
        } as InvoiceWithNames
      })
    },
  })
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      if (!id) throw new Error('No invoice ID')

      const { data, error } = await supabase
        .from('invoices')
        .select('*, participants(first_name, last_name, ndis_number, funding_type, budget_core, budget_capacity_building, budget_capital, plan_start_date, plan_end_date)')
        .eq('id', id)
        .single()
      if (error) throw error

      const { data: lineItems, error: lineError } = await supabase
        .from('invoice_line_items')
        .select('*, workers(first_name, last_name)')
        .eq('invoice_id', id)
        .order('date_of_service', { ascending: true })
      if (lineError) throw lineError

      const row = data as Record<string, unknown>
      const participants = row.participants as { first_name: string; last_name: string } | null
      return {
        ...row,
        participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
        line_items: (lineItems ?? []) as LineItem[],
      } as InvoiceWithNames & { participants: Record<string, unknown> }
    },
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      invoice,
      lineItems,
    }: {
      invoice: Record<string, unknown>
      lineItems: Record<string, unknown>[]
    }) => {
      // Generate invoice number
      const { data: invNum, error: numError } = await supabase.rpc('generate_invoice_number')
      if (numError) throw numError

      // Calculate totals
      let subtotal = 0
      let gst = 0
      for (const li of lineItems) {
        subtotal += (li.total as number) || 0
        if (li.gst_applicable) {
          gst += ((li.total as number) || 0) * 0.1
        }
      }

      const { data: inv, error: invError } = await supabase
        .from('invoices')
        .insert({
          ...invoice,
          invoice_number: invNum,
          subtotal: Math.round(subtotal * 100) / 100,
          gst: Math.round(gst * 100) / 100,
          total: Math.round((subtotal + gst) * 100) / 100,
        } as never)
        .select()
        .single()
      if (invError) throw invError

      const invoiceId = (inv as unknown as Invoice).id

      // Insert line items
      const itemsWithInvoice = lineItems.map((li) => ({
        ...li,
        invoice_id: invoiceId,
      }))

      const { error: itemsError } = await supabase
        .from('invoice_line_items')
        .insert(itemsWithInvoice as never)
      if (itemsError) throw itemsError

      return inv as unknown as Invoice
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejection_reason,
    }: {
      id: string
      status: Invoice['status']
      rejection_reason?: string
    }) => {
      const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }

      if (status === 'submitted') updates.submitted_at = new Date().toISOString()
      if (status === 'paid') updates.paid_at = new Date().toISOString()
      if (rejection_reason) updates.rejection_reason = rejection_reason

      const { data, error } = await supabase
        .from('invoices')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Invoice
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useNdisPriceGuide(registrationGroup?: string) {
  return useQuery({
    queryKey: ['ndis-price-guide', registrationGroup],
    queryFn: async () => {
      let query = supabase
        .from('ndis_price_guide')
        .select('*')
        .eq('is_active', true)
        .order('support_item_number')

      if (registrationGroup) {
        query = query.eq('registration_group', registrationGroup)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Tables<'ndis_price_guide'>[]
    },
  })
}

export function useParticipantBudget(participantId: string | undefined) {
  return useQuery({
    queryKey: ['participant-budget', participantId],
    queryFn: async () => {
      if (!participantId) throw new Error('No participant ID')

      // Get participant budget fields
      const { data: participant, error: pError } = await supabase
        .from('participants')
        .select('budget_core, budget_capacity_building, budget_capital, plan_start_date, plan_end_date')
        .eq('id', participantId)
        .single()
      if (pError) throw pError

      // Get used amounts from non-cancelled invoices
      const { data: invoices, error: iError } = await supabase
        .from('invoices')
        .select('id, status, total')
        .eq('participant_id', participantId)
        .not('status', 'in', '("cancelled","void","rejected")')
      if (iError) throw iError

      const totalUsed = (invoices ?? []).reduce((sum, inv) => sum + ((inv as Record<string, unknown>).total as number || 0), 0)
      const totalBudget = ((participant as Record<string, unknown>).budget_core as number || 0) +
        ((participant as Record<string, unknown>).budget_capacity_building as number || 0) +
        ((participant as Record<string, unknown>).budget_capital as number || 0)

      return {
        budget_core: (participant as Record<string, unknown>).budget_core as number | null,
        budget_capacity_building: (participant as Record<string, unknown>).budget_capacity_building as number | null,
        budget_capital: (participant as Record<string, unknown>).budget_capital as number | null,
        plan_start_date: (participant as Record<string, unknown>).plan_start_date as string | null,
        plan_end_date: (participant as Record<string, unknown>).plan_end_date as string | null,
        total_budget: totalBudget,
        total_used: totalUsed,
        total_remaining: totalBudget - totalUsed,
        invoice_count: invoices?.length ?? 0,
      }
    },
    enabled: !!participantId,
  })
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('status, total')

      if (error) throw error

      const stats = {
        draft: 0,
        approved: 0,
        submitted: 0,
        paid: 0,
        rejected: 0,
        total_outstanding: 0,
        total_paid: 0,
      }

      for (const inv of (data ?? []) as { status: string; total: number }[]) {
        if (inv.status === 'draft') stats.draft++
        if (inv.status === 'approved') stats.approved++
        if (inv.status === 'submitted') {
          stats.submitted++
          stats.total_outstanding += inv.total || 0
        }
        if (inv.status === 'paid') {
          stats.paid++
          stats.total_paid += inv.total || 0
        }
        if (inv.status === 'rejected') stats.rejected++
      }

      return stats
    },
  })
}
