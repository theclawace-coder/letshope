import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type CreditNote = Tables<'credit_notes'>
type CreditNoteLineItem = Tables<'credit_note_line_items'>

export interface CreditNoteWithDetails extends CreditNote {
  participant_name?: string
  invoice_number?: string
  line_items?: CreditNoteLineItem[]
}

export function useCreditNotes(invoiceId?: string) {
  return useQuery({
    queryKey: ['credit-notes', invoiceId],
    queryFn: async () => {
      let query = supabase
        .from('credit_notes')
        .select('*, invoices(invoice_number), participants(first_name, last_name)')
        .order('created_at', { ascending: false })

      if (invoiceId) {
        query = query.eq('invoice_id', invoiceId)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const participants = row.participants as { first_name: string; last_name: string } | null
        const invoices = row.invoices as { invoice_number: string } | null
        return {
          ...row,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
          invoice_number: invoices?.invoice_number ?? undefined,
        } as CreditNoteWithDetails
      })
    },
  })
}

export function useCreditNote(id: string | undefined) {
  return useQuery({
    queryKey: ['credit-note', id],
    queryFn: async () => {
      if (!id) throw new Error('No credit note ID')

      const { data, error } = await supabase
        .from('credit_notes')
        .select('*, invoices(invoice_number, participant_id), participants(first_name, last_name, ndis_number)')
        .eq('id', id)
        .single()
      if (error) throw error

      const { data: lineItems, error: lineError } = await supabase
        .from('credit_note_line_items')
        .select('*')
        .eq('credit_note_id', id)
        .order('date_of_service', { ascending: true })
      if (lineError) throw lineError

      const row = data as Record<string, unknown>
      const participants = row.participants as { first_name: string; last_name: string } | null
      const invoices = row.invoices as { invoice_number: string } | null
      return {
        ...row,
        participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
        invoice_number: invoices?.invoice_number ?? undefined,
        line_items: (lineItems ?? []) as CreditNoteLineItem[],
      } as CreditNoteWithDetails
    },
    enabled: !!id,
  })
}

export function useCreateCreditNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      creditNote,
      lineItems,
    }: {
      creditNote: Record<string, unknown>
      lineItems: Record<string, unknown>[]
    }) => {
      // Generate credit note number
      const { data: cnNum, error: numError } = await supabase.rpc('generate_credit_note_number')
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

      const { data: cn, error: cnError } = await supabase
        .from('credit_notes')
        .insert({
          ...creditNote,
          credit_note_number: cnNum,
          subtotal: Math.round(subtotal * 100) / 100,
          gst: Math.round(gst * 100) / 100,
          total: Math.round((subtotal + gst) * 100) / 100,
        } as never)
        .select()
        .single()
      if (cnError) throw cnError

      const creditNoteId = (cn as unknown as CreditNote).id

      // Insert line items
      const itemsWithCN = lineItems.map((li) => ({
        ...li,
        credit_note_id: creditNoteId,
      }))

      const { error: itemsError } = await supabase
        .from('credit_note_line_items')
        .insert(itemsWithCN as never)
      if (itemsError) throw itemsError

      return cn as unknown as CreditNote
    },
    onSuccess: (_, { creditNote }) => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', creditNote.invoice_id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateCreditNoteStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: CreditNote['status']
    }) => {
      const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }

      if (status === 'approved') {
        updates.approved_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('credit_notes')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as CreditNote
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] })
      queryClient.invalidateQueries({ queryKey: ['credit-note', id] })
      queryClient.invalidateQueries({ queryKey: ['invoice', (data as CreditNote).invoice_id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
