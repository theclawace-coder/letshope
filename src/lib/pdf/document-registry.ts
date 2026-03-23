// Master registry of every NDIS document type in Hope Disability Support.
// Each entry maps to a real template from the NDIS_Folders structure.
// The `templateKey` is used to look up the React-PDF component at generation time.

export type DocumentCategory =
  | 'participant'
  | 'plan_management'
  | 'incident'
  | 'complaint'
  | 'risk'
  | 'hr'
  | 'governance'
  | 'audit'

export type EntityType = 'participant' | 'worker' | 'organisation' | 'incident' | 'complaint' | 'concern'

export interface DocumentTypeDefinition {
  templateKey: string
  label: string
  description: string
  category: DocumentCategory
  /** Which entity this document is generated for */
  entityType: EntityType
  /** Whether this document requires a signature */
  requiresSignature: boolean
  /** NDIS folder number reference (e.g. "9. Participant Documentation") */
  folderRef: string
}

export const DOCUMENT_TYPES: Record<string, DocumentTypeDefinition> = {
  // ─── Participant Documents (Folder 9) ──────────────────────────────────
  service_agreement: {
    templateKey: 'service_agreement',
    label: 'Service Agreement',
    description: 'Outlines services, costs, rights and responsibilities',
    category: 'participant',
    entityType: 'participant',
    requiresSignature: true,
    folderRef: '9. Participant Documentation',
  },
  consent_form: {
    templateKey: 'consent_form',
    label: 'Consent Form',
    description: 'Consent to collect, use, and share personal information',
    category: 'participant',
    entityType: 'participant',
    requiresSignature: true,
    folderRef: '9. Participant Documentation',
  },
  participant_handbook: {
    templateKey: 'participant_handbook',
    label: 'Participant Handbook',
    description: 'Welcome guide including rights, services, complaints process',
    category: 'participant',
    entityType: 'participant',
    requiresSignature: false,
    folderRef: '9. Participant Documentation',
  },
  easy_read_rights: {
    templateKey: 'easy_read_rights',
    label: 'Easy Read Your Rights',
    description: 'Participant rights in Easy Read format',
    category: 'participant',
    entityType: 'participant',
    requiresSignature: false,
    folderRef: '9. Participant Documentation',
  },
  intake_form: {
    templateKey: 'intake_form',
    label: 'Intake Form',
    description: 'Full participant intake and personal details',
    category: 'participant',
    entityType: 'participant',
    requiresSignature: false,
    folderRef: '9. Participant Documentation',
  },
  referral_form: {
    templateKey: 'referral_form',
    label: 'Referral Form',
    description: 'Initial referral details and service requests',
    category: 'participant',
    entityType: 'participant',
    requiresSignature: false,
    folderRef: '9. Participant Documentation',
  },
  support_plan: {
    templateKey: 'support_plan',
    label: 'Support Plan',
    description: 'Individualised support plan with goals and strategies',
    category: 'participant',
    entityType: 'participant',
    requiresSignature: true,
    folderRef: '9. Participant Documentation',
  },
  progress_note: {
    templateKey: 'progress_note',
    label: 'Progress Notes',
    description: 'Service session progress notes and observations',
    category: 'participant',
    entityType: 'participant',
    requiresSignature: false,
    folderRef: '9. Participant Documentation',
  },
  risk_assessment: {
    templateKey: 'risk_assessment',
    label: 'Individual Risk Assessment',
    description: 'Home environment, health & safety risk assessment',
    category: 'participant',
    entityType: 'participant',
    requiresSignature: false,
    folderRef: '9. Participant Documentation',
  },
  exit_transition_plan: {
    templateKey: 'exit_transition_plan',
    label: 'Exit & Transition Plan',
    description: 'Plan for participant exit or transition to another provider',
    category: 'participant',
    entityType: 'participant',
    requiresSignature: true,
    folderRef: '9. Participant Documentation',
  },

  // ─── Plan Management Documents (Folder 9) ─────────────────────────────
  pm_service_agreement: {
    templateKey: 'pm_service_agreement',
    label: 'Plan Management - Service Agreement',
    description: 'Service agreement specific to plan management services',
    category: 'plan_management',
    entityType: 'participant',
    requiresSignature: true,
    folderRef: '9. Participant Documentation',
  },
  pm_welcome_pack: {
    templateKey: 'pm_welcome_pack',
    label: 'Plan Management - Welcome Pack',
    description: 'Welcome information for plan management participants',
    category: 'plan_management',
    entityType: 'participant',
    requiresSignature: false,
    folderRef: '9. Participant Documentation',
  },
  pm_complaint_form: {
    templateKey: 'pm_complaint_form',
    label: 'Plan Management - Complaint Form',
    description: 'Complaint form specific to plan management',
    category: 'plan_management',
    entityType: 'participant',
    requiresSignature: false,
    folderRef: '9. Participant Documentation',
  },
  pm_conflict_of_interest: {
    templateKey: 'pm_conflict_of_interest',
    label: 'Conflict of Interest Declaration',
    description: 'Declaration of conflict of interest for plan management',
    category: 'plan_management',
    entityType: 'participant',
    requiresSignature: true,
    folderRef: '9. Participant Documentation',
  },
  pm_invoice_checklist: {
    templateKey: 'pm_invoice_checklist',
    label: 'Invoice Processing Checklist',
    description: 'Checklist for processing plan management invoices',
    category: 'plan_management',
    entityType: 'participant',
    requiresSignature: false,
    folderRef: '9. Participant Documentation',
  },
  pm_monthly_budget: {
    templateKey: 'pm_monthly_budget',
    label: 'Monthly Budget Report',
    description: 'Monthly budget tracking report for plan managed participants',
    category: 'plan_management',
    entityType: 'participant',
    requiresSignature: false,
    folderRef: '9. Participant Documentation',
  },
  pm_provider_payment: {
    templateKey: 'pm_provider_payment',
    label: 'Provider Payment Record',
    description: 'Record of payments made to service providers',
    category: 'plan_management',
    entityType: 'participant',
    requiresSignature: false,
    folderRef: '9. Participant Documentation',
  },

  // ─── Incident Management (Folder 6) ───────────────────────────────────
  incident_report: {
    templateKey: 'incident_report',
    label: 'Incident Report',
    description: 'Report of an incident involving a participant',
    category: 'incident',
    entityType: 'incident',
    requiresSignature: false,
    folderRef: '6. Incident Management',
  },
  incident_investigation: {
    templateKey: 'incident_investigation',
    label: 'Incident Investigation Form',
    description: 'Detailed investigation into a reported incident',
    category: 'incident',
    entityType: 'incident',
    requiresSignature: false,
    folderRef: '6. Incident Management',
  },
  reportable_incident_5day: {
    templateKey: 'reportable_incident_5day',
    label: 'NDIS Reportable Incident - 5 Day Notification',
    description: 'Five day notification to NDIS Commission for reportable incidents',
    category: 'incident',
    entityType: 'incident',
    requiresSignature: true,
    folderRef: '6. Incident Management',
  },

  // ─── Complaints Management (Folder 7) ─────────────────────────────────
  complaint_form: {
    templateKey: 'complaint_form',
    label: 'Complaint Form',
    description: 'Formal complaint lodgement form',
    category: 'complaint',
    entityType: 'complaint',
    requiresSignature: false,
    folderRef: '7. Complaints Management',
  },
  complaint_form_easy_english: {
    templateKey: 'complaint_form_easy_english',
    label: 'Complaint Form (Easy English)',
    description: 'Complaint form in Easy English format for accessibility',
    category: 'complaint',
    entityType: 'complaint',
    requiresSignature: false,
    folderRef: '7. Complaints Management',
  },
  feedback_form: {
    templateKey: 'feedback_form',
    label: 'Company Feedback Form',
    description: 'General feedback form for compliments and suggestions',
    category: 'complaint',
    entityType: 'organisation',
    requiresSignature: false,
    folderRef: '7. Complaints Management',
  },
  complaints_checklist: {
    templateKey: 'complaints_checklist',
    label: 'Complaints Process Checklist',
    description: 'Checklist for managing the complaints process',
    category: 'complaint',
    entityType: 'complaint',
    requiresSignature: false,
    folderRef: '7. Complaints Management',
  },

  // ─── Risk Management (Folder 5) ───────────────────────────────────────
  risk_assessment_template: {
    templateKey: 'risk_assessment_template',
    label: 'Risk Assessment Template',
    description: 'Organisational risk assessment template',
    category: 'risk',
    entityType: 'organisation',
    requiresSignature: false,
    folderRef: '5. Risk Management',
  },
  emergency_management_plan: {
    templateKey: 'emergency_management_plan',
    label: 'Emergency Management Plan',
    description: 'Emergency response procedures and plans',
    category: 'risk',
    entityType: 'organisation',
    requiresSignature: false,
    folderRef: '5. Risk Management',
  },
  business_continuity_plan: {
    templateKey: 'business_continuity_plan',
    label: 'Business Continuity Plan',
    description: 'Plan for business continuity during disruptions',
    category: 'risk',
    entityType: 'organisation',
    requiresSignature: false,
    folderRef: '5. Risk Management',
  },

  // ─── HR Documents (Folder 4 / 10) ─────────────────────────────────────
  staff_induction_checklist: {
    templateKey: 'staff_induction_checklist',
    label: 'Staff Induction Checklist',
    description: 'Checklist for new staff induction process',
    category: 'hr',
    entityType: 'worker',
    requiresSignature: true,
    folderRef: '10. Corrective Actions from Initial Audit',
  },
  code_of_conduct: {
    templateKey: 'code_of_conduct',
    label: 'NDIS Workers Code of Conduct',
    description: 'Code of conduct agreement for NDIS workers',
    category: 'hr',
    entityType: 'worker',
    requiresSignature: true,
    folderRef: '4. HR and Staffing Documents',
  },
  position_description: {
    templateKey: 'position_description',
    label: 'Position Description',
    description: 'Role and responsibilities for a staff position',
    category: 'hr',
    entityType: 'worker',
    requiresSignature: true,
    folderRef: '4. HR and Staffing Documents',
  },
  cpd_log: {
    templateKey: 'cpd_log',
    label: 'CPD Log',
    description: 'Continuing Professional Development record',
    category: 'hr',
    entityType: 'worker',
    requiresSignature: false,
    folderRef: '4. HR and Staffing Documents',
  },

  // ─── Governance (Folder 2) ────────────────────────────────────────────
  internal_audit_report: {
    templateKey: 'internal_audit_report',
    label: 'Internal Audit Report',
    description: 'Report of internal audit findings and actions',
    category: 'governance',
    entityType: 'organisation',
    requiresSignature: false,
    folderRef: '2. Governance and Operational Review',
  },
  management_review_minutes: {
    templateKey: 'management_review_minutes',
    label: 'Management Review Meeting Minutes',
    description: 'Minutes from management review meetings',
    category: 'governance',
    entityType: 'organisation',
    requiresSignature: false,
    folderRef: '2. Governance and Operational Review',
  },
  registers: {
    templateKey: 'registers',
    label: 'Registers',
    description: 'Compliance, incident, complaint, and feedback registers',
    category: 'governance',
    entityType: 'organisation',
    requiresSignature: false,
    folderRef: '2. Governance and Operational Review',
  },
} as const

export type DocumentTemplateKey = keyof typeof DOCUMENT_TYPES

/** Get all document types for a given category */
export function getDocumentsByCategory(category: DocumentCategory): DocumentTypeDefinition[] {
  return Object.values(DOCUMENT_TYPES).filter((d) => d.category === category)
}

/** Get all document types for a given entity type */
export function getDocumentsByEntity(entityType: EntityType): DocumentTypeDefinition[] {
  return Object.values(DOCUMENT_TYPES).filter((d) => d.entityType === entityType)
}

/** Get documents that require signatures */
export function getSignableDocuments(): DocumentTypeDefinition[] {
  return Object.values(DOCUMENT_TYPES).filter((d) => d.requiresSignature)
}
