export const TEST_CREDENTIALS = {
  director: {
    email: 'erfan.test@gmail.com',
    password: 'Employee123!!',
  },
}

export const TEST_PARTICIPANT = {
  first_name: 'E2E_Test',
  last_name: 'Participant',
  ndis_number: '4399999901',
  phone: '0400000001',
  email: 'e2e.participant@test.com',
  referral_source: 'E2E Testing',
  urgency: 'routine' as const,
}

export const TEST_WORKER = {
  first_name: 'E2E_Test',
  last_name: 'Worker',
  email: 'e2e.worker@test.com',
  phone: '0400000002',
  role_title: 'Support Worker',
  employment_type: 'employee' as const,
}

export const TEST_INVOICE = {
  funding_type: 'ndia_managed' as const,
  line_item: {
    support_item_name: 'E2E Test Service',
    date_of_service: new Date().toISOString().split('T')[0],
    quantity: 2,
    unit: 'hour' as const,
    unit_price: 65.47,
    gst_applicable: false,
    claim_type: 'standard' as const,
  },
}

export const TEST_INCIDENT = {
  incident_type: 'injury' as const,
  severity: 'minor' as const,
  description: 'E2E test incident description for automated testing purposes.',
  is_reportable: false,
}

export const TEST_COMPLAINT = {
  complainant_name: 'E2E Test Complainant',
  category: 'service_delivery' as const,
  description: 'E2E test complaint description for automated testing purposes.',
}

export const TEST_CONCERN = {
  concern_type: 'safety' as const,
  severity: 'low' as const,
  title: 'E2E Test Concern',
  description: 'E2E test concern description for automated testing purposes.',
}

export const TEST_GOAL = {
  title: 'E2E Test Goal',
  domain: 'daily_living' as const,
  timeframe: 'short_term' as const,
  priority: 'medium' as const,
}

export const TEST_CONSENT = {
  consent_type: 'service_agreement' as const,
  consent_method: 'written' as const,
  title: 'E2E Test Consent',
  scope: 'E2E test consent scope for automated testing',
  given_by_name: 'E2E Test Person',
}

export const TEST_RISK = {
  title: 'E2E Test Risk',
  description: 'E2E test risk description for automated testing purposes.',
  category: 'environmental' as const,
  likelihood: 'possible' as const,
  consequence: 'moderate' as const,
}

export const TEST_PROGRESS_NOTE = {
  content: 'E2E test progress note content for automated testing.',
  service_type: 'Daily Personal Activities',
}

export const SIDEBAR_LINKS = [
  'Dashboard',
  'Participants',
  'Workers',
  'Calendar',
  'Goals',
  'Progress Notes',
  'Invoices',
  'Incidents',
  'Complaints',
  'Concerns',
  'Compliance',
  'Consent & Rights',
  'Risk Register',
  'Notifications',
  'Messages',
  'AI Buddy',
  'Audit Trail',
  'Documents',
  'Settings',
]
