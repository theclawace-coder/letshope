-- Phase 6 Seed: NDIS Policy Documents
-- Migration: 00006_seed_ndis_policy_documents.sql
-- Seeds core NDIS policy content as chunked documents for AI Buddy semantic search.
-- After running this migration, run the embed-policy-docs Edge Function to generate embeddings.

-- =============================================================
-- 1. NDIS CODE OF CONDUCT
-- =============================================================

INSERT INTO policy_documents (title, source, category, chunk_index, content, metadata) VALUES

-- Chunk 0: Overview
('NDIS Code of Conduct - Overview',
 'NDIS Code of Conduct', 'code_of_conduct', 0,
 'The NDIS Code of Conduct requires all NDIS workers and providers to:
1. Act with respect for individual rights to freedom of expression, self-determination and decision-making in accordance with applicable laws and conventions.
2. Respect the privacy of people with disability.
3. Provide supports and services in a safe and competent manner, with care and skill.
4. Act with integrity, honesty and transparency.
5. Promptly take steps to raise and act on concerns about matters that may impact the quality and safety of supports and services provided to people with disability.
6. Take all reasonable steps to prevent and respond to all forms of violence against, and exploitation, neglect and abuse of, people with disability.
7. Take all reasonable steps to prevent and respond to sexual misconduct.

The Code applies to: registered NDIS providers, unregistered NDIS providers, workers employed or otherwise engaged by NDIS providers, and sole traders delivering NDIS supports.',
 '{"section": "Overview", "legislation": "National Disability Insurance Scheme Act 2013, Section 73V"}'),

-- Chunk 1: Respect & Dignity
('NDIS Code of Conduct - Respect and Dignity',
 'NDIS Code of Conduct', 'code_of_conduct', 1,
 'Workers must act with respect for individual rights to freedom of expression, self-determination and decision-making. This means:
- Supporting participants to make their own decisions and respecting their choices, even when you disagree.
- Using respectful, person-first language at all times.
- Recognising and respecting cultural, linguistic, and religious diversity.
- Not imposing your own values, beliefs, or opinions on participants.
- Supporting participants to exercise their rights, including their right to dignity of risk.
- Providing information in accessible formats to support informed decision-making.
- Respecting participants'' right to refuse supports or services.
- Ensuring communication is appropriate and accessible for each individual.',
 '{"section": "Principle 1: Respect", "legislation": "Section 73V(2)(a)"}'),

-- Chunk 2: Privacy
('NDIS Code of Conduct - Privacy',
 'NDIS Code of Conduct', 'code_of_conduct', 2,
 'Workers must respect the privacy of people with disability. This includes:
- Only collecting personal information that is necessary for providing supports and services.
- Storing personal and sensitive information securely, in accordance with the Privacy Act 1988 and applicable state/territory laws.
- Only sharing personal information with authorised persons and with the participant''s informed consent, unless required by law.
- Being mindful of participant privacy in shared living environments and community settings.
- Not discussing participant information in public spaces or with unauthorised persons.
- Ensuring electronic records are password-protected and access is limited to authorised staff.
- Informing participants about what information is collected, why, and how it will be used.
- Following the organisation''s privacy and confidentiality policies at all times.',
 '{"section": "Principle 2: Privacy", "legislation": "Section 73V(2)(b)"}'),

-- Chunk 3: Safe & Competent
('NDIS Code of Conduct - Safe and Competent Service Delivery',
 'NDIS Code of Conduct', 'code_of_conduct', 3,
 'Workers must provide supports and services in a safe and competent manner, with care and skill. This means:
- Only delivering supports you are qualified and trained to provide.
- Following your organisation''s policies, procedures, and guidelines.
- Maintaining up-to-date knowledge and skills relevant to your role.
- Following infection control, manual handling, and workplace health and safety procedures.
- Identifying and managing risks to participant safety.
- Reporting any safety concerns or incidents promptly.
- Not working under the influence of alcohol or drugs.
- Using equipment and assistive technology safely and as intended.
- Seeking guidance from supervisors when unsure about how to provide supports.',
 '{"section": "Principle 3: Safe & Competent", "legislation": "Section 73V(2)(c)"}'),

-- Chunk 4: Integrity
('NDIS Code of Conduct - Integrity, Honesty and Transparency',
 'NDIS Code of Conduct', 'code_of_conduct', 4,
 'Workers must act with integrity, honesty and transparency. This means:
- Being honest with participants about what supports and services you can provide.
- Declaring any conflicts of interest.
- Not accepting gifts or inducements that could influence your professional judgement.
- Accurately recording and reporting the supports and services you deliver.
- Not making false or misleading claims about your qualifications, experience, or the services you provide.
- Being transparent about pricing, fees, and any costs associated with supports.
- Raising concerns about unethical or unsafe practices through appropriate channels.
- Maintaining professional boundaries with participants at all times.',
 '{"section": "Principle 4: Integrity", "legislation": "Section 73V(2)(d)"}'),

-- Chunk 5: Raising Concerns
('NDIS Code of Conduct - Raising and Acting on Concerns',
 'NDIS Code of Conduct', 'code_of_conduct', 5,
 'Workers must promptly take steps to raise and act on concerns about matters that may impact the quality and safety of supports. This means:
- Reporting concerns about the quality or safety of supports to your supervisor or manager immediately.
- Following your organisation''s incident reporting and complaints procedures.
- Understanding your obligations as a mandatory reporter (where applicable under state/territory law).
- Cooperating with any investigations or audits related to the quality and safety of supports.
- Not victimising or retaliating against anyone who raises a concern or complaint.
- Knowing how to contact the NDIS Quality and Safeguards Commission to raise concerns externally if needed (phone: 1800 035 544).
- Documenting concerns accurately and promptly.',
 '{"section": "Principle 5: Raising Concerns", "legislation": "Section 73V(2)(e)"}'),

-- Chunk 6: Violence & Abuse Prevention
('NDIS Code of Conduct - Preventing Violence, Abuse, Neglect and Exploitation',
 'NDIS Code of Conduct', 'code_of_conduct', 6,
 'Workers must take all reasonable steps to prevent and respond to all forms of violence against, and exploitation, neglect and abuse of, people with disability. This includes:
- Understanding the different forms of abuse: physical, emotional, sexual, financial, and neglect.
- Being able to recognise signs and indicators of abuse, neglect, and exploitation.
- Reporting suspected abuse, neglect, or exploitation immediately in accordance with your organisation''s policies and relevant laws.
- Understanding that people with disability are at higher risk of experiencing violence and abuse.
- Creating safe environments and supporting participants to feel safe to disclose concerns.
- Not engaging in any form of abuse, violence, exploitation, or neglect.
- Completing training on abuse prevention and response.
- Understanding and following mandatory reporting obligations.',
 '{"section": "Principle 6: Violence Prevention", "legislation": "Section 73V(2)(f)"}');

-- =============================================================
-- 2. NDIS PRACTICE STANDARDS - INCIDENT MANAGEMENT
-- =============================================================

INSERT INTO policy_documents (title, source, category, chunk_index, content, metadata) VALUES

('Incident Management - Core Requirements',
 'NDIS Practice Standards', 'incident_management', 0,
 'NDIS Practice Standard: Incident Management System

Providers must have an incident management system that:
1. Identifies, records, and manages all incidents, including near misses.
2. Includes procedures for investigation, corrective actions, and follow-up.
3. Protects the rights of people with disability during incident management processes.
4. Is accessible to participants and their families/carers to report incidents.

Key requirements:
- All incidents must be recorded and investigated proportionate to their severity.
- Workers must be trained in incident identification, reporting, and response procedures.
- The system must include processes for escalation, notification, and review.
- Root cause analysis must be conducted for serious incidents.
- Corrective actions and preventive measures must be documented and implemented.
- Regular review and analysis of incident data must occur to identify trends and systemic issues.
- The system must comply with the National Disability Insurance Scheme (Incident Management and Reportable Incidents) Rules 2018.',
 '{"section": "Incident Management", "standard_ref": "Practice Standard 4.1"}'),

('Reportable Incidents - NDIS Commission Requirements',
 'NDIS Practice Standards', 'incident_management', 1,
 'Reportable Incidents to the NDIS Commission:

A reportable incident is one that occurs in connection with the provision of NDIS supports and services, involving:
1. The death of a person with disability
2. Serious injury of a person with disability
3. Abuse or neglect of a person with disability
4. Unlawful sexual or physical contact with, or assault of, a person with disability
5. Sexual misconduct committed against, or in the presence of, a person with disability, including grooming
6. The use of a restrictive practice in relation to a person with disability where the use is not in accordance with an authorisation

Reporting timeframes:
- Initial notification: within 24 hours of becoming aware of the incident
- Detailed 5-day report: within 5 business days of becoming aware
- Final report: when investigation is complete (no fixed deadline, but should be resolved as soon as practicable)

The provider''s Key Personnel are responsible for ensuring reportable incidents are notified to the NDIS Commission. Failure to report is a compliance breach.',
 '{"section": "Reportable Incidents", "standard_ref": "Practice Standard 4.1.1", "legislation": "NDIS (Incident Management and Reportable Incidents) Rules 2018"}'),

('Incident Investigation and Response',
 'NDIS Practice Standards', 'incident_management', 2,
 'Incident Investigation Requirements:

When investigating an incident, providers must:
1. Ensure the immediate safety and wellbeing of all persons involved.
2. Preserve any evidence related to the incident.
3. Notify relevant authorities (police, child protection, etc.) where required by law.
4. Conduct an investigation proportionate to the severity of the incident.
5. Identify root causes and contributing factors.
6. Develop and implement corrective actions to prevent recurrence.
7. Monitor the effectiveness of corrective actions.
8. Support affected participants throughout the investigation process.

Investigation principles:
- Investigations should be conducted by a person with appropriate skills and who is independent of the incident.
- Procedural fairness must be afforded to all parties.
- Participants must be supported to participate in the investigation process, including through the use of advocates.
- Investigation findings must be documented and reported to the governing body.
- Affected workers must be managed in accordance with employment law obligations.
- Outcomes and lessons learned must be communicated to relevant staff.',
 '{"section": "Incident Investigation", "standard_ref": "Practice Standard 4.1.2"}');

-- =============================================================
-- 3. NDIS PRACTICE STANDARDS - COMPLAINTS MANAGEMENT
-- =============================================================

INSERT INTO policy_documents (title, source, category, chunk_index, content, metadata) VALUES

('Complaints Management - Core Requirements',
 'NDIS Practice Standards', 'complaints_management', 0,
 'NDIS Practice Standard: Complaints Management

Providers must have a complaints management and resolution system that:
1. Is accessible and easy to understand for all participants, including those with communication support needs.
2. Manages and resolves complaints in a timely, fair, and transparent manner.
3. Protects the rights of complainants from retribution or victimisation.
4. Uses complaints data to improve service quality.

Key requirements:
- Complaints must be acknowledged within 2 business days of receipt.
- A target resolution timeframe of 21 days should be set, with extensions communicated to the complainant.
- Participants must be informed about their right to make a complaint and how to do so, at the commencement of service.
- Information about the complaints process must be available in accessible formats.
- Participants must be supported to make complaints, including through the use of advocates.
- Workers must be trained in complaints handling procedures.
- A complaint must not adversely affect the supports or services provided to a participant.',
 '{"section": "Complaints Management", "standard_ref": "Practice Standard 4.2"}'),

('Complaints Resolution Process',
 'NDIS Practice Standards', 'complaints_management', 1,
 'Complaints Resolution Process:

Step 1 - Receive: Accept the complaint through any channel (verbal, written, online, via advocate). Record all details including date received, complainant details, nature of complaint, and desired outcome.

Step 2 - Acknowledge: Acknowledge receipt within 2 business days. Provide the complainant with a reference number and expected timeframe for resolution.

Step 3 - Assess: Determine the severity and urgency. Identify if immediate action is required to ensure participant safety. Assign an appropriate person to manage the complaint.

Step 4 - Investigate: Gather relevant information, interview parties involved, review documentation. Ensure procedural fairness for all parties.

Step 5 - Resolve: Determine an appropriate outcome and communicate it to the complainant. Implement any remedial actions required.

Step 6 - Review: If the complainant is not satisfied, offer an internal review by a more senior person. Inform them of their right to escalate to the NDIS Commission.

Step 7 - Close and Record: Document the outcome, lessons learned, and any systemic improvements identified. Update policies and procedures as needed.

If a complainant is not satisfied with the outcome, they can contact the NDIS Quality and Safeguards Commission on 1800 035 544 or via the online complaint form.',
 '{"section": "Complaints Resolution", "standard_ref": "Practice Standard 4.2.1"}');

-- =============================================================
-- 4. NDIS PRACTICE STANDARDS - WORKER SCREENING
-- =============================================================

INSERT INTO policy_documents (title, source, category, chunk_index, content, metadata) VALUES

('Worker Screening - Requirements',
 'NDIS Practice Standards', 'worker_screening', 0,
 'NDIS Worker Screening Requirements:

All workers in risk-assessed roles must have an NDIS Worker Screening Check clearance before commencing work in those roles. Risk-assessed roles include:
- Key personnel (CEO, board members, etc.)
- Workers who have more than incidental contact with people with disability
- Workers who have access to participant records or information

NDIS Worker Screening Check:
- Conducted by the relevant state/territory worker screening unit
- Involves a national criminal history check and assessment of other relevant information
- Results in either a clearance or an exclusion
- Clearances are valid for 5 years and are portable across states/territories for NDIS work
- Workers with an exclusion must not work in risk-assessed roles

Additional screening:
- Working With Children Check (WWCC) may also be required depending on the state/territory
- National Police Check may be required for non-risk-assessed roles
- AHPRA registration verification for health professionals
- Reference checks for all new workers
- 100-point identity verification

Providers must:
- Verify worker screening status before engagement
- Maintain a register of all worker screening checks and their expiry dates
- Have processes to ensure checks are renewed before expiry
- Not engage workers who have received an exclusion',
 '{"section": "Worker Screening", "standard_ref": "Practice Standard 2.2", "legislation": "NDIS (Practice Standards - Worker Screening) Rules 2018"}'),

('Worker Orientation and Induction',
 'NDIS Practice Standards', 'worker_screening', 1,
 'Worker Orientation and Induction Requirements:

All new workers must complete an orientation and induction that includes:

1. Organisation overview: Mission, values, structure, key contacts
2. NDIS Code of Conduct: All seven principles, with examples relevant to the worker''s role
3. Participant rights: Rights of people with disability, dignity of risk, supported decision-making
4. Incident management: How to identify, report, and respond to incidents
5. Complaints management: How to handle and escalate complaints
6. Work health and safety: Manual handling, infection control, emergency procedures
7. Restrictive practices: What they are, when they may be used, authorisation requirements
8. Privacy and confidentiality: Privacy Act obligations, information handling, consent
9. Abuse prevention: Recognising signs, mandatory reporting, response procedures
10. Documentation: Progress notes, incident reports, communication records
11. Cultural safety: Working with Aboriginal and Torres Strait Islander participants, CALD communities
12. Positive behaviour support: Person-centred approaches, de-escalation techniques

Orientation must be completed before the worker provides unsupervised supports. Ongoing training and professional development must also be provided.',
 '{"section": "Worker Induction", "standard_ref": "Practice Standard 2.3"}');

-- =============================================================
-- 5. NDIS PRACTICE STANDARDS - RESTRICTIVE PRACTICES
-- =============================================================

INSERT INTO policy_documents (title, source, category, chunk_index, content, metadata) VALUES

('Restrictive Practices - Overview and Requirements',
 'NDIS Practice Standards', 'restrictive_practices', 0,
 'Restrictive Practices under the NDIS:

A restrictive practice is any practice or intervention that has the effect of restricting the rights or freedom of movement of a person with disability. The five regulated restrictive practices are:

1. Seclusion: Sole confinement in a room or physical space where voluntary exit is prevented.
2. Chemical restraint: Use of medication for the primary purpose of influencing behaviour, not treating a diagnosed condition.
3. Mechanical restraint: Use of a device to prevent, restrict, or subdue movement, not for therapeutic purposes.
4. Physical restraint: Use of physical force to prevent, restrict, or subdue movement, not as part of standard care.
5. Environmental restraint: Restricting a person''s free access to all parts of their environment, including items or activities.

Key requirements:
- Restrictive practices must only be used as a last resort, when there is an immediate risk of harm.
- They must be authorised under state/territory legislation.
- They must be included in the participant''s Behaviour Support Plan (BSP), which is developed by an NDIS-registered behaviour support practitioner.
- Use must be proportionate to the risk and for the shortest possible duration.
- All use of restrictive practices must be reported to the NDIS Commission.
- Providers must have strategies to reduce and eliminate the use of restrictive practices over time.
- Unauthorised use of a restrictive practice is a reportable incident.',
 '{"section": "Restrictive Practices", "standard_ref": "Practice Standard 4.3", "legislation": "NDIS (Restrictive Practices and Behaviour Support) Rules 2018"}'),

('Behaviour Support Plans and Restrictive Practice Reduction',
 'NDIS Practice Standards', 'restrictive_practices', 1,
 'Behaviour Support Plans (BSP):

A BSP is a document developed by an NDIS-registered behaviour support practitioner that outlines:
- Comprehensive assessment of the person''s behaviour, including functional analysis
- Evidence-based positive behaviour support strategies
- Any authorised restrictive practices (as a last resort only)
- A plan to reduce and eliminate restrictive practices over time
- Environmental modifications and proactive strategies
- Skill-building approaches to replace behaviours of concern
- Crisis management and de-escalation procedures

Provider responsibilities:
- Implement the BSP as written by the behaviour support practitioner
- Train all workers who support the participant on the BSP
- Record every instance of restrictive practice use, including: date, time, duration, type, reason, participant response, and who authorised it
- Report all restrictive practice use to the NDIS Commission via the monthly reportable incidents report
- Participate in regular BSP reviews (at least every 12 months, or after any significant incident)
- Work actively towards reducing and eliminating the use of restrictive practices
- Notify the NDIS Commission of any unauthorised use of a restrictive practice within 24 hours (this is a reportable incident)

Note: "Interim" BSPs must be lodged with the NDIS Commission within 1 month, and a comprehensive BSP within 6 months.',
 '{"section": "Behaviour Support Plans", "standard_ref": "Practice Standard 4.3.1"}');

-- =============================================================
-- 6. NDIS PRICING RULES
-- =============================================================

INSERT INTO policy_documents (title, source, category, chunk_index, content, metadata) VALUES

('NDIS Pricing Arrangements - Key Rules',
 'NDIS Pricing Arrangements and Price Limits', 'pricing', 0,
 'NDIS Pricing Arrangements - Key Rules:

Price limits: The NDIS sets maximum prices for most supports. Registered providers must not charge above these limits. Plan-managed and self-managed participants may negotiate prices with unregistered providers.

Claiming rules:
- Claims must accurately reflect the supports delivered.
- Providers must not claim for supports that were not provided.
- Time-based supports must be claimed in accordance with the actual time spent delivering the support.
- Travel claims: Providers can claim for travel between participants (not from home/office to first participant). Maximum of 30 minutes travel per participant visit for most supports. Travel is claimed at the applicable hourly rate for the support being delivered.

Cancellation policy:
- Short notice cancellation: A participant cancels with less than 2 clear business days'' notice. Providers may charge up to 90% of the agreed price for the scheduled support.
- No show: The participant does not attend or is not available at the scheduled time. Providers may charge up to 90% of the agreed price.
- Providers should have a documented cancellation policy that is communicated to participants at the start of the service agreement.
- Providers cannot charge for both a cancellation and a replacement support delivered in the same time period.

Non-face-to-face supports: Some supports include a component for non-face-to-face activities (e.g., case notes, coordination, preparation). These must be clearly documented and claimed separately where applicable.',
 '{"section": "Pricing Rules", "standard_ref": "NDIS Pricing Arrangements 2024-25"}'),

('NDIS Pricing - Claim Types and Rules',
 'NDIS Pricing Arrangements and Price Limits', 'pricing', 1,
 'NDIS Claim Types:

1. Standard claim: For face-to-face support delivered as per the service agreement. Claimed at the agreed hourly/unit rate, not exceeding the NDIS price limit.

2. Non-face-to-face claim: For activities such as progress note writing, report writing, team meetings, and coordination activities. Must be specified in the service agreement and claimed at the applicable rate.

3. Provider travel claim: For travel between participants. Maximum 30 minutes per participant visit (60 minutes in remote/very remote areas). Cannot be claimed for travel to/from the first or last participant of the day. Must use the MMM (Modified Monash Model) classification for the participant''s location.

4. Cancellation / short notice claim: When a participant cancels with less than 2 clear business days'' notice or does not show. Can claim up to 90% of the agreed price. Must document the cancellation and attempts to contact the participant. Cannot be claimed if a replacement support was delivered.

5. Report writing: For writing reports required as part of the support (e.g., therapy reports, assessment reports). Claimed at the applicable support item rate.

6. Irregular SIL supports: For Supported Independent Living supports delivered outside of regular rostered hours (e.g., emergency supports, unplanned overnight supports).

Important: All claims must be supported by appropriate documentation including service delivery records, progress notes, and timesheets.',
 '{"section": "Claim Types", "standard_ref": "NDIS Pricing Arrangements 2024-25"}');

-- =============================================================
-- 7. PROGRESS NOTES / DOCUMENTATION
-- =============================================================

INSERT INTO policy_documents (title, source, category, chunk_index, content, metadata) VALUES

('Documentation Requirements - Progress Notes',
 'NDIS Practice Standards', 'practice_standards', 0,
 'Progress Note Documentation Requirements:

Progress notes are a critical part of service delivery documentation. They provide evidence of supports delivered, participant outcomes, and compliance with the service agreement.

Each progress note should include:
1. Date and time of support
2. Participant name and NDIS number
3. Worker name and role
4. Type of support delivered (linked to the service agreement and support item)
5. Goals addressed during the session (linked to the participant''s NDIS plan goals)
6. Description of what was done during the session
7. Participant''s presentation and response to supports
8. Any concerns or changes in the participant''s condition or circumstances
9. Actions taken or follow-up required
10. Duration of the support (actual start and end times)

Best practices:
- Write notes as soon as possible after the support is delivered (ideally within 24 hours).
- Use objective, factual language. Avoid subjective opinions or judgements.
- Focus on the participant''s strengths and progress, not just deficits.
- Document any incidents, concerns, or changes in condition.
- Ensure notes are legible, signed (or electronically authenticated), and stored securely.
- Progress notes may be requested during NDIS audits, by the participant, or by the NDIS Commission.',
 '{"section": "Documentation", "standard_ref": "Practice Standard 1.3"}'),

('Record Keeping and Information Management',
 'NDIS Practice Standards', 'practice_standards', 1,
 'Record Keeping Requirements:

Providers must maintain accurate, up-to-date records that:
- Document all supports and services delivered to each participant
- Are stored securely and in accordance with the Privacy Act 1988
- Are retained for a minimum of 7 years (or 7 years after a child turns 18)
- Are accessible to participants upon request
- Support continuity of care when workers change or participants transition between services

Required records include:
- Participant intake and assessment records
- Service agreements (signed copies)
- Individual support plans
- Progress notes for each support session
- Incident and complaint records
- Worker screening and qualification records
- Financial records (invoices, claims, receipts)
- Communication records (calls, emails, meetings with stakeholders)
- Risk assessments and management plans
- Behaviour support plans (where applicable)
- Consent forms (for sharing information, taking photos, etc.)

Electronic record systems must:
- Have appropriate access controls (role-based permissions)
- Include audit trails for record modifications
- Have regular backup procedures
- Comply with relevant data protection laws',
 '{"section": "Record Keeping", "standard_ref": "Practice Standard 1.3.1"}');

-- =============================================================
-- 8. NDIS PRACTICE STANDARDS - GOVERNANCE & OPERATIONAL MANAGEMENT
-- =============================================================

INSERT INTO policy_documents (title, source, category, chunk_index, content, metadata) VALUES

('Governance and Operational Management',
 'NDIS Practice Standards', 'practice_standards', 2,
 'NDIS Practice Standard: Governance and Operational Management

Providers must demonstrate sound governance and operational management, including:

Governance:
- Clear organisational structure with defined roles and responsibilities
- A governing body (board, directors) that provides strategic oversight
- Policies and procedures that are regularly reviewed and updated
- A risk management framework
- Financial management systems that ensure viability and accountability
- Quality management systems, including internal audits and continuous improvement

Operational Management:
- Adequate staffing levels to meet participant needs safely
- Supervision and support for all workers
- Business continuity planning (e.g., pandemic response, natural disasters)
- Insurance coverage (public liability, professional indemnity, workers compensation)
- Regular review of service delivery against participant outcomes and satisfaction

Key Personnel:
- Must be fit and proper persons (assessed by the NDIS Commission)
- Must disclose any relevant criminal history, insolvency, or regulatory action
- Must understand and comply with NDIS legislation and the Code of Conduct
- Must ensure the organisation meets its obligations under the NDIS Act and Rules',
 '{"section": "Governance", "standard_ref": "Practice Standard 1.1"}');

-- =============================================================
-- 9. INTERNAL POLICIES (Hope Disability Support specific)
-- =============================================================

INSERT INTO policy_documents (title, source, category, chunk_index, content, metadata) VALUES

('Hope Disability Support - Incident Reporting Procedure',
 'Hope Disability Support Internal Policies', 'internal_policy', 0,
 'Hope Disability Support - Incident Reporting Procedure:

All workers must report incidents immediately to their supervisor and log them in Hope OS.

Step 1: Ensure Safety
- Ensure the immediate safety and wellbeing of the participant and any other persons involved.
- Administer first aid if required and call emergency services (000) if needed.

Step 2: Report to Supervisor
- Contact your supervisor or the on-call manager immediately by phone.
- If the incident involves a critical injury, death, abuse, or sexual misconduct, also notify the Director (Erfan) directly.

Step 3: Log in Hope OS
- Navigate to Incidents > Log an Incident in Hope OS.
- Complete all required fields including date, time, location, participant, description, severity, and incident type.
- Mark as "reportable" if it falls under the NDIS reportable incident categories.

Step 4: Investigation
- The supervisor or Director will assign an investigator.
- Cooperate fully with any investigation and provide any requested documentation.

Step 5: Follow Up
- Complete any corrective actions assigned to you.
- Attend any debrief sessions offered.

Remember: There is no penalty for reporting an incident. Under-reporting is a serious compliance risk.',
 '{"section": "Incident Reporting", "policy_ref": "HDS-POL-INC-001"}'),

('Hope Disability Support - Complaints Handling',
 'Hope Disability Support Internal Policies', 'internal_policy', 1,
 'Hope Disability Support - Complaints Handling Procedure:

Our commitment: Every complaint is an opportunity to improve. We treat all complaints seriously, fairly, and without retribution.

Receiving a Complaint:
- Complaints can be received verbally, in writing, via email, or through Hope OS.
- Any worker can receive a complaint. You do not need to resolve it yourself.
- Listen respectfully, thank the person for raising the issue, and assure them it will be addressed.

Logging:
- Log the complaint in Hope OS (Complaints > Log a Complaint) within 1 business day of receiving it.
- Include: date, complainant name, participant (if applicable), description, and category.
- Hope OS will automatically set deadlines: 2-day acknowledgment, 21-day resolution.

Acknowledgment:
- The Director or delegated manager will acknowledge the complaint in writing within 2 business days.
- The acknowledgment must include: confirmation of receipt, reference number, expected timeframe, and the name of the person managing the complaint.

Resolution:
- Investigate the complaint fairly, involving relevant workers and the complainant.
- Aim to resolve within 21 days.
- If resolution will take longer, communicate the extension and reasons to the complainant.
- Record the outcome in Hope OS.

Escalation:
- If the complainant is not satisfied, they can request a review by the Director.
- They can also contact the NDIS Commission on 1800 035 544.',
 '{"section": "Complaints Handling", "policy_ref": "HDS-POL-CMP-001"}'),

('Hope Disability Support - Progress Note Standards',
 'Hope Disability Support Internal Policies', 'internal_policy', 2,
 'Hope Disability Support - Progress Note Standards:

All workers must complete a progress note for every support session delivered. Notes must be completed within 24 hours.

What to include:
- Session date, start time, and end time
- Participant name (selected from Hope OS)
- Goals addressed (linked to the participant''s NDIS plan goals)
- A summary of what you did during the session
- The participant''s presentation (mood, engagement, health observations)
- Any concerns flagged (use the concern flagging feature if severity is medium or above)
- Actions for follow-up or next session

Writing tips:
- Be objective and factual. Write "John appeared agitated and declined to participate in the activity" rather than "John was in a bad mood."
- Use person-first language. Write "participant" or the person''s name, not "client" or "consumer."
- Be specific about time spent. Don''t round up excessively.
- If using voice-to-text, review the transcription for accuracy before submitting.
- Do NOT include personal opinions, judgements about family members, or information unrelated to the support session.

Why it matters:
- Progress notes are evidence of service delivery for NDIS claiming.
- They support continuity of care when another worker fills in.
- They may be reviewed during audits or requested by the participant or NDIS Commission.
- Inadequate documentation is a common audit finding and compliance risk.',
 '{"section": "Progress Notes", "policy_ref": "HDS-POL-DOC-001"}');
