export const WORKER_ONBOARDING_STAGES = [
  {
    number: 1,
    title: 'Contract',
    description: 'Letter of Engagement / Contract Signed',
    guidance: `Upload the signed letter of engagement or employment contract.\n\nEnsure the contract includes:\n- Role title and responsibilities\n- Employment type (contractor/employee/volunteer)\n- Hours and availability\n- Pay rate and conditions\n- Start date`,
    policyRef: 'CM.3.1 - Human Resources',
  },
  {
    number: 2,
    title: 'Position Description',
    description: 'Position Description Provided & Acknowledged',
    guidance: `Upload the position description for this worker's role and confirm they have read and acknowledged it.\n\nThe position description should match the role title (e.g., Registered Nurse, Builder, Plan Manager, Personal Trainer, Translator/Interpreter).`,
    policyRef: 'CM.3.1 - Human Resources',
  },
  {
    number: 3,
    title: '100 Points of ID',
    description: '100 Points of ID Verified',
    guidance: `Verify the worker's identity with 100 points of ID.\n\nPoint values:\n• Passport — 70 pts\n• Birth Certificate — 70 pts\n• Citizenship Certificate — 70 pts\n• Driver's Licence — 40 pts\n• Medicare Card — 40 pts\n• Photo ID Card — 40 pts\n• Utility Bill — 25 pts\n• Bank Statement — 25 pts`,
    policyRef: 'CM.3.1 - Human Resources',
  },
  {
    number: 4,
    title: 'NDIS Screening',
    description: 'NDIS Worker Screening Check',
    guidance: `Record the NDIS Worker Screening Check status.\n\nThis is NON-NEGOTIABLE — workers CANNOT be assigned to participants until this is "Cleared".\n\nNDIS Worker Screening Checks are valid for 5 years from issue. Workers must hold a valid clearance at all times while providing NDIS supports.`,
    policyRef: 'CM.3.1, NDIS Practice Standards',
  },
  {
    number: 5,
    title: 'Police Check',
    description: 'National Police Check (< 3 years)',
    guidance: `Record the National Criminal History Check.\n\nThe police check must be:\n• Less than 3 years old\n• Show "No disclosable outcomes"\n\nIf the check reveals disclosable outcomes, escalate to the Director for a risk assessment.`,
    policyRef: 'CM.3.1 - Human Resources',
  },
  {
    number: 6,
    title: 'Orientation',
    description: 'NDIS Worker Orientation Module',
    guidance: `The worker must complete the official NDIS Worker Orientation Module ("Quality, Safety and You").\n\nThis is a free online module provided by the NDIS Quality and Safeguards Commission. Upload the completion certificate as evidence.`,
    policyRef: 'CM.3.1, NDIS Practice Standards',
  },
  {
    number: 7,
    title: 'WWCC',
    description: 'Working With Children Check',
    guidance: `Required ONLY if the worker will support participants under 18.\n\nIf not applicable, mark as "Not Required" and proceed.\n\nEven if not currently needed, we recommend workers obtain a WWCC. In NSW, apply via Service NSW.`,
    policyRef: 'CM.3.1 - Human Resources',
  },
  {
    number: 8,
    title: 'Code of Conduct',
    description: 'Signed NDIS Code of Conduct',
    guidance: `The worker must read and sign the NDIS Code of Conduct.\n\nThe Code of Conduct requires workers to:\n• Act with respect for individual rights\n• Act with integrity, honesty and transparency\n• Provide supports safely and competently\n• Act with integrity and not exploit people\n• Take all reasonable steps to prevent and respond to violence, abuse, neglect and exploitation`,
    policyRef: 'NDIS Code of Conduct',
  },
  {
    number: 9,
    title: 'Induction',
    description: 'Staff Induction Completed',
    guidance: `Complete the staff induction checklist. All 10 items must be checked before this step is considered complete.\n\nThe induction covers organisational policies, participant rights, incident reporting, WHS, and role-specific training.`,
    policyRef: 'CM.3.1 - Human Resources',
  },
  {
    number: 10,
    title: 'Qualifications',
    description: 'Qualifications Verified',
    guidance: `Verify role-specific qualifications and select the registration groups this worker is qualified to deliver.\n\nRole-specific requirements:\n• Registered Nurse → AHPRA registration\n• Builder → Builder's licence\n• Plan Manager → CA/CPA or equivalent\n• Transport → Valid driver's licence + vehicle insurance\n\nMinimum 2 references should be verified.`,
    policyRef: 'CM.3.1 - Human Resources',
  },
] as const

export const INDUCTION_CHECKLIST_ITEMS = [
  'Organisation overview provided',
  'Policies and procedures explained',
  'Code of Conduct discussed',
  'Participant rights explained',
  'Incident reporting process explained',
  'Complaints process explained',
  'WHS and infection control',
  'Emergency procedures',
  'Role-specific training',
  'Data and privacy obligations',
]

export const ID_DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport', points: 70 },
  { value: 'birth_certificate', label: 'Birth Certificate', points: 70 },
  { value: 'citizenship_certificate', label: 'Citizenship Certificate', points: 70 },
  { value: 'drivers_licence', label: "Driver's Licence", points: 40 },
  { value: 'medicare_card', label: 'Medicare Card', points: 40 },
  { value: 'photo_id', label: 'Photo ID Card', points: 40 },
  { value: 'utility_bill', label: 'Utility Bill', points: 25 },
  { value: 'bank_statement', label: 'Bank Statement', points: 25 },
] as const

export const SCREENING_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'pending', label: 'Pending' },
  { value: 'cleared', label: 'Cleared' },
  { value: 'expired', label: 'Expired' },
  { value: 'barred', label: 'Barred' },
] as const

export const POLICE_CHECK_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'pending', label: 'Pending' },
  { value: 'clear', label: 'Clear' },
  { value: 'disclosable', label: 'Disclosable Outcomes' },
  { value: 'expired', label: 'Expired' },
] as const

export const WWCC_STATUS_OPTIONS = [
  { value: 'not_required', label: 'Not Required' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'pending', label: 'Pending' },
  { value: 'cleared', label: 'Cleared' },
  { value: 'expired', label: 'Expired' },
] as const

export const WORKER_STATUS_COLORS: Record<string, string> = {
  onboarding: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  terminated: 'bg-red-100 text-red-800',
}

export const COMPLIANCE_COLORS = {
  green: 'bg-green-100 text-green-800 border-green-300',
  amber: 'bg-amber-100 text-amber-800 border-amber-300',
  red: 'bg-red-100 text-red-800 border-red-300',
} as const

export const EMPLOYMENT_TYPES = [
  { value: 'contractor', label: 'Contractor' },
  { value: 'employee', label: 'Employee' },
  { value: 'volunteer', label: 'Volunteer' },
] as const

export const QUALIFICATION_TYPES = [
  { value: 'ahpra', label: 'AHPRA Registration' },
  { value: 'first_aid', label: 'First Aid & CPR' },
  { value: 'manual_handling', label: 'Manual Handling' },
  { value: 'infection_control', label: 'Infection Control' },
  { value: 'builders_licence', label: "Builder's Licence" },
  { value: 'drivers_licence', label: "Driver's Licence" },
  { value: 'ca_cpa', label: 'CA/CPA or Equivalent' },
  { value: 'other', label: 'Other' },
] as const

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  no_show: 'bg-red-100 text-red-800',
}
