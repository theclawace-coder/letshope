import { z } from 'zod'

export const progressNoteFormSchema = z.object({
  participant_id: z.string().min(1, 'Select a participant'),
  worker_id: z.string().min(1, 'Select a worker'),
  booking_id: z.string().optional(),
  note_date: z.string().min(1, 'Date is required'),
  service_type: z.string().optional(),
  goals_addressed: z.array(z.string()),
  presentation: z.string().optional(),
  actions_taken: z.string().optional(),
  content: z.string().min(1, 'Note content is required'),
  concern_flagged: z.boolean(),
  concern_type: z.string().optional(),
  concern_severity: z.string().optional(),
  concern_title: z.string().optional(),
  concern_description: z.string().optional(),
})

export type ProgressNoteFormData = z.infer<typeof progressNoteFormSchema>
