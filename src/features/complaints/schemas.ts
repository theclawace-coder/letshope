import { z } from 'zod'

export const complaintFormSchema = z.object({
  participant_id: z.string().min(1, 'Select a participant'),
  complainant_name: z.string().min(1, 'Complainant name is required'),
  complainant_relationship: z.string().optional(),
  complaint_date: z.string().min(1, 'Complaint date is required'),
  category: z.enum(
    ['service_delivery', 'staff_conduct', 'communication', 'safety', 'financial', 'privacy', 'access', 'other'],
    { error: 'Select a category' }
  ),
  description: z.string().min(10, 'Please provide a detailed description (at least 10 characters)'),
})

export type ComplaintFormData = z.infer<typeof complaintFormSchema>

export const complaintResolutionSchema = z.object({
  status: z.enum(['resolved', 'closed']),
  resolution: z.string().min(1, 'Resolution notes are required'),
})

export type ComplaintResolutionData = z.infer<typeof complaintResolutionSchema>
