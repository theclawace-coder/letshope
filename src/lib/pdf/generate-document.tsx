import { pdf } from '@react-pdf/renderer'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import type { OrgInfo } from './components'
import type { Tables } from '@/lib/types/database'
import {
  ServiceAgreementPdf,
  ConsentFormPdf,
  ComplaintFormPdf,
  IncidentReportPdf,
  ProgressNotePdf,
  RiskAssessmentPdf,
  IntakeFormPdf,
  ReferralFormPdf,
  ParticipantHandbookPdf,
  SupportPlanPdf,
  ExitTransitionPlanPdf,
} from './templates'

// ─── Helpers ─────────────────────────────────────────────────────────────

function today() {
  return format(new Date(), 'dd MMMM yyyy')
}

/** Fetch organisation info for PDF headers */
export async function getOrgInfo(): Promise<OrgInfo> {
  const { data } = await supabase.from('organisation').select('*').limit(1).single()
  if (!data) {
    return { name: 'Hope Disability Support' }
  }
  const org = data as Tables<'organisation'>
  const addr = org.address as { street?: string; suburb?: string; state?: string; postcode?: string } | null
  return {
    name: org.name,
    abn: org.abn,
    ndis_registration_number: org.ndis_registration_number,
    phone: org.phone,
    email: org.email,
    address: addr ? `${addr.street || ''}, ${addr.suburb || ''} ${addr.state || ''} ${addr.postcode || ''}` : null,
    logo_url: org.logo_url,
  }
}

// ─── Generate a PDF blob from a React element ───────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function renderToBlob(element: React.ReactElement<any>): Promise<Blob> {
  return await pdf(element).toBlob()
}

// ─── Download a blob as a file ──────────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Open a blob in a new browser tab for preview ───────────────────────

export function previewBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

// ─── Store a generated PDF to Supabase Storage + documents table ────────

interface StoreDocumentOptions {
  blob: Blob
  filename: string
  category: string
  participantId?: string
  workerId?: string
  metadata?: Record<string, string>
}

export async function storeDocument({ blob, filename, category, participantId, workerId, metadata }: StoreDocumentOptions) {
  const entityType = participantId ? 'participants' : workerId ? 'workers' : 'organisation'
  const entityId = participantId || workerId || 'org'
  const storagePath = `${entityType}/${entityId}/${category}/${filename}`

  // Upload to Supabase storage
  const file = new File([blob], filename, { type: 'application/pdf' })
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { upsert: true })

  if (uploadError) {
    // If the bucket doesn't exist yet, log a warning but don't block document generation
    if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
      console.warn('Documents storage bucket not found — skipping upload. Run migration 00022 to create it.', uploadError)
      return null
    }
    console.error('Upload error:', uploadError)
    throw uploadError
  }

  // Get user
  const { data: { user } } = await supabase.auth.getUser()

  // Insert record into documents table
  const insertData = {
    name: filename,
    category,
    participant_id: participantId || null,
    worker_id: workerId || null,
    file_path: storagePath,
    file_size: blob.size,
    mime_type: 'application/pdf',
    uploaded_by: user?.id || null,
    metadata: (metadata || {}) as Record<string, string>,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from('documents').insert(insertData as any).select().single()

  if (error) {
    console.error('Document record error:', error)
    throw error
  }

  return data
}

// ─── High-level: generate + download + optionally store ─────────────────

interface GenerateAndSaveOptions {
  download?: boolean
  preview?: boolean
  store?: boolean
  participantId?: string
  workerId?: string
}

// ─── Service Agreement ──────────────────────────────────────────────────

export async function generateServiceAgreement(
  participant: Tables<'participants'>,
  agreement: Tables<'service_agreements'>,
  options: GenerateAndSaveOptions = {}
) {
  const org = await getOrgInfo()
  const blob = await renderToBlob(
    <ServiceAgreementPdf org={org} participant={participant} agreement={agreement} generatedDate={today()} />
  )
  const filename = `Service_Agreement_${participant.last_name}_${participant.first_name}_v${agreement.version}.pdf`

  if (options.store !== false) {
    await storeDocument({ blob, filename, category: 'service_agreement', participantId: participant.id })
  }
  if (options.download) downloadBlob(blob, filename)
  if (options.preview) previewBlob(blob)
  return blob
}

// ─── Consent Form ───────────────────────────────────────────────────────

export async function generateConsentForm(
  participant: Tables<'participants'>,
  signatures?: { participant?: string | null; provider?: string | null },
  options: GenerateAndSaveOptions = {}
) {
  const org = await getOrgInfo()
  const blob = await renderToBlob(
    <ConsentFormPdf
      org={org}
      participant={participant}
      generatedDate={today()}
      participantSignature={signatures?.participant}
      providerSignature={signatures?.provider}
    />
  )
  const filename = `Consent_Form_${participant.last_name}_${participant.first_name}.pdf`

  if (options.store !== false) {
    await storeDocument({ blob, filename, category: 'consent_form', participantId: participant.id })
  }
  if (options.download) downloadBlob(blob, filename)
  if (options.preview) previewBlob(blob)
  return blob
}

// ─── Participant Handbook ───────────────────────────────────────────────

export async function generateParticipantHandbook(
  participant: Tables<'participants'>,
  options: GenerateAndSaveOptions = {}
) {
  const org = await getOrgInfo()
  const blob = await renderToBlob(
    <ParticipantHandbookPdf org={org} participant={participant} generatedDate={today()} />
  )
  const filename = `Participant_Handbook_${participant.last_name}_${participant.first_name}.pdf`

  if (options.store !== false) {
    await storeDocument({ blob, filename, category: 'welcome_pack', participantId: participant.id })
  }
  if (options.download) downloadBlob(blob, filename)
  if (options.preview) previewBlob(blob)
  return blob
}

// ─── Complaint Form ─────────────────────────────────────────────────────

export async function generateComplaintForm(
  complaint: Tables<'complaints'>,
  participantName?: string,
  options: GenerateAndSaveOptions = {}
) {
  const org = await getOrgInfo()
  const blob = await renderToBlob(
    <ComplaintFormPdf org={org} complaint={complaint} participantName={participantName} generatedDate={today()} />
  )
  const filename = `Complaint_${complaint.id.slice(0, 8).toUpperCase()}_${complaint.complaint_date}.pdf`

  if (options.store !== false) {
    await storeDocument({
      blob, filename, category: 'complaint',
      participantId: complaint.participant_id || undefined,
      metadata: { complaint_id: complaint.id },
    })
  }
  if (options.download) downloadBlob(blob, filename)
  if (options.preview) previewBlob(blob)
  return blob
}

// ─── Incident Report ────────────────────────────────────────────────────

export async function generateIncidentReport(
  incident: Tables<'incidents'>,
  participantName?: string,
  workerName?: string,
  options: GenerateAndSaveOptions = {}
) {
  const org = await getOrgInfo()
  const blob = await renderToBlob(
    <IncidentReportPdf
      org={org} incident={incident}
      participantName={participantName} workerName={workerName}
      generatedDate={today()}
    />
  )
  const filename = `Incident_Report_${incident.id.slice(0, 8).toUpperCase()}_${incident.incident_date}.pdf`

  if (options.store !== false) {
    await storeDocument({
      blob, filename, category: 'incident_report',
      participantId: incident.participant_id || undefined,
      metadata: { incident_id: incident.id },
    })
  }
  if (options.download) downloadBlob(blob, filename)
  if (options.preview) previewBlob(blob)
  return blob
}

// ─── Progress Note ──────────────────────────────────────────────────────

export async function generateProgressNote(
  note: Tables<'progress_notes'>,
  participantName: string,
  workerName: string,
  options: GenerateAndSaveOptions = {}
) {
  const org = await getOrgInfo()
  const blob = await renderToBlob(
    <ProgressNotePdf org={org} note={note} participantName={participantName} workerName={workerName} generatedDate={today()} />
  )
  const filename = `Progress_Note_${note.id.slice(0, 8).toUpperCase()}_${note.note_date}.pdf`

  if (options.store !== false) {
    await storeDocument({
      blob, filename, category: 'progress_note',
      participantId: note.participant_id,
      metadata: { progress_note_id: note.id },
    })
  }
  if (options.download) downloadBlob(blob, filename)
  if (options.preview) previewBlob(blob)
  return blob
}

// ─── Risk Assessment ────────────────────────────────────────────────────

export async function generateRiskAssessment(
  participant: Tables<'participants'>,
  riskAnswers: Record<string, string>,
  options: GenerateAndSaveOptions = {}
) {
  const org = await getOrgInfo()
  const blob = await renderToBlob(
    <RiskAssessmentPdf org={org} participant={participant} riskAnswers={riskAnswers} generatedDate={today()} />
  )
  const filename = `Risk_Assessment_${participant.last_name}_${participant.first_name}.pdf`

  if (options.store !== false) {
    await storeDocument({ blob, filename, category: 'risk_assessment', participantId: participant.id })
  }
  if (options.download) downloadBlob(blob, filename)
  if (options.preview) previewBlob(blob)
  return blob
}

// ─── Intake Form ────────────────────────────────────────────────────────

export async function generateIntakeForm(
  participant: Tables<'participants'>,
  options: GenerateAndSaveOptions = {}
) {
  const org = await getOrgInfo()
  const blob = await renderToBlob(
    <IntakeFormPdf org={org} participant={participant} generatedDate={today()} />
  )
  const filename = `Intake_Form_${participant.last_name}_${participant.first_name}.pdf`

  if (options.store !== false) {
    await storeDocument({ blob, filename, category: 'intake_form', participantId: participant.id })
  }
  if (options.download) downloadBlob(blob, filename)
  if (options.preview) previewBlob(blob)
  return blob
}

// ─── Referral Form ──────────────────────────────────────────────────────

export async function generateReferralForm(
  participant: Tables<'participants'>,
  options: GenerateAndSaveOptions = {}
) {
  const org = await getOrgInfo()
  const blob = await renderToBlob(
    <ReferralFormPdf org={org} participant={participant} generatedDate={today()} />
  )
  const filename = `Referral_Form_${participant.last_name}_${participant.first_name}.pdf`

  if (options.store !== false) {
    await storeDocument({ blob, filename, category: 'referral_form', participantId: participant.id })
  }
  if (options.download) downloadBlob(blob, filename)
  if (options.preview) previewBlob(blob)
  return blob
}

// ─── Support Plan ───────────────────────────────────────────────────────

export async function generateSupportPlan(
  participant: Tables<'participants'>,
  signatures?: { participant?: string | null; provider?: string | null },
  options: GenerateAndSaveOptions = {}
) {
  const org = await getOrgInfo()
  const blob = await renderToBlob(
    <SupportPlanPdf
      org={org} participant={participant} generatedDate={today()}
      participantSignature={signatures?.participant}
      providerSignature={signatures?.provider}
    />
  )
  const filename = `Support_Plan_${participant.last_name}_${participant.first_name}.pdf`

  if (options.store !== false) {
    await storeDocument({ blob, filename, category: 'support_plan', participantId: participant.id })
  }
  if (options.download) downloadBlob(blob, filename)
  if (options.preview) previewBlob(blob)
  return blob
}

// ─── Exit & Transition Plan ─────────────────────────────────────────────

export async function generateExitTransitionPlan(
  participant: Tables<'participants'>,
  details?: { reason?: string; newProvider?: string; transitionDate?: string; notes?: string },
  options: GenerateAndSaveOptions = {}
) {
  const org = await getOrgInfo()
  const blob = await renderToBlob(
    <ExitTransitionPlanPdf
      org={org} participant={participant} generatedDate={today()}
      reason={details?.reason} newProvider={details?.newProvider}
      transitionDate={details?.transitionDate} notes={details?.notes}
    />
  )
  const filename = `Exit_Transition_Plan_${participant.last_name}_${participant.first_name}.pdf`

  if (options.store !== false) {
    await storeDocument({ blob, filename, category: 'exit_transition_plan', participantId: participant.id })
  }
  if (options.download) downloadBlob(blob, filename)
  if (options.preview) previewBlob(blob)
  return blob
}
