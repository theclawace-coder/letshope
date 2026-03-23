import { z } from 'zod'

export const lineItemSchema = z.object({
  support_item_number: z.string().optional(),
  support_item_name: z.string().min(1, 'Service name is required'),
  registration_group: z.string().optional(),
  date_of_service: z.string().min(1, 'Date is required'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.enum(['hour', 'each', 'day', 'week', 'km']),
  unit_price: z.number().min(0, 'Price must be 0 or greater'),
  ndis_max_price: z.number().optional(),
  gst_applicable: z.boolean().default(false),
  claim_type: z.enum([
    'standard', 'non_face_to_face', 'provider_travel',
    'cancellation_short_notice', 'cancellation_no_show',
    'report_writing', 'irregular_sil_supports',
  ]).default('standard'),
  worker_id: z.string().optional(),
  booking_id: z.string().optional(),
  notes: z.string().optional(),
})

export type LineItemFormData = z.infer<typeof lineItemSchema>

export const invoiceFormSchema = z.object({
  participant_id: z.string().min(1, 'Select a participant'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().optional(),
  period_start: z.string().min(1, 'Period start is required'),
  period_end: z.string().min(1, 'Period end is required'),
  funding_type: z.enum(['ndia_managed', 'plan_managed', 'self_managed'], {
    error: 'Select funding type',
  }),
  notes: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
})

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>
