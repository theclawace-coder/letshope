import { z } from 'zod'

export const consentFormSchema = z.object({
  participant_id: z.string().min(1, 'Select a participant'),
  consent_type: z.enum(
    ['service_agreement', 'data_collection', 'information_sharing', 'photography_media', 'restrictive_practice', 'medication_administration', 'transport', 'community_access', 'emergency_medical', 'research_participation', 'third_party_disclosure', 'other'],
    { error: 'Select a consent type' }
  ),
  consent_method: z.enum(['written', 'verbal', 'electronic', 'witnessed'], {
    error: 'Select how consent was obtained',
  }),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  scope: z.string().min(5, 'Describe what is being consented to'),
  conditions: z.string().optional(),
  given_date: z.string().min(1, 'Date consent was given is required'),
  expiry_date: z.string().optional(),
  review_date: z.string().optional(),
  given_by_name: z.string().min(1, 'Name of person giving consent is required'),
  given_by_relationship: z.string().optional(),
  witnessed_by_name: z.string().optional(),
  notes: z.string().optional(),
})

export type ConsentFormData = z.infer<typeof consentFormSchema>

export const withdrawConsentSchema = z.object({
  withdrawn_reason: z.string().min(1, 'Reason for withdrawal is required'),
  withdrawn_by_name: z.string().min(1, 'Name of person withdrawing is required'),
})

export type WithdrawConsentData = z.infer<typeof withdrawConsentSchema>

export const rightsAcknowledgmentSchema = z.object({
  participant_id: z.string().min(1, 'Select a participant'),
  acknowledged_date: z.string().min(1, 'Date is required'),
  next_review_date: z.string().optional(),
  rights_explained: z.boolean(),
  rights_understood: z.boolean(),
  easy_read_provided: z.boolean(),
  interpreter_used: z.boolean(),
  interpreter_details: z.string().optional(),
  acknowledged_method: z.enum(['written', 'verbal', 'electronic', 'witnessed']),
  acknowledged_by_name: z.string().min(1, 'Name is required'),
  acknowledged_by_relationship: z.string().optional(),
  witnessed_by_name: z.string().optional(),
  notes: z.string().optional(),
})

export type RightsAcknowledgmentFormData = z.infer<typeof rightsAcknowledgmentSchema>

export const capacityAssessmentSchema = z.object({
  participant_id: z.string().min(1, 'Select a participant'),
  capacity_level: z.enum(['full', 'supported', 'substitute'], {
    error: 'Select capacity level',
  }),
  assessment_date: z.string().min(1, 'Assessment date is required'),
  next_review_date: z.string().optional(),
  assessed_by_name: z.string().min(1, 'Assessor name is required'),
  assessed_by_role: z.string().optional(),
  assessment_summary: z.string().min(10, 'Provide a summary of the assessment (at least 10 characters)'),
  communication_needs: z.string().optional(),
  preferred_communication: z.string().optional(),
  notes: z.string().optional(),
})

export type CapacityAssessmentFormData = z.infer<typeof capacityAssessmentSchema>

export const authorisedRepSchema = z.object({
  participant_id: z.string().min(1, 'Select a participant'),
  full_name: z.string().min(1, 'Representative name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  authority_type: z.enum(
    ['guardian', 'power_of_attorney', 'nominee', 'informal_support', 'plan_nominee', 'correspondence_nominee'],
    { error: 'Select authority type' }
  ),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  authority_start_date: z.string().min(1, 'Start date is required'),
  authority_end_date: z.string().optional(),
  legal_order_reference: z.string().optional(),
  legal_order_date: z.string().optional(),
  legal_order_expiry: z.string().optional(),
  issuing_body: z.string().optional(),
  notes: z.string().optional(),
})

export type AuthorisedRepFormData = z.infer<typeof authorisedRepSchema>
