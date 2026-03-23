import { z } from 'zod'

export const riskFormSchema = z.object({
  participant_id: z.string().min(1, 'Select a participant'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Please provide a detailed description (at least 10 characters)'),
  category: z.enum(['environmental', 'health', 'behavioral', 'financial', 'social', 'safeguarding'], {
    error: 'Select a risk category',
  }),
  likelihood: z.enum(['rare', 'unlikely', 'possible', 'likely', 'almost_certain'], {
    error: 'Select likelihood',
  }),
  consequence: z.enum(['insignificant', 'minor', 'moderate', 'major', 'catastrophic'], {
    error: 'Select consequence',
  }),
  identified_date: z.string().min(1, 'Date is required'),
  source: z.string().optional(),
  environment_notes: z.string().optional(),
  triggers: z.string().optional(),
  existing_controls: z.string().optional(),
})

export type RiskFormData = z.infer<typeof riskFormSchema>

export const riskAssessmentSchema = z.object({
  likelihood: z.enum(['rare', 'unlikely', 'possible', 'likely', 'almost_certain'], {
    error: 'Select likelihood',
  }),
  consequence: z.enum(['insignificant', 'minor', 'moderate', 'major', 'catastrophic'], {
    error: 'Select consequence',
  }),
  environmental_score: z.coerce.number().min(0).max(10).optional(),
  health_score: z.coerce.number().min(0).max(10).optional(),
  behavioral_score: z.coerce.number().min(0).max(10).optional(),
  findings: z.string().min(5, 'Please describe your findings'),
  recommendations: z.string().optional(),
})

export type RiskAssessmentFormData = z.infer<typeof riskAssessmentSchema>

export const riskMitigationSchema = z.object({
  action: z.string().min(5, 'Describe the mitigation action'),
  target_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
})

export type RiskMitigationFormData = z.infer<typeof riskMitigationSchema>

export const riskReviewSchema = z.object({
  new_level: z.enum(['low', 'medium', 'high', 'critical'], {
    error: 'Select the updated risk level',
  }),
  findings: z.string().min(5, 'Please describe your findings'),
  actions_taken: z.string().optional(),
  next_review_date: z.string().optional(),
})

export type RiskReviewFormData = z.infer<typeof riskReviewSchema>
