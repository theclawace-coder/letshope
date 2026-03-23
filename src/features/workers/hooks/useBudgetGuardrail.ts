import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface BudgetGuardrailResult {
  /** Participant's total allocated budget across all categories */
  totalBudget: number
  /** Budget allocated for the specific category (core/capacity_building/capital) */
  categoryBudget: number | null
  /** Total already invoiced (approved/submitted/paid) */
  invoicedTotal: number
  /** Total estimated cost of scheduled bookings not yet invoiced */
  scheduledTotal: number
  /** Remaining budget after invoiced + scheduled */
  remaining: number
  /** Remaining in the specific category (null if no category selected) */
  categoryRemaining: number | null
  /** Category-level scheduled total */
  categoryScheduled: number
  /** Category-level invoiced total */
  categoryInvoiced: number
  /** Whether adding this booking's cost would exceed total budget */
  wouldExceedTotal: boolean
  /** Whether adding this booking's cost would exceed category budget */
  wouldExceedCategory: boolean
  /** Warning level: 'none' | 'approaching' (>80%) | 'exceeded' */
  level: 'none' | 'approaching' | 'exceeded'
  /** Plan date range */
  planStart: string | null
  planEnd: string | null
}

const CATEGORY_BUDGET_MAP: Record<string, 'budget_core' | 'budget_capacity_building' | 'budget_capital'> = {
  core: 'budget_core',
  capacity_building: 'budget_capacity_building',
  capital: 'budget_capital',
}

/**
 * Real-time budget guardrail for the booking dialog.
 * Checks whether a new/edited booking would breach the participant's NDIS plan budget.
 */
export function useBudgetGuardrail(
  participantId: string | undefined,
  estimatedCost: number,
  category?: string | null,
  excludeBookingId?: string,
) {
  return useQuery<BudgetGuardrailResult>({
    queryKey: ['budget-guardrail', participantId, estimatedCost, category, excludeBookingId],
    queryFn: async () => {
      if (!participantId) throw new Error('No participant ID')

      // 1. Fetch participant budget allocations
      const { data: participant, error: pErr } = await supabase
        .from('participants')
        .select('budget_core, budget_capacity_building, budget_capital, plan_start_date, plan_end_date')
        .eq('id', participantId)
        .single()
      if (pErr) throw pErr

      const p = participant as Record<string, unknown>
      const budgetCore = (p.budget_core as number) || 0
      const budgetCB = (p.budget_capacity_building as number) || 0
      const budgetCapital = (p.budget_capital as number) || 0
      const totalBudget = budgetCore + budgetCB + budgetCapital

      // 2. Sum invoiced totals (non-cancelled/void/rejected invoices)
      const { data: invoices, error: iErr } = await supabase
        .from('invoices')
        .select('id, total')
        .eq('participant_id', participantId)
        .not('status', 'in', '("cancelled","void","rejected")')
      if (iErr) throw iErr

      const invoicedTotal = (invoices ?? []).reduce(
        (sum, inv) => sum + ((inv as Record<string, unknown>).total as number || 0),
        0,
      )

      // 3. Sum estimated_cost from scheduled/in-progress bookings (not yet invoiced)
      let bookingsQuery = supabase
        .from('bookings')
        .select('id, estimated_cost, support_item_number')
        .eq('participant_id', participantId)
        .in('status', ['scheduled', 'checked_in', 'checked_out'])
        .not('estimated_cost', 'is', null)

      if (excludeBookingId) {
        bookingsQuery = bookingsQuery.neq('id', excludeBookingId)
      }

      const { data: bookings, error: bErr } = await bookingsQuery
      if (bErr) throw bErr

      const scheduledTotal = (bookings ?? []).reduce(
        (sum, b) => sum + ((b as Record<string, unknown>).estimated_cost as number || 0),
        0,
      )

      // 4. Category-specific calculations
      let categoryBudget: number | null = null
      let categoryScheduled = 0
      let categoryInvoiced = 0
      let categoryRemaining: number | null = null

      if (category && CATEGORY_BUDGET_MAP[category]) {
        categoryBudget = (p[CATEGORY_BUDGET_MAP[category]] as number) || 0

        // Get category-level invoice spend from line items
        const invoiceIds = (invoices ?? []).map((inv) => (inv as Record<string, unknown>).id as string)
        if (invoiceIds.length > 0) {
          const { data: lineItems, error: liErr } = await supabase
            .from('invoice_line_items')
            .select('total, registration_group')
            .in('invoice_id', invoiceIds)
          if (!liErr && lineItems) {
            // Map registration_group to category by checking keywords
            for (const li of lineItems as Record<string, unknown>[]) {
              const group = ((li.registration_group as string) || '').toLowerCase()
              const liCategory = group.includes('capital')
                ? 'capital'
                : group.includes('capacity')
                  ? 'capacity_building'
                  : 'core'
              if (liCategory === category) {
                categoryInvoiced += (li.total as number) || 0
              }
            }
          }
        }

        // Get category-level scheduled bookings by looking up their support items
        if (bookings && bookings.length > 0) {
          const supportItemNumbers = (bookings as Record<string, unknown>[])
            .map((b) => b.support_item_number as string)
            .filter(Boolean)

          if (supportItemNumbers.length > 0) {
            const { data: priceItems, error: piErr } = await supabase
              .from('ndis_price_guide')
              .select('support_item_number, category')
              .in('support_item_number', supportItemNumbers)
            if (!piErr && priceItems) {
              const categoryMap = new Map(
                (priceItems as Record<string, unknown>[]).map((pi) => [
                  pi.support_item_number as string,
                  pi.category as string,
                ]),
              )
              for (const b of bookings as Record<string, unknown>[]) {
                const bCategory = categoryMap.get(b.support_item_number as string)
                if (bCategory === category) {
                  categoryScheduled += (b.estimated_cost as number) || 0
                }
              }
            }
          }
        }

        categoryRemaining = categoryBudget - categoryInvoiced - categoryScheduled
      }

      // 5. Calculate overall remaining
      const remaining = totalBudget - invoicedTotal - scheduledTotal
      const remainingAfterBooking = remaining - estimatedCost
      const wouldExceedTotal = remainingAfterBooking < 0
      const wouldExceedCategory = categoryRemaining !== null
        ? (categoryRemaining - estimatedCost) < 0
        : false

      // 6. Determine warning level
      let level: BudgetGuardrailResult['level'] = 'none'
      if (wouldExceedTotal || wouldExceedCategory) {
        level = 'exceeded'
      } else if (totalBudget > 0) {
        const utilisationAfter = (invoicedTotal + scheduledTotal + estimatedCost) / totalBudget
        if (utilisationAfter >= 0.8) {
          level = 'approaching'
        }
      }

      return {
        totalBudget,
        categoryBudget,
        invoicedTotal,
        scheduledTotal,
        remaining,
        categoryRemaining,
        categoryScheduled,
        categoryInvoiced,
        wouldExceedTotal,
        wouldExceedCategory,
        level,
        planStart: p.plan_start_date as string | null,
        planEnd: p.plan_end_date as string | null,
      }
    },
    enabled: !!participantId && estimatedCost > 0,
    staleTime: 30_000, // cache for 30s to avoid excessive re-fetching on every keystroke
  })
}
