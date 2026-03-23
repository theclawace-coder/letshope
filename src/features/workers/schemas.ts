import { z } from 'zod'

// Stage 1: Contract
export const workerBasicInfoSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  role_title: z.string().min(1, 'Role title is required'),
  employment_type: z.enum(['contractor', 'employee', 'volunteer']),
})
export type WorkerBasicInfoData = z.infer<typeof workerBasicInfoSchema>

export const workerStage1Schema = z.object({
  contract_signed: z.boolean().refine((v) => v === true, 'Contract must be signed'),
  contract_date: z.string().min(1, 'Contract date is required'),
})
export type WorkerStage1Data = z.infer<typeof workerStage1Schema>

// Stage 2: Position Description
export const workerStage2Schema = z.object({
  position_description_acknowledged: z.boolean().refine((v) => v === true, 'Must be acknowledged'),
})
export type WorkerStage2Data = z.infer<typeof workerStage2Schema>

// Stage 3: 100 Points of ID
export const identityDocSchema = z.object({
  doc_type: z.string().min(1, 'Document type is required'),
  points: z.number().min(1),
})

export const workerStage3Schema = z.object({
  identity_documents: z.array(identityDocSchema).min(1, 'Add at least one document'),
  total_points: z.number().min(100, 'Need at least 100 points of ID'),
})
export type WorkerStage3Data = z.infer<typeof workerStage3Schema>

// Stage 4: NDIS Screening
export const workerStage4Schema = z.object({
  ndis_screening_status: z.enum(['not_started', 'pending', 'cleared', 'expired', 'barred']),
  ndis_screening_number: z.string().optional(),
  ndis_screening_date: z.string().optional(),
})
export type WorkerStage4Data = z.infer<typeof workerStage4Schema>

// Stage 5: Police Check
export const workerStage5Schema = z.object({
  police_check_status: z.enum(['not_started', 'pending', 'clear', 'disclosable', 'expired']),
  police_check_date: z.string().optional(),
  police_check_expiry: z.string().optional(),
})
export type WorkerStage5Data = z.infer<typeof workerStage5Schema>

// Stage 6: Orientation
export const workerStage6Schema = z.object({
  orientation_completed: z.boolean().refine((v) => v === true, 'Orientation must be completed'),
  orientation_date: z.string().min(1, 'Completion date is required'),
})
export type WorkerStage6Data = z.infer<typeof workerStage6Schema>

// Stage 7: WWCC (conditional)
export const workerStage7Schema = z.object({
  wwcc_required: z.boolean(),
  wwcc_status: z.string().optional(),
  wwcc_number: z.string().optional(),
  wwcc_expiry: z.string().optional(),
})
export type WorkerStage7Data = z.infer<typeof workerStage7Schema>

// Stage 8: Code of Conduct
export const workerStage8Schema = z.object({
  code_of_conduct_signed: z.boolean().refine((v) => v === true, 'Code of Conduct must be signed'),
  code_of_conduct_date: z.string().min(1, 'Date is required'),
})
export type WorkerStage8Data = z.infer<typeof workerStage8Schema>

// Stage 9: Induction
export const workerStage9Schema = z.object({
  induction_items: z.record(z.string(), z.boolean()),
  induction_date: z.string().min(1, 'Induction date is required'),
  notes: z.string().optional(),
})
export type WorkerStage9Data = z.infer<typeof workerStage9Schema>

// Stage 10: Qualifications
export const qualificationSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  registration_number: z.string().optional(),
  expiry_date: z.string().optional(),
})

export const workerStage10Schema = z.object({
  qualifications: z.array(qualificationSchema),
  qualified_registration_groups: z.array(z.string()).min(1, 'Select at least one registration group'),
  references_verified: z.boolean(),
})
export type WorkerStage10Data = z.infer<typeof workerStage10Schema>

// Booking form schema (for calendar)
export const bookingFormSchema = z.object({
  participant_id: z.string().min(1, 'Select a participant'),
  worker_id: z.string().min(1, 'Select a worker'),
  registration_group: z.string().optional(),
  service_description: z.string().optional(),
  support_item_number: z.string().optional(),
  booking_date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  recurrence: z.enum(['one_off', 'weekly', 'fortnightly']),
  recurrence_end_date: z.string().optional(),
  notes: z.string().optional(),
  // Group booking fields
  is_group_booking: z.boolean().optional().default(false),
  group_participant_ids: z.array(z.string()).optional().default([]),
  group_ratio: z.enum(['1:2', '1:3', '1:4', '1:5']).optional(),
  // Travel time fields
  travel_time_minutes: z.coerce.number().int().min(0).max(480).nullable().optional().default(null),
  travel_distance_km: z.coerce.number().min(0).max(9999).nullable().optional().default(null),
}).refine(
  (data) => {
    if (data.recurrence !== 'one_off' && !data.recurrence_end_date) return false
    return true
  },
  { message: 'End date is required for recurring bookings', path: ['recurrence_end_date'] },
).refine(
  (data) => {
    if (data.is_group_booking) {
      return (data.group_participant_ids?.length ?? 0) >= 2
    }
    return true
  },
  { message: 'Group bookings need at least 2 participants', path: ['group_participant_ids'] },
)
export type BookingFormData = z.infer<typeof bookingFormSchema>
