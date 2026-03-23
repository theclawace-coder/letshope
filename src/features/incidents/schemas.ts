import { z } from 'zod'

export const incidentFormSchema = z.object({
  participant_id: z.string().min(1, 'Select a participant'),
  worker_id: z.string().optional(),
  incident_date: z.string().min(1, 'Incident date is required'),
  incident_time: z.string().optional(),
  location: z.string().optional(),
  incident_type: z.enum(
    ['injury', 'medication_error', 'abuse_neglect', 'restrictive_practice', 'property_damage', 'missing_person', 'death', 'sexual_misconduct', 'other'],
    { error: 'Select an incident type' }
  ),
  severity: z.enum(['minor', 'moderate', 'major', 'critical'], {
    error: 'Select severity level',
  }),
  description: z.string().min(10, 'Please provide a detailed description (at least 10 characters)'),
  is_reportable: z.boolean(),
})

export type IncidentFormData = z.infer<typeof incidentFormSchema>

export const incidentResolutionSchema = z.object({
  status: z.enum(['resolved', 'closed']),
  investigation_notes: z.string().min(1, 'Investigation notes are required'),
  corrective_actions: z.string().optional(),
})

export type IncidentResolutionData = z.infer<typeof incidentResolutionSchema>
