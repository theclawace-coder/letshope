export interface RegistrationGroup {
  code: string
  name: string
  module: string
  requires: string[]
}

export const REGISTRATION_GROUPS: Record<string, RegistrationGroup> = {
  '0104': { code: '0104', name: 'High Intensity Daily Personal Activities', module: 'Module 1', requires: ['AHPRA_RN'] },
  '0106': { code: '0106', name: 'Assist-Life Stage, Transition (Support Coordination L2)', module: 'Core', requires: [] },
  '0107': { code: '0107', name: 'Daily Personal Activities', module: 'Core', requires: ['NDIS_screening', 'police_check', 'orientation'] },
  '0108': { code: '0108', name: 'Assist-Travel/Transport', module: 'Core', requires: ['drivers_licence', 'vehicle_insurance', 'vehicle_rego'] },
  '0111': { code: '0111', name: 'Participate Community', module: 'Core', requires: [] },
  '0114': { code: '0114', name: 'Community Nursing Care', module: 'Core', requires: ['AHPRA_RN'] },
  '0115': { code: '0115', name: 'Daily Tasks/Shared Living', module: 'Core', requires: [] },
  '0116': { code: '0116', name: 'Innovative Community Participation', module: 'Core', requires: [] },
  '0117': { code: '0117', name: 'Development of Daily Care & Life Skills', module: 'Core', requires: [] },
  '0120': { code: '0120', name: 'Household Tasks', module: 'Core', requires: [] },
  '0121': { code: '0121', name: 'Assistive Technology', module: 'Core', requires: [] },
  '0125': { code: '0125', name: 'Participate Community', module: 'Core', requires: [] },
  '0126': { code: '0126', name: 'Plan Management', module: 'Plan Management', requires: ['CA_CPA_or_equiv', 'ndis_portal_access'] },
  '0127': { code: '0127', name: 'Plan Management', module: 'Plan Management', requires: ['CA_CPA_or_equiv', 'ndis_portal_access'] },
  '0136': { code: '0136', name: 'Group/Centre Activities', module: 'Core', requires: [] },
}

// All known NDIS registration groups (for the RegistrationCheck component)
export const ALL_REGISTRATION_GROUPS: Record<string, string> = {
  '0104': 'High Intensity Daily Personal Activities',
  '0106': 'Assist-Life Stage, Transition',
  '0107': 'Daily Personal Activities',
  '0108': 'Assist-Travel/Transport',
  '0110': 'Assist-Personal Activities (High)',
  '0111': 'Participate Community',
  '0112': 'Assist-Access Community, Social & Rec',
  '0114': 'Community Nursing Care',
  '0115': 'Daily Tasks/Shared Living',
  '0116': 'Innovative Community Participation',
  '0117': 'Development of Daily Care & Life Skills',
  '0118': 'Early Childhood Supports',
  '0120': 'Household Tasks',
  '0121': 'Assistive Technology',
  '0124': 'Therapeutic Supports',
  '0125': 'Participate Community',
  '0126': 'Plan Management (Financial Admin)',
  '0127': 'Plan Management',
  '0128': 'Therapeutic Supports',
  '0132': 'Behaviour Support',
  '0133': 'Specialist Disability Accommodation',
  '0136': 'Group/Centre Activities',
}

export const PARTICIPANT_STATUSES = [
  'referral', 'intake', 'onboarding', 'active', 'on_hold', 'exiting', 'exited',
] as const

export type ParticipantStatus = (typeof PARTICIPANT_STATUSES)[number]

export const PARTICIPANT_STATUS_COLORS: Record<ParticipantStatus, string> = {
  referral: 'bg-blue-100 text-blue-800',
  intake: 'bg-purple-100 text-purple-800',
  onboarding: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-orange-100 text-orange-800',
  exiting: 'bg-red-100 text-red-800',
  exited: 'bg-gray-100 text-gray-800',
}

export const FUNDING_TYPES = [
  { value: 'ndia_managed', label: 'NDIA Managed' },
  { value: 'plan_managed', label: 'Plan Managed' },
  { value: 'self_managed', label: 'Self Managed' },
  { value: 'combination', label: 'Combination' },
] as const

export const URGENCY_LEVELS = [
  { value: 'routine', label: 'Routine', color: 'bg-green-100 text-green-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-orange-100 text-orange-800' },
  { value: 'crisis', label: 'Crisis', color: 'bg-red-100 text-red-800' },
] as const

export const USER_ROLES = ['director', 'admin', 'worker', 'plan_manager', 'participant_portal'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const WORKER_STATUSES = ['onboarding', 'active', 'inactive', 'terminated'] as const

export const COMMUNICATION_TYPES = [
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'letter', label: 'Letter' },
  { value: 'video_call', label: 'Video Call' },
] as const

export const DOCUMENT_CATEGORIES = [
  'service_agreement', 'consent_form', 'risk_assessment', 'support_plan',
  'welcome_pack', 'screening', 'qualification', 'invoice', 'progress_note', 'other',
] as const

// Phase 3: Concern types and severities
export const CONCERN_TYPES = [
  { value: 'safety', label: 'Safety' },
  { value: 'health', label: 'Health' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'financial', label: 'Financial' },
  { value: 'other', label: 'Other' },
] as const

export const CONCERN_SEVERITIES = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
] as const

export const CONCERN_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'] as const
export type ConcernStatus = (typeof CONCERN_STATUSES)[number]

export const CONCERN_STATUS_COLORS: Record<ConcernStatus, string> = {
  open: 'bg-red-100 text-red-800',
  reviewing: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
}

// Phase 4: Invoice constants
export const INVOICE_STATUSES = [
  'draft', 'approved', 'submitted', 'paid', 'rejected', 'cancelled', 'void',
] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-blue-100 text-blue-800',
  submitted: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-orange-100 text-orange-800',
  void: 'bg-gray-100 text-gray-500',
}

// Credit Note constants
export const CREDIT_NOTE_STATUSES = ['draft', 'approved', 'applied', 'void'] as const
export type CreditNoteStatus = (typeof CREDIT_NOTE_STATUSES)[number]

export const CREDIT_NOTE_STATUS_COLORS: Record<CreditNoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-blue-100 text-blue-800',
  applied: 'bg-green-100 text-green-800',
  void: 'bg-gray-100 text-gray-500',
}

export const CREDIT_NOTE_REASONS = [
  { value: 'billing_error', label: 'Billing Error' },
  { value: 'service_not_delivered', label: 'Service Not Delivered' },
  { value: 'duplicate_charge', label: 'Duplicate Charge' },
  { value: 'rate_adjustment', label: 'Rate Adjustment' },
  { value: 'participant_complaint', label: 'Participant Complaint' },
  { value: 'ndis_rejection', label: 'NDIS Rejection' },
  { value: 'other', label: 'Other' },
] as const

// Booking / Cancellation constants
export const BOOKING_STATUSES = ['scheduled', 'checked_in', 'checked_out', 'completed', 'cancelled', 'no_show'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-green-100 text-green-800',
  checked_out: 'bg-purple-100 text-purple-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-800',
  no_show: 'bg-red-100 text-red-800',
}

export const CANCELLATION_TYPES = [
  { value: 'standard', label: 'Standard (no charge)', color: 'bg-green-100 text-green-800' },
  { value: 'short_notice', label: 'Short Notice (90% charge)', color: 'bg-orange-100 text-orange-800' },
  { value: 'no_show', label: 'No Show (100% charge)', color: 'bg-red-100 text-red-800' },
] as const

export const CANCELLED_BY_OPTIONS = [
  { value: 'participant', label: 'Participant' },
  { value: 'provider', label: 'Provider' },
  { value: 'worker', label: 'Worker' },
] as const

export const CLAIM_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'non_face_to_face', label: 'Non Face-to-Face' },
  { value: 'provider_travel', label: 'Provider Travel' },
  { value: 'cancellation_short_notice', label: 'Short Notice Cancellation' },
  { value: 'cancellation_no_show', label: 'No Show Cancellation' },
  { value: 'report_writing', label: 'Report Writing' },
  { value: 'irregular_sil_supports', label: 'Irregular SIL Supports' },
] as const

export const LINE_ITEM_UNITS = [
  { value: 'hour', label: 'Hour' },
  { value: 'each', label: 'Each' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'km', label: 'Kilometre' },
] as const

// Service Agreement & Plan constants
export const SERVICE_AGREEMENT_STATUSES = ['draft', 'sent', 'signed', 'expired', 'terminated'] as const
export type ServiceAgreementStatus = (typeof SERVICE_AGREEMENT_STATUSES)[number]

export const SERVICE_AGREEMENT_STATUS_COLORS: Record<ServiceAgreementStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  signed: 'bg-green-100 text-green-800',
  expired: 'bg-orange-100 text-orange-800',
  terminated: 'bg-red-100 text-red-800',
}

export const NDIS_PLAN_STATUSES = ['draft', 'active', 'expired', 'superseded'] as const
export type NdisPlanStatus = (typeof NDIS_PLAN_STATUSES)[number]

export const NDIS_PLAN_STATUS_COLORS: Record<NdisPlanStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-orange-100 text-orange-800',
  superseded: 'bg-purple-100 text-purple-800',
}

export const BUDGET_CATEGORIES = [
  { value: 'core', label: 'Core', color: 'bg-blue-500' },
  { value: 'capacity_building', label: 'Capacity Building', color: 'bg-purple-500' },
  { value: 'capital', label: 'Capital', color: 'bg-emerald-500' },
] as const

// Phase 5: Incident constants
export const INCIDENT_STATUSES = ['open', 'investigating', 'resolved', 'closed'] as const
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number]

export const INCIDENT_STATUS_COLORS: Record<IncidentStatus, string> = {
  open: 'bg-red-100 text-red-800',
  investigating: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export const INCIDENT_SEVERITIES = [
  { value: 'minor', label: 'Minor', color: 'bg-blue-100 text-blue-800' },
  { value: 'moderate', label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'major', label: 'Major', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
] as const

export const INCIDENT_TYPES = [
  { value: 'injury', label: 'Injury' },
  { value: 'medication_error', label: 'Medication Error' },
  { value: 'abuse_neglect', label: 'Abuse / Neglect' },
  { value: 'restrictive_practice', label: 'Restrictive Practice' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'missing_person', label: 'Missing Person' },
  { value: 'death', label: 'Death' },
  { value: 'sexual_misconduct', label: 'Sexual Misconduct' },
  { value: 'other', label: 'Other' },
] as const

// Phase 5: Complaint constants
export const COMPLAINT_STATUSES = ['received', 'acknowledged', 'investigating', 'resolved', 'closed'] as const
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number]

export const COMPLAINT_STATUS_COLORS: Record<ComplaintStatus, string> = {
  received: 'bg-red-100 text-red-800',
  acknowledged: 'bg-blue-100 text-blue-800',
  investigating: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

// v2 Phase 1: Goal Tracking constants
export const GOAL_DOMAINS = [
  { value: 'daily_living', label: 'Daily Living' },
  { value: 'community_participation', label: 'Community Participation' },
  { value: 'employment', label: 'Employment' },
  { value: 'health_wellbeing', label: 'Health & Wellbeing' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'lifelong_learning', label: 'Lifelong Learning' },
  { value: 'choice_control', label: 'Choice & Control' },
  { value: 'home', label: 'Home' },
] as const

export const GOAL_TIMEFRAMES = [
  { value: 'short_term', label: 'Short Term (0-3 months)' },
  { value: 'medium_term', label: 'Medium Term (3-12 months)' },
  { value: 'long_term', label: 'Long Term (1+ years)' },
] as const

export const GOAL_STATUSES = ['not_started', 'in_progress', 'achieved', 'on_hold', 'discontinued'] as const
export type GoalStatus = (typeof GOAL_STATUSES)[number]

export const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  not_started: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  achieved: 'bg-green-100 text-green-800',
  on_hold: 'bg-orange-100 text-orange-800',
  discontinued: 'bg-red-100 text-red-800',
}

export const GOAL_PRIORITIES = [
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
] as const

// v2 Phase 3: Notification constants
export const NOTIFICATION_CATEGORIES = [
  { value: 'incident', label: 'Incidents' },
  { value: 'complaint', label: 'Complaints' },
  { value: 'concern', label: 'Concerns' },
  { value: 'booking', label: 'Bookings' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'goal', label: 'Goals' },
  { value: 'portal', label: 'Portal' },
  { value: 'message', label: 'Messages' },
  { value: 'system', label: 'System' },
] as const

export const NOTIFICATION_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
] as const

export const COMPLAINT_CATEGORIES = [
  { value: 'service_delivery', label: 'Service Delivery' },
  { value: 'staff_conduct', label: 'Staff Conduct' },
  { value: 'communication', label: 'Communication' },
  { value: 'safety', label: 'Safety' },
  { value: 'financial', label: 'Financial' },
  { value: 'privacy', label: 'Privacy' },
  { value: 'access', label: 'Access' },
  { value: 'other', label: 'Other' },
] as const

// v2 Phase 5: Consent & Rights Management constants
export const CONSENT_TYPES = [
  { value: 'service_agreement', label: 'Service Agreement' },
  { value: 'data_collection', label: 'Data Collection' },
  { value: 'information_sharing', label: 'Information Sharing' },
  { value: 'photography_media', label: 'Photography & Media' },
  { value: 'restrictive_practice', label: 'Restrictive Practice' },
  { value: 'medication_administration', label: 'Medication Administration' },
  { value: 'transport', label: 'Transport' },
  { value: 'community_access', label: 'Community Access' },
  { value: 'emergency_medical', label: 'Emergency Medical' },
  { value: 'research_participation', label: 'Research Participation' },
  { value: 'third_party_disclosure', label: 'Third Party Disclosure' },
  { value: 'other', label: 'Other' },
] as const

export const CONSENT_STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-red-100 text-red-800' },
  { value: 'expired', label: 'Expired', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending_review', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'declined', label: 'Declined', color: 'bg-orange-100 text-orange-800' },
] as const

export const CONSENT_METHODS = [
  { value: 'written', label: 'Written' },
  { value: 'verbal', label: 'Verbal' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'witnessed', label: 'Witnessed' },
] as const

export const CAPACITY_LEVELS = [
  { value: 'full', label: 'Full Capacity', color: 'bg-green-100 text-green-800' },
  { value: 'supported', label: 'Supported Decision-Making', color: 'bg-blue-100 text-blue-800' },
  { value: 'substitute', label: 'Substitute Decision-Making', color: 'bg-orange-100 text-orange-800' },
] as const

export const AUTHORITY_TYPES = [
  { value: 'guardian', label: 'Guardian' },
  { value: 'power_of_attorney', label: 'Power of Attorney' },
  { value: 'nominee', label: 'NDIS Nominee' },
  { value: 'informal_support', label: 'Informal Support' },
  { value: 'plan_nominee', label: 'Plan Nominee' },
  { value: 'correspondence_nominee', label: 'Correspondence Nominee' },
] as const

// v2 Phase 6: Risk Management constants
export const RISK_CATEGORIES = [
  { value: 'environmental', label: 'Environmental' },
  { value: 'health', label: 'Health' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'financial', label: 'Financial' },
  { value: 'social', label: 'Social' },
  { value: 'safeguarding', label: 'Safeguarding' },
] as const

export const RISK_LIKELIHOODS = [
  { value: 'rare', label: 'Rare', score: 1 },
  { value: 'unlikely', label: 'Unlikely', score: 2 },
  { value: 'possible', label: 'Possible', score: 3 },
  { value: 'likely', label: 'Likely', score: 4 },
  { value: 'almost_certain', label: 'Almost Certain', score: 5 },
] as const

export const RISK_CONSEQUENCES = [
  { value: 'insignificant', label: 'Insignificant', score: 1 },
  { value: 'minor', label: 'Minor', score: 2 },
  { value: 'moderate', label: 'Moderate', score: 3 },
  { value: 'major', label: 'Major', score: 4 },
  { value: 'catastrophic', label: 'Catastrophic', score: 5 },
] as const

export const RISK_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
] as const

export const RISK_STATUSES = ['active', 'monitoring', 'mitigated', 'escalated', 'resolved'] as const
export type RiskStatus = (typeof RISK_STATUSES)[number]

export const RISK_STATUS_COLORS: Record<RiskStatus, string> = {
  active: 'bg-red-100 text-red-800',
  monitoring: 'bg-yellow-100 text-yellow-800',
  mitigated: 'bg-blue-100 text-blue-800',
  escalated: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
}

export const MITIGATION_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export const RISK_SOURCES = [
  { value: 'onboarding_assessment', label: 'Onboarding Assessment' },
  { value: 'progress_note', label: 'Progress Note' },
  { value: 'incident', label: 'Incident' },
  { value: 'concern', label: 'Concern' },
  { value: 'manual', label: 'Manual Entry' },
] as const

/**
 * Calculate risk level from likelihood x consequence matrix
 * Uses standard 5x5 risk matrix
 */
export function calculateRiskLevel(likelihood: string, consequence: string): RiskStatus extends string ? 'low' | 'medium' | 'high' | 'critical' : never {
  const l = RISK_LIKELIHOODS.find((x) => x.value === likelihood)?.score ?? 3
  const c = RISK_CONSEQUENCES.find((x) => x.value === consequence)?.score ?? 3
  const score = l * c
  if (score <= 4) return 'low'
  if (score <= 9) return 'medium'
  if (score <= 16) return 'high'
  return 'critical'
}
