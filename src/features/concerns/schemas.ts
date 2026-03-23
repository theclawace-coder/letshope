import { z } from 'zod'

export const concernFormSchema = z.object({
  participant_id: z.string().min(1, 'Select a participant'),
  progress_note_id: z.string().optional(),
  concern_type: z.enum(['safety', 'health', 'behavioral', 'environmental', 'financial', 'other'], {
    error: 'Select a concern type',
  }),
  severity: z.enum(['low', 'medium', 'high', 'critical'], {
    error: 'Select severity level',
  }),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Please provide a detailed description (at least 10 characters)'),
  actions_requested: z.string().optional(),
})

export type ConcernFormData = z.infer<typeof concernFormSchema>

export const concernResolutionSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  resolution_notes: z.string().min(1, 'Resolution notes are required'),
})

export type ConcernResolutionData = z.infer<typeof concernResolutionSchema>
