import { z } from 'zod'

export const goalFormSchema = z.object({
  participant_id: z.string().min(1, 'Select a participant'),
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional(),
  domain: z.enum(
    ['daily_living', 'community_participation', 'employment', 'health_wellbeing', 'relationships', 'lifelong_learning', 'choice_control', 'home'],
    { error: 'Select an NDIS outcome domain' }
  ),
  timeframe: z.enum(['short_term', 'medium_term', 'long_term']),
  priority: z.enum(['high', 'medium', 'low']),
  start_date: z.string().optional(),
  target_date: z.string().optional(),
  review_date: z.string().optional(),
  baseline_measure: z.string().optional(),
  target_measure: z.string().optional(),
  linked_registration_groups: z.array(z.string()).default([]),
})

export type GoalFormData = z.infer<typeof goalFormSchema>

export const goalProgressSchema = z.object({
  progress_percentage: z.number().min(0).max(100, 'Progress must be between 0 and 100'),
  notes: z.string().optional(),
  evidence: z.string().optional(),
  progress_date: z.string().optional(),
})

export type GoalProgressFormData = z.infer<typeof goalProgressSchema>
