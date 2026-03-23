import { z } from 'zod'

// ─── Stage 1: Referral (unchanged) ─────────────────────────────
export const stage1Schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  ndis_number: z.string().min(1, 'NDIS number is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  services_requested: z.array(z.string()).min(1, 'Select at least one service'),
  referral_source: z.string().min(1, 'Referral source is required'),
  urgency: z.enum(['routine', 'urgent', 'crisis']),
  referral_notes: z.string().optional(),
})

export type Stage1Data = z.infer<typeof stage1Schema>

// ─── Stage 2: Meet & Learn (merged old Stages 2+3) ────────────
// All personal, medical, needs, goals, contacts collected in ONE pass
export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(1, 'Phone is required'),
  is_guardian: z.boolean(),
})

export const goalSchema = z.object({
  goal: z.string().min(1, 'Goal description is required'),
  priority: z.enum(['high', 'medium', 'low']),
  notes: z.string().optional(),
})

export const stage2Schema = z.object({
  // Meeting checklist (manual ticks for explaining things)
  meeting_checklist: z.record(z.string(), z.boolean()),
  // Service-specific Q&A
  service_answers: z.record(z.string(), z.record(z.string(), z.string())),
  // Guardian
  has_guardian: z.boolean(),
  guardian_name: z.string().optional(),
  guardian_relationship: z.string().optional(),
  guardian_phone: z.string().optional(),
  guardian_authority: z.string().optional(),
  // Personal details (previously Stage 3)
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().optional(),
  address_street: z.string().optional(),
  address_suburb: z.string().optional(),
  address_state: z.string().optional(),
  address_postcode: z.string().optional(),
  living_situation: z.string().optional(),
  // Needs (collected once, no duplication)
  communication_needs: z.string().optional(),
  cultural_needs: z.string().optional(),
  mobility_needs: z.string().optional(),
  // Medical
  medical_conditions: z.string().optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),
  other_providers: z.string().optional(),
  // GP
  gp_name: z.string().optional(),
  gp_phone: z.string().optional(),
  gp_address: z.string().optional(),
  // NDIS plan
  funding_type: z.enum(['ndia_managed', 'plan_managed', 'self_managed', 'combination']),
  plan_start_date: z.string().min(1, 'Plan start date is required'),
  plan_end_date: z.string().min(1, 'Plan end date is required'),
  plan_number: z.string().optional(),
  budget_core: z.string().optional(),
  budget_capacity_building: z.string().optional(),
  budget_capital: z.string().optional(),
  // Coordinators
  support_coordinator_name: z.string().optional(),
  support_coordinator_phone: z.string().optional(),
  support_coordinator_email: z.string().optional(),
  lac_name: z.string().optional(),
  lac_contact: z.string().optional(),
  // Emergency contacts
  emergency_contacts: z.array(emergencyContactSchema).min(1, 'At least one emergency contact'),
  // Goals
  goals_notes: z.string().optional(),
  goals: z.array(goalSchema).min(1, 'At least one goal is required'),
})

export type Stage2Data = z.infer<typeof stage2Schema>

// ─── Stage 3: Review & Sign ────────────────────────────────────
export const stage3Schema = z.object({
  documents_generated: z.array(z.string()),
  service_agreement_signed: z.boolean(),
  consent_form_signed: z.boolean(),
  participant_signature: z.string().optional(),
  provider_signature: z.string().optional(),
  consent_service_delivery: z.boolean().optional(),
  consent_data_collection: z.boolean().optional(),
  consent_information_sharing: z.boolean().optional(),
  consent_photo_media: z.boolean().optional(),
  consent_emergency_contact: z.boolean().optional(),
  consent_gp_communication: z.boolean().optional(),
  service_agreement_reviewed: z.boolean().optional(),
  service_agreement_terms_accepted: z.boolean().optional(),
})

export type Stage3Data = z.infer<typeof stage3Schema>

// ─── Stage 4: Team & Schedule (merged old Stages 5+6) ─────────
export const stage4Schema = z.object({
  assignments: z.array(z.object({
    worker_id: z.string(),
    worker_name: z.string(),
    registration_group: z.string(),
  })),
  bookings: z.array(z.object({
    worker_id: z.string(),
    registration_group: z.string(),
    booking_date: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    recurrence: z.enum(['one_off', 'weekly', 'fortnightly']),
    notes: z.string().optional(),
  })),
})

export type Stage4Data = z.infer<typeof stage4Schema>

// ─── Stage 5: Risk & Go Live (merged old Stages 7+8) ──────────
export const stage5Schema = z.object({
  risk_answers: z.record(z.string(), z.string()),
  risk_level: z.enum(['low', 'medium', 'high']),
  interpreter_language: z.string().optional(),
  notes: z.string().optional(),
  all_checks_passed: z.literal(true, { message: 'All checks must pass before activation' }).optional(),
})

export type Stage5Data = z.infer<typeof stage5Schema>
