import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { SignaturePad } from '@/components/shared/SignaturePad'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FileText, CheckCircle, Circle, Download, Loader2, Shield, FileCheck, BookOpen } from 'lucide-react'
import {
  generateParticipantHandbook,
  previewBlob,
  downloadBlob,
} from '@/lib/pdf/generate-document'
import type { Stage3Data } from '../../schemas'
import type { Tables } from '@/lib/types/database'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'
import { toast } from 'sonner'

interface Stage3Props {
  defaultValues?: Partial<Stage3Data>
  onSubmit: (data: Stage3Data) => void
  onBack: () => void
  isLoading: boolean
  participant?: Tables<'participants'> | null
}

const CONSENT_ITEMS = [
  {
    key: 'consent_service_delivery' as const,
    label: 'Service Delivery',
    description: 'I consent to receiving disability support services as outlined in this agreement.',
  },
  {
    key: 'consent_data_collection' as const,
    label: 'Data Collection',
    description: 'I consent to the collection of my personal information for the purpose of providing support services.',
  },
  {
    key: 'consent_information_sharing' as const,
    label: 'Information Sharing',
    description: 'I consent to my information being shared with relevant parties (NDIA, Support Coordinator, GP) as required for service delivery.',
  },
  {
    key: 'consent_photo_media' as const,
    label: 'Photo / Media',
    description: 'I consent to photographs being taken during service delivery for progress notes and record keeping.',
  },
  {
    key: 'consent_emergency_contact' as const,
    label: 'Emergency Contact',
    description: 'I consent to my emergency contacts being notified in the event of an incident or emergency.',
  },
  {
    key: 'consent_gp_communication' as const,
    label: 'GP Communication',
    description: 'I consent to the provider communicating with my GP or medical specialists regarding my care needs.',
  },
] as const

type ConsentKey = typeof CONSENT_ITEMS[number]['key']

// ── Inline handbook sections for scrollable reading ──
const HANDBOOK_SECTIONS = [
  {
    title: 'Welcome',
    content: `Welcome to Hope Disability Support! We are thrilled to have you as part of our community. This handbook contains important information about our services, your rights, and how we work together to achieve your goals.

We are committed to providing you with high-quality, person-centred disability supports. Our team is here to help you live the life you choose, and we encourage you to share your feedback, ask questions, and be actively involved in all decisions about your supports.`,
  },
  {
    title: 'About Us',
    content: `Hope Disability Support is a registered NDIS provider delivering disability support services across the community.

We provide services including Daily Personal Activities, Community Nursing, Community Participation, Transport, Plan Management, and more — depending on your NDIS plan.`,
  },
  {
    title: 'Our Values',
    content: `• **Respect** — We treat every person with dignity and respect
• **Choice** — You decide how you want to live your life
• **Inclusion** — Everyone deserves to be part of the community
• **Safety** — Your wellbeing is our top priority
• **Quality** — We continuously improve our services
• **Accountability** — We are transparent in everything we do`,
  },
  {
    title: 'Your Rights',
    content: `As an NDIS participant, you have important rights protected by law. You have the right to:

• Be treated with dignity and respect at all times
• Be free from abuse, neglect, exploitation, and violence
• Choose who provides your supports
• Be involved in decisions about your supports and services
• Have your cultural and linguistic needs respected
• Access your personal information we hold about you
• Privacy and confidentiality of your information
• Provide feedback, raise concerns, or make a complaint
• Have your complaints heard and resolved fairly
• Change or leave your service provider at any time

NDIS Code of Conduct — All our staff must:
• Act with respect for individual rights to self-determination
• Respect the privacy of people with disability
• Provide supports in a safe and competent manner
• Act with integrity, honesty and transparency
• Take steps to prevent and respond to violence, exploitation, neglect and abuse

Advocacy: You can use an advocate — someone who speaks on your behalf.
National Disability Advocacy Program: 1800 880 052 (free and independent)`,
  },
  {
    title: 'Complaints & Feedback',
    content: `We welcome your feedback — both positive and negative. You will never be treated differently for making a complaint.

Step 1: Talk to your support worker or call our office
Step 2: If not resolved, lodge a formal complaint. We will acknowledge within 2 business days and aim to resolve within 21 business days.
Step 3: Contact the NDIS Quality and Safeguards Commission:
• Phone: 1800 035 544 (free call)
• TTY: 133 677
• Interpreters: 131 450
• National Relay: 1300 555 727`,
  },
  {
    title: 'Cancellation Policy',
    content: `Please let us know as early as possible if you need to cancel:

• 2+ business days notice — no charge
• Less than 2 business days — up to 90% may be charged
• No notice (no show) — up to 100% may be charged`,
  },
  {
    title: 'Emergency Contacts',
    content: `In an emergency, always call 000 first.

• Emergency Services: 000
• Lifeline 24/7: 13 11 14
• Beyond Blue: 1300 22 4636
• NDIS Quality and Safeguards Commission: 1800 035 544`,
  },
  {
    title: 'Privacy',
    content: `We collect personal information to provide your NDIS supports, in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles.

Your information is stored securely and only shared with your consent (e.g. NDIA, Support Coordinator, GP, emergency services).

You can access your records at any time, request corrections, or withdraw consent in writing. Withdrawing consent may affect our ability to provide certain services — we will discuss implications with you first.`,
  },
]

export function Stage3ReviewAndSign({ defaultValues, onSubmit, onBack, isLoading, participant }: Stage3Props) {
  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>({
    consent_service_delivery: defaultValues?.consent_service_delivery ?? false,
    consent_data_collection: defaultValues?.consent_data_collection ?? false,
    consent_information_sharing: defaultValues?.consent_information_sharing ?? false,
    consent_photo_media: defaultValues?.consent_photo_media ?? false,
    consent_emergency_contact: defaultValues?.consent_emergency_contact ?? false,
    consent_gp_communication: defaultValues?.consent_gp_communication ?? false,
  })

  const [agreementReviewed, setAgreementReviewed] = useState(defaultValues?.service_agreement_reviewed ?? false)
  const [termsAccepted, setTermsAccepted] = useState(defaultValues?.service_agreement_terms_accepted ?? false)
  const [participantSignature, setParticipantSignature] = useState(defaultValues?.participant_signature || '')
  const [providerSignature, setProviderSignature] = useState(defaultValues?.provider_signature || '')
  const [welcomePackGenerated, setWelcomePackGenerated] = useState(defaultValues?.documents_generated?.includes('welcome_pack') ?? false)
  const [generatingWelcomePack, setGeneratingWelcomePack] = useState(false)
  const [welcomePackBlob, setWelcomePackBlob] = useState<Blob | null>(null)

  const allConsentsGiven = CONSENT_ITEMS.every((item) => consents[item.key])
  const serviceAgreementComplete = agreementReviewed && termsAccepted && !!participantSignature && !!providerSignature
  const consentFormComplete = allConsentsGiven && !!participantSignature && !!providerSignature

  const completedDocs = useMemo(() => {
    const docs: string[] = []
    if (serviceAgreementComplete) docs.push('service_agreement')
    if (consentFormComplete) docs.push('consent_form')
    if (welcomePackGenerated) docs.push('welcome_pack')
    return docs
  }, [serviceAgreementComplete, consentFormComplete, welcomePackGenerated])

  const allComplete = serviceAgreementComplete && consentFormComplete && welcomePackGenerated

  function toggleConsent(key: ConsentKey) {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleGenerateWelcomePack() {
    if (!participant) {
      toast.error('Participant data not available yet')
      return
    }
    setGeneratingWelcomePack(true)
    try {
      const blob = await generateParticipantHandbook(participant, { store: false })
      setWelcomePackBlob(blob)
      setWelcomePackGenerated(true)
      previewBlob(blob)
      toast.success('Welcome Pack generated')
    } catch (err) {
      console.error('Generation error:', err)
      toast.error('Failed to generate Welcome Pack')
    } finally {
      setGeneratingWelcomePack(false)
    }
  }

  function handleDownloadWelcomePack() {
    if (welcomePackBlob && participant) {
      downloadBlob(welcomePackBlob, `Welcome_Pack_${participant.last_name}_${participant.first_name}.pdf`)
    }
  }

  function handleSubmit() {
    const data: Stage3Data = {
      documents_generated: completedDocs,
      service_agreement_signed: serviceAgreementComplete,
      consent_form_signed: consentFormComplete,
      participant_signature: participantSignature || undefined,
      provider_signature: providerSignature || undefined,
      consent_service_delivery: consents.consent_service_delivery,
      consent_data_collection: consents.consent_data_collection,
      consent_information_sharing: consents.consent_information_sharing,
      consent_photo_media: consents.consent_photo_media,
      consent_emergency_contact: consents.consent_emergency_contact,
      consent_gp_communication: consents.consent_gp_communication,
      service_agreement_reviewed: agreementReviewed,
      service_agreement_terms_accepted: termsAccepted,
    }
    onSubmit(data)
  }

  const services = participant?.services_requested || []
  const fundingLabel = participant?.funding_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '-'

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Review, Sign & Agree</CardTitle>
            <Badge variant={allComplete ? 'default' : 'secondary'} className={allComplete ? 'bg-green-600' : ''}>
              {completedDocs.length}/3 Complete
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Go through the handbook, service agreement, and consent form with the participant, then capture signatures.
          </p>
        </CardHeader>
      </Card>

      {/* ── 1. Inline Participant Handbook ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="flex-1">
              <CardTitle className="text-base">Participant Handbook</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Scroll through with the participant. This covers rights, values, complaints, and privacy.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 max-h-80 overflow-y-auto">
            {HANDBOOK_SECTIONS.map((section, i) => (
              <div key={section.title} className={`p-4 ${i > 0 ? 'border-t border-blue-200' : ''}`}>
                <h4 className="font-semibold text-blue-900 text-sm mb-2">{section.title}</h4>
                <div className="text-sm text-blue-800 whitespace-pre-line">{section.content}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Service Agreement ── */}
      <Card className={serviceAgreementComplete ? 'border-green-200' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {serviceAgreementComplete ? (
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <CardTitle className="text-base">Service Agreement</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Review the agreement details and confirm acceptance.</p>
            </div>
            {serviceAgreementComplete && <Badge variant="default" className="bg-green-600">Complete</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion className="w-full" multiple>
            <AccordionItem value="parties">
              <AccordionTrigger className="text-sm font-semibold">Parties to this Agreement</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p className="text-sm font-medium">Provider</p>
                  <p className="text-sm text-muted-foreground">Hope Disability Support</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p className="text-sm font-medium">Participant</p>
                  <p className="text-sm">{participant?.first_name} {participant?.last_name}</p>
                  <p className="text-xs text-muted-foreground">NDIS: {participant?.ndis_number || '-'}</p>
                  <p className="text-xs text-muted-foreground">Phone: {participant?.phone || '-'}</p>
                  <p className="text-xs text-muted-foreground">Email: {participant?.email || '-'}</p>
                </div>
                {participant?.has_guardian && (
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                    <p className="text-sm font-medium">Guardian / Nominee</p>
                    <p className="text-sm">{participant.guardian_name || '-'}</p>
                    <p className="text-xs text-muted-foreground">Relationship: {participant.guardian_relationship || '-'}</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="services">
              <AccordionTrigger className="text-sm font-semibold">Services & Supports</AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground mb-2">Funding: {fundingLabel}</p>
                {services.length > 0 ? (
                  <div className="space-y-2">
                    {services.map((code) => {
                      const groupName = ALL_REGISTRATION_GROUPS[code as keyof typeof ALL_REGISTRATION_GROUPS] || code
                      return (
                        <div key={code} className="flex items-center gap-2 rounded bg-muted/50 px-3 py-2">
                          <span className="font-mono text-xs text-muted-foreground">{code}</span>
                          <span className="text-sm">{groupName}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No services selected yet.</p>
                )}
                {(participant?.plan_start_date || participant?.plan_end_date) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Agreement period: {participant?.plan_start_date || '-'} to {participant?.plan_end_date || '-'}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="terms">
              <AccordionTrigger className="text-sm font-semibold">Terms & Conditions</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p><strong>Cancellations:</strong> If you need to cancel a scheduled support, please provide at least 2 business days notice. Short notice cancellations (less than 2 business days) may be charged at 90% of the agreed rate in accordance with NDIS Pricing Arrangements and Price Limits. No show cancellations (where no notice is given) may be charged at 100% of the agreed rate.</p>
                <p><strong>Changes to services:</strong> Either party may request changes to services by providing reasonable notice. We will provide 14 days written notice of any changes. Changes will be documented as an addendum to this agreement.</p>
                <p><strong>Ending this agreement:</strong> Either party may end this agreement by providing 14 days written notice. Hope Disability Support will assist with transitioning to another provider if requested. In cases of immediate risk to safety, this agreement may be ended without notice.</p>
                <p><strong>Complaints:</strong> If you are unhappy with our services, you can: (1) talk to your support worker or contact us directly, (2) lodge a formal complaint — we will acknowledge within 2 business days and aim to resolve within 21 business days, or (3) contact the NDIS Quality and Safeguards Commission on 1800 035 544.</p>
                <p><strong>Privacy:</strong> We handle your personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles. You can access your records, request corrections, or withdraw consent at any time in writing.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="space-y-3 pt-2 border-t">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={agreementReviewed} onCheckedChange={(checked) => setAgreementReviewed(!!checked)} className="mt-0.5" />
              <div>
                <span className="text-sm font-medium">I have reviewed the agreement details above</span>
                <p className="text-xs text-muted-foreground">Confirm you have gone through all sections with the participant.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(!!checked)} disabled={!agreementReviewed} className="mt-0.5" />
              <div>
                <span className="text-sm font-medium">Participant accepts the terms and conditions</span>
                <p className="text-xs text-muted-foreground">The participant (or their guardian) agrees to the terms above.</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Consent Form ── */}
      <Card className={consentFormComplete ? 'border-green-200' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {consentFormComplete ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" /> : <Shield className="h-5 w-5 text-muted-foreground shrink-0" />}
            <div className="flex-1">
              <CardTitle className="text-base">Consent Form</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Go through each consent item with the participant.</p>
            </div>
            {consentFormComplete ? (
              <Badge variant="default" className="bg-green-600">Complete</Badge>
            ) : (
              <Badge variant="secondary">{CONSENT_ITEMS.filter((i) => consents[i.key]).length}/{CONSENT_ITEMS.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {CONSENT_ITEMS.map((item) => (
            <div
              key={item.key}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                consents[item.key] ? 'border-green-200 bg-green-50/50' : 'border-border'
              }`}
            >
              <Switch checked={consents[item.key]} onCheckedChange={() => toggleConsent(item.key)} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              {consents[item.key] && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── 4. Signatures ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signatures</CardTitle>
          <p className="text-xs text-muted-foreground">Capture signatures for both the Service Agreement and Consent Form.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Participant Signature</Label>
            {participantSignature ? (
              <div className="space-y-2">
                <div className="border rounded-lg p-2 bg-white">
                  <img src={participantSignature} alt="Participant signature" className="h-20 mx-auto" />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setParticipantSignature('')}>Clear & Re-sign</Button>
              </div>
            ) : (
              <SignaturePad onSave={setParticipantSignature} label="Participant Signature" />
            )}
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Provider Signature</Label>
            {providerSignature ? (
              <div className="space-y-2">
                <div className="border rounded-lg p-2 bg-white">
                  <img src={providerSignature} alt="Provider signature" className="h-20 mx-auto" />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setProviderSignature('')}>Clear & Re-sign</Button>
              </div>
            ) : (
              <SignaturePad onSave={setProviderSignature} label="Provider Signature" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 5. Welcome Pack PDF ── */}
      <Card className={welcomePackGenerated ? 'border-green-200' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {welcomePackGenerated ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" /> : <FileCheck className="h-5 w-5 text-muted-foreground shrink-0" />}
            <div className="flex-1">
              <CardTitle className="text-base">Welcome Pack PDF</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Generate the PDF for the participant to take home.</p>
            </div>
            {welcomePackGenerated && <Badge variant="default" className="bg-green-600">Provided</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button type="button" variant={welcomePackGenerated ? 'outline' : 'default'} size="sm" disabled={generatingWelcomePack || !participant} onClick={handleGenerateWelcomePack}>
              {generatingWelcomePack ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
              {welcomePackGenerated ? 'Regenerate' : 'Generate & Preview'}
            </Button>
            {welcomePackBlob && (
              <Button type="button" variant="ghost" size="sm" onClick={handleDownloadWelcomePack}>
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {[
              { label: 'Service Agreement', done: serviceAgreementComplete },
              { label: 'Consent Form', done: consentFormComplete },
              { label: 'Welcome Pack', done: welcomePackGenerated },
            ].map((doc) => (
              <div key={doc.label} className="flex items-center gap-2">
                {doc.done ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={`text-sm ${doc.done ? 'text-green-800' : 'text-muted-foreground'}`}>{doc.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!allComplete && (
        <Alert>
          <AlertDescription>Complete all documents before proceeding. You can still save and come back later.</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleSubmit} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save & Continue'}</Button>
      </div>
    </div>
  )
}
