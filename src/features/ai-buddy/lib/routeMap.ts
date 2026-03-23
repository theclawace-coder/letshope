/**
 * Internal route map for AI Buddy.
 * Maps every app route to a human-readable description so the AI can
 * suggest clickable internal links when guiding users through the app.
 */

export interface RouteEntry {
  path: string
  label: string
  description: string
  /** Keywords help the AI match a user question to a relevant page */
  keywords: string[]
}

export const ROUTE_MAP: RouteEntry[] = [
  // ─── Main ───────────────────────────────────────────
  {
    path: '/dashboard',
    label: 'Dashboard',
    description: 'Overview of key metrics, upcoming bookings, alerts, and organisation summary.',
    keywords: ['dashboard', 'home', 'overview', 'summary', 'metrics'],
  },

  // ─── People ─────────────────────────────────────────
  {
    path: '/participants',
    label: 'Participants',
    description: 'View and manage all NDIS participants. Search, filter, and access participant profiles.',
    keywords: ['participants', 'clients', 'people', 'ndis participants'],
  },
  {
    path: '/onboarding/new',
    label: 'New Participant Onboarding',
    description: 'Start onboarding a new participant. Collects personal details, NDIS plan info, consent, and service preferences.',
    keywords: ['new participant', 'onboarding', 'intake', 'enrol', 'register participant'],
  },
  {
    path: '/workers',
    label: 'Workers',
    description: 'View and manage all support workers. Access worker profiles, qualifications, and compliance status.',
    keywords: ['workers', 'staff', 'employees', 'support workers', 'team'],
  },
  {
    path: '/workers/onboarding/new',
    label: 'New Worker Onboarding',
    description: 'Onboard a new support worker. Collects personal details, qualifications, NDIS worker screening, and compliance docs.',
    keywords: ['new worker', 'hire', 'onboard worker', 'worker screening'],
  },

  // ─── Operations ─────────────────────────────────────
  {
    path: '/calendar',
    label: 'Calendar',
    description: 'Shared calendar showing all bookings, shifts, and appointments across participants and workers.',
    keywords: ['calendar', 'schedule', 'bookings', 'shifts', 'appointments', 'roster'],
  },
  {
    path: '/goals',
    label: 'Goals',
    description: 'Manage participant goals. Create, track progress, and link goals to NDIS plan objectives.',
    keywords: ['goals', 'objectives', 'outcomes', 'ndis goals', 'plan goals'],
  },
  {
    path: '/goals/new',
    label: 'Create New Goal',
    description: 'Create a new goal for a participant, linked to their NDIS plan.',
    keywords: ['new goal', 'create goal', 'add goal'],
  },
  {
    path: '/progress-notes',
    label: 'Progress Notes',
    description: 'View and create progress notes for participant service delivery sessions.',
    keywords: ['progress notes', 'session notes', 'case notes', 'shift notes', 'documentation'],
  },
  {
    path: '/progress-notes/new',
    label: 'Create Progress Note',
    description: 'Write a new progress note documenting a service delivery session.',
    keywords: ['new note', 'write note', 'create progress note', 'document session'],
  },

  // ─── Finance ────────────────────────────────────────
  {
    path: '/service-agreements',
    label: 'Service Agreements',
    description: 'Manage participant service agreements. Track services, budgets, and agreement status.',
    keywords: ['service agreements', 'agreements', 'contracts', 'service booking'],
  },
  {
    path: '/service-agreements/new',
    label: 'Create Service Agreement',
    description: 'Create a new service agreement for a participant.',
    keywords: ['new agreement', 'create agreement', 'new service agreement'],
  },
  {
    path: '/invoices',
    label: 'Invoices',
    description: 'View and manage invoices. Create, submit, and track payment status for NDIS claims.',
    keywords: ['invoices', 'billing', 'payments', 'claims', 'ndis claims', 'finance'],
  },
  {
    path: '/invoices/new',
    label: 'Create Invoice',
    description: 'Create a new invoice for NDIS services delivered.',
    keywords: ['new invoice', 'create invoice', 'bill', 'claim'],
  },

  // ─── Quality ────────────────────────────────────────
  {
    path: '/incidents',
    label: 'Incidents',
    description: 'Incident register. Log, investigate, and track incidents including NDIS reportable incidents.',
    keywords: ['incidents', 'incident report', 'reportable incident', 'accident', 'injury', 'harm'],
  },
  {
    path: '/incidents/new',
    label: 'Report New Incident',
    description: 'Log a new incident. Captures details, severity, people involved, and triggers investigation workflow.',
    keywords: ['report incident', 'new incident', 'log incident', 'incident form'],
  },
  {
    path: '/complaints',
    label: 'Complaints',
    description: 'Complaints register. Log, investigate, and resolve complaints from participants, families, or staff.',
    keywords: ['complaints', 'complaint', 'feedback', 'grievance', 'dissatisfaction'],
  },
  {
    path: '/complaints/new',
    label: 'Lodge New Complaint',
    description: 'Lodge a new complaint. Captures complainant details, nature of complaint, and desired outcome.',
    keywords: ['new complaint', 'lodge complaint', 'file complaint', 'make complaint', 'complaint form'],
  },
  {
    path: '/concerns',
    label: 'Concerns',
    description: 'Concerns register. Log and manage concerns about participant welfare, worker conduct, or service quality.',
    keywords: ['concerns', 'concern', 'welfare', 'safeguarding', 'worry'],
  },
  {
    path: '/concerns/new',
    label: 'Raise New Concern',
    description: 'Raise a new concern about a participant, worker, or service.',
    keywords: ['new concern', 'raise concern', 'flag concern'],
  },
  {
    path: '/compliance',
    label: 'Compliance Dashboard',
    description: 'Overview of compliance status across NDIS Practice Standards, worker screening, training, and documentation.',
    keywords: ['compliance', 'audit', 'practice standards', 'ndis compliance', 'quality'],
  },
  {
    path: '/consent',
    label: 'Consent & Rights',
    description: 'Manage participant consent records, rights acknowledgments, capacity assessments, and authorised representatives.',
    keywords: ['consent', 'rights', 'capacity', 'representative', 'authorised representative', 'consent form'],
  },
  {
    path: '/consent/new',
    label: 'Record New Consent',
    description: 'Record a new consent form for a participant.',
    keywords: ['new consent', 'consent form', 'record consent'],
  },
  {
    path: '/consent/rights/new',
    label: 'Rights Acknowledgment',
    description: 'Create a new rights acknowledgment record for a participant.',
    keywords: ['rights', 'rights acknowledgment', 'participant rights'],
  },
  {
    path: '/consent/capacity/new',
    label: 'Capacity Assessment',
    description: 'Record a capacity assessment for a participant.',
    keywords: ['capacity', 'capacity assessment', 'decision making'],
  },
  {
    path: '/consent/representatives/new',
    label: 'Authorised Representative',
    description: 'Register an authorised representative for a participant.',
    keywords: ['representative', 'authorised representative', 'guardian', 'nominee'],
  },
  {
    path: '/risks',
    label: 'Risk Register',
    description: 'Organisation-wide risk register. Identify, assess, and manage risks with controls and review dates.',
    keywords: ['risks', 'risk register', 'risk assessment', 'risk management', 'hazard'],
  },
  {
    path: '/risks/new',
    label: 'Add New Risk',
    description: 'Add a new risk to the organisation risk register.',
    keywords: ['new risk', 'add risk', 'risk assessment'],
  },

  // ─── Communication ──────────────────────────────────
  {
    path: '/notifications',
    label: 'Notifications',
    description: 'View all system notifications including alerts, reminders, and updates.',
    keywords: ['notifications', 'alerts', 'reminders'],
  },
  {
    path: '/messages',
    label: 'Messages',
    description: 'Internal messaging between staff members. Create threads and communicate with your team.',
    keywords: ['messages', 'chat', 'internal messages', 'communication', 'team chat'],
  },

  // ─── System ─────────────────────────────────────────
  {
    path: '/policies',
    label: 'Policy Library',
    description: 'Browse all organisational policy documents with version history, supersede tracking, and review schedules.',
    keywords: ['policies', 'policy library', 'policy documents', 'versioning', 'supersede', 'review cycle'],
  },
  {
    path: '/audit',
    label: 'Audit Trail',
    description: 'View audit logs of all system actions for accountability and compliance tracking.',
    keywords: ['audit', 'audit trail', 'logs', 'history', 'accountability'],
  },
  {
    path: '/documents',
    label: 'Documents',
    description: 'Document management hub. Upload, organise, and access organisational and participant documents.',
    keywords: ['documents', 'files', 'uploads', 'document management'],
  },
  {
    path: '/settings',
    label: 'Settings',
    description: 'Organisation settings including profile, team management, integrations, and AI Buddy configuration.',
    keywords: ['settings', 'configuration', 'preferences', 'organisation settings'],
  },

  // ─── AI ─────────────────────────────────────────────
  {
    path: '/ai-buddy',
    label: 'AI Buddy',
    description: 'AI-powered NDIS policy and compliance assistant. Ask questions about policies, procedures, and regulations.',
    keywords: ['ai buddy', 'ai assistant', 'policy search', 'help'],
  },
]

/**
 * Serialise the route map into a compact string for the AI system prompt.
 */
export function serializeRouteMap(): string {
  return ROUTE_MAP.map(
    (r) => `- [${r.label}](${r.path}): ${r.description}`
  ).join('\n')
}
