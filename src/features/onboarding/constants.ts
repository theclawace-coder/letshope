export const ONBOARDING_STAGES = [
  {
    number: 1,
    title: 'Referral',
    description: 'Capture the basics from the referral',
    guidance: `You've received a referral. Let's capture the basics so we can move to scheduling an initial meeting.\n\nQuestions to ask the referrer:\n- What supports does the participant need?\n- Is this routine, urgent, or crisis?\n- Who is the Support Coordinator or LAC?`,
    policyRef: 'CM.4.1 - Service Agreements',
  },
  {
    number: 2,
    title: 'Meet & Learn',
    description: 'Meet the participant — explain their rights, learn about them, collect all details',
    guidance: `Meet with the participant (and guardian/family if applicable). Walk through each section — the handbook content is shown inline so you can read it together.\n\nThis stage collects everything in one pass:\n- Explain services, rights, complaints, privacy (handbook shown inline)\n- Personal details, medical, needs, goals\n- Emergency contacts, coordinators\n- NDIS plan details`,
    policyRef: 'CM.2.6 - Participant Rights, CM.4.1 - Service Agreements, CM.2.8 - Privacy',
  },
  {
    number: 3,
    title: 'Review & Sign',
    description: 'Review the service agreement together and sign digitally',
    guidance: `The service agreement is populated with everything you've entered. Go through it with the participant, toggle their consent items, and capture signatures.\n\nThe handbook is available to scroll through together. All PDFs are generated automatically for your compliance records.`,
    policyRef: 'CM.4.1, CM.2.6, CM.2.8',
  },
  {
    number: 4,
    title: 'Team & Schedule',
    description: 'Assign workers and schedule their first visits',
    guidance: `Assign qualified workers to each service, then schedule their first visits right away.\n\nBefore assignment, verify the worker has:\n- Current NDIS Worker Screening\n- National Police Check\n- Signed Code of Conduct\n- NDIS Orientation Module\n\nFor the first visit, add a note: "First visit - bring Risk Assessment to complete"`,
    policyRef: 'CM.3.1 - Human Resources, CM.4.1 - Service Agreements',
  },
  {
    number: 5,
    title: 'Risk & Go Live',
    description: 'Complete risk assessment and activate the participant',
    guidance: `Complete the risk assessment (ideally during or after the first visit), then review the activation checklist.\n\nOnce activated:\n- Participant status changes to "Active"\n- Workers see participant in their list\n- Budget tracking begins\n- Dashboard updates`,
    policyRef: 'CM.6.9 - Risk Management, M1.5 - Clinical Risk, CM.4.1',
  },
] as const

export type ChecklistItemType = 'manual' | 'auto'

export interface MeetingChecklistItem {
  id: string
  label: string
  type: ChecklistItemType
  /** For auto items: the Stage2Data field key that drives auto-tick */
  field?: string
  /** Placeholder text for the inline textarea (auto items only) */
  placeholder?: string
  /** Hint shown below the label */
  hint?: string
  /** Inline handbook content to show when this item is expanded */
  handbookContent?: string
}

export const MEETING_CHECKLIST_ITEMS: MeetingChecklistItem[] = [
  {
    id: 'explain_services',
    label: 'Explain what services you provide',
    type: 'manual',
    hint: 'Tick once you have explained your services to the participant.',
    handbookContent: `**Hope Disability Support** is a registered NDIS provider delivering disability support services across the community.

We provide the following supports (depending on your plan):
• **Daily Personal Activities (0107)** — help with showering, dressing, grooming, meal preparation, and household tasks
• **High Intensity Daily Personal Activities (0104)** — clinical and complex care supports
• **Community Nursing (0114)** — wound management, medication management, and health monitoring
• **Community Participation (0125)** — support to access the community, social events, and recreational activities
• **Transport (0108)** — assistance getting to appointments, activities, and social events
• **Plan Management (0126/0127)** — managing your NDIS budget, paying invoices, and financial reporting
• **Development of Daily Care & Life Skills (0117)** — building your independence

We tailor every service to your goals and preferences. You choose what support you receive, when, and how.

**Our Values:**
• **Respect** — We treat every person with dignity and respect
• **Choice** — You decide how you want to live your life
• **Inclusion** — Everyone deserves to be part of the community
• **Safety** — Your wellbeing is our top priority
• **Quality** — We continuously improve our services
• **Accountability** — We are transparent in everything we do`,
  },
  {
    id: 'explain_rights',
    label: 'Explain their rights',
    type: 'manual',
    hint: 'Read through the rights below with the participant.',
    handbookContent: `**Your Rights as an NDIS Participant**

The NDIS Quality and Safeguards Commission ensures providers like us meet high standards. You have the right to:

• **Be treated with dignity and respect** at all times
• **Be free from abuse, neglect, exploitation, and violence**
• **Choose who provides your supports**
• **Be involved in decisions** about your supports and services
• **Have your cultural and linguistic needs respected**
• **Access your personal information** we hold about you
• **Privacy and confidentiality** of your information
• **Provide feedback, raise concerns, or make a complaint** without fear of retribution
• **Have your complaints heard and resolved fairly**
• **Change or leave your service provider** at any time

**NDIS Code of Conduct — All our staff must:**
• Act with respect for individual rights to freedom of expression, self-determination and decision-making
• Respect the privacy of people with disability
• Provide supports and services in a safe and competent manner
• Act with integrity, honesty and transparency
• Promptly take steps to raise and act on concerns about quality and safety of supports
• Take all reasonable steps to prevent and respond to all forms of violence, exploitation, neglect and abuse
• Take all reasonable steps to prevent and respond to sexual misconduct

**Advocacy:** You have the right to use an advocate — someone who can speak on your behalf.
National Disability Advocacy Program: **1800 880 052** (free and independent)

If you feel your rights are not being respected, contact:
• **NDIS Quality and Safeguards Commission** — 1800 035 544 (free call)
  TTY: 133 677 | Interpreters: 131 450 | National Relay: 1300 555 727
• **Your Support Coordinator or LAC**
• **Us directly** — we take all concerns seriously`,
  },
  {
    id: 'explain_complaints',
    label: 'Explain how to make a complaint',
    type: 'manual',
    hint: 'Walk through the complaints process.',
    handbookContent: `**How to Make a Complaint or Give Feedback**

We welcome your feedback — both positive and negative. It helps us improve our services. You will never be treated differently for making a complaint.

**Step 1: Talk to Us**
You can speak directly to your support worker, contact our office, or ask someone you trust to speak on your behalf.

**Step 2: Formal Complaint**
If you are not satisfied after speaking to us, you can lodge a formal complaint. We will:
• **Acknowledge your complaint within 2 business days**
• **Aim to resolve it within 21 business days**

**Step 3: External Complaint**
If you are still not satisfied, you can contact the NDIS Quality and Safeguards Commission:
• **Phone:** 1800 035 544 (free call from landlines)
• **TTY:** 133 677
• **Interpreters:** 131 450
• **National Relay Service:** 1300 555 727

You can also contact the **National Disability Advocacy Program** on **1800 880 052** for free independent support.

**Cancellation Policy:**
• 2+ business days notice — no charge
• Less than 2 business days — up to 90% may be charged
• No notice (no show) — up to 100% may be charged

**Emergency Contacts:**
• Emergency Services: **000**
• Lifeline 24/7: **13 11 14**
• Beyond Blue: **1300 22 4636**`,
  },
  {
    id: 'explain_privacy',
    label: 'Explain privacy — how you will handle their information',
    type: 'manual',
    hint: 'Explain data collection, storage and sharing practices.',
    handbookContent: `**How We Handle Your Information**

We collect personal information about you in order to provide disability support services under the NDIS. We are committed to protecting your privacy and handling your personal information in accordance with the **Privacy Act 1988 (Cth)** and the **Australian Privacy Principles**.

**What we collect:**
• Name, address, date of birth, and contact details
• NDIS participant number and plan details
• Medical history, diagnoses, allergies, and medications
• Emergency contact details
• Guardian/nominee details (if applicable)
• Cultural and linguistic background
• Support needs, goals, and preferences
• Progress notes and service delivery records
• Photos or recordings (with separate consent)

**How we use it:**
• Deliver disability support services to you
• Develop and review your individual support plan
• Communicate with you about your services
• Process NDIS claims and invoicing
• Meet our legal and regulatory obligations

**Who we may share with (with your consent):**
• The National Disability Insurance Agency (NDIA)
• NDIS Quality and Safeguards Commission
• Your Support Coordinator, LAC, or Plan Manager
• Other service providers involved in your care
• Medical practitioners and health professionals
• Emergency services (in case of emergency)
• Government agencies as required by law

**Your rights:**
• Access your personal information held by us
• Request correction of inaccurate information
• Withdraw consent at any time (in writing)
• Make a privacy complaint if you believe your information has been mishandled

**Important:** Withdrawing consent may affect our ability to continue providing certain services. We will discuss any implications with you before changes take effect.`,
  },
  {
    id: 'ask_goals',
    label: 'Ask about their goals — what do they want to achieve?',
    type: 'auto',
    field: 'goals',
    placeholder: 'Goals are captured in the Goals section below.',
  },
  {
    id: 'ask_communication',
    label: 'Ask about communication needs (language, hearing, cognitive)',
    type: 'auto',
    field: 'communication_needs',
    placeholder: 'e.g., Uses Auslan, needs Easy Read, prefers visual aids…',
  },
  {
    id: 'ask_cultural',
    label: 'Ask about cultural/religious considerations',
    type: 'auto',
    field: 'cultural_needs',
    placeholder: 'e.g., Halal food, prayer times, cultural practices…',
  },
  {
    id: 'ask_medical',
    label: 'Ask about medical conditions and allergies',
    type: 'auto',
    field: 'medical_conditions',
    placeholder: 'List any medical conditions, diagnoses and allergies…',
  },
  {
    id: 'ask_medications',
    label: 'Ask about medications',
    type: 'auto',
    field: 'medications',
    placeholder: 'List current medications, dosages and timing…',
  },
  {
    id: 'ask_mobility',
    label: 'Ask about mobility/access needs',
    type: 'auto',
    field: 'mobility_needs',
    placeholder: 'e.g., Uses wheelchair, needs ramps, limited mobility…',
  },
  {
    id: 'ask_others_involved',
    label: 'Discuss who else is involved (family, other providers)',
    type: 'auto',
    field: 'other_providers',
    placeholder: 'Family members involved, other support providers, etc.',
  },
  {
    id: 'confirm_guardian',
    label: 'Confirm guardian/nominee authority (if applicable)',
    type: 'auto',
    field: 'guardian',
    hint: 'Toggle below if the participant has a guardian or nominee.',
  },
]

export const SERVICE_QUESTIONS: Record<string, { label: string; questions: string[] }> = {
  '0107': {
    label: 'Daily Personal Activities',
    questions: [
      'What daily activities do you need help with? (showering, dressing, grooming, toileting, meal prep)',
      'What times of day do you prefer support?',
      'Do you have any preferences for male/female worker?',
      'Are there any tasks you want to learn to do yourself?',
    ],
  },
  '0114': {
    label: 'Community Nursing',
    questions: [
      'What nursing supports do you need?',
      'Who is your GP and specialist?',
      'Do you have any current care plans from your doctor?',
      'Are you on any medications? (list them)',
      'Any allergies?',
    ],
  },
  '0127': {
    label: 'Plan Management',
    questions: [
      'Do you understand what plan management means?',
      'Do you use any other providers? (we need their details)',
      'How do you prefer to receive your budget reports? (email, post, in person)',
    ],
  },
  '0126': {
    label: 'Plan Management (Financial Admin)',
    questions: [
      'Do you understand what plan management means?',
      'Do you use any other providers?',
      'How do you prefer to receive your budget reports?',
    ],
  },
  '0108': {
    label: 'Transport',
    questions: [
      'Where do you need to go regularly? (appointments, activities, social events)',
      'Do you need wheelchair-accessible transport?',
      'Any specific times/days?',
    ],
  },
  '0104': {
    label: 'High Intensity Daily Personal Activities',
    questions: [
      'What high intensity supports do you require?',
      'Do you have existing care plans from medical professionals?',
      'Are there any clinical risks we should be aware of?',
    ],
  },
}

export const RISK_ASSESSMENT_SECTIONS = {
  home_environment: {
    title: 'Home Environment',
    questions: [
      { id: 'trip_hazards', label: 'Are there trip hazards? (rugs, cords, steps)', options: ['None identified', 'Minor', 'Significant'] },
      { id: 'bathroom_safe', label: 'Is the bathroom accessible and safe?', options: ['Yes', 'Modifications needed', 'Significant risks'] },
      { id: 'lighting', label: 'Is there adequate lighting?', options: ['Yes', 'No'] },
      { id: 'pets', label: 'Are there pets that may pose a risk?', options: ['No pets', 'Friendly', 'Potentially aggressive'] },
      { id: 'emergency_exits', label: 'Emergency exits accessible?', options: ['Yes', 'No'] },
      { id: 'smoke_alarms', label: 'Smoke alarms installed and working?', options: ['Yes', 'No'] },
    ],
  },
  health_safety: {
    title: 'Health & Safety',
    questions: [
      { id: 'fall_risk', label: 'Fall risk level?', options: ['Low', 'Medium', 'High'] },
      { id: 'skin_integrity', label: 'Skin integrity concerns?', options: ['None', 'Monitor', 'Active wounds - refer to RN'] },
      { id: 'dysphagia', label: 'Dysphagia/choking risk?', options: ['None', 'Modified texture diet', 'Severe - refer to RN'] },
      { id: 'seizure_risk', label: 'Seizure risk?', options: ['None', 'History - managed', 'Active'] },
      { id: 'self_harm', label: 'Self-harm risk?', options: ['None', 'History', 'Current - flag immediately'] },
      { id: 'aggression', label: 'Risk of aggression towards others?', options: ['None', 'History - managed', 'Active'] },
      { id: 'wandering', label: 'Risk of wandering/absconding?', options: ['None', 'Monitor', 'Significant'] },
    ],
  },
  communication: {
    title: 'Communication',
    questions: [
      { id: 'verbal', label: 'Can communicate verbally?', options: ['Yes', 'Limited', 'No'] },
      { id: 'hearing_vision', label: 'Hearing/vision impairment?', options: ['No', 'Hearing', 'Vision', 'Both'] },
      { id: 'interpreter', label: 'Interpreter needed?', options: ['No', 'Yes'] },
      { id: 'cognitive_support', label: 'Cognitive/intellectual support needed?', options: ['No', 'Easy Read materials', 'Significant support'] },
    ],
  },
}
