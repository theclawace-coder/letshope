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
import { FileText, CheckCircle, Circle, Download, Loader2, Shield, FileCheck } from 'lucide-react'
import {
  generateServiceAgreement,
  generateConsentForm,
  generateParticipantHandbook,
  previewBlob,
  downloadBlob,
} from '@/lib/pdf/generate-document'
import type { Stage3Data as Stage4Data } from '../../schemas'
import type { Tables } from '@/lib/types/database'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'
import { toast } from 'sonner'

interface Stage4Props {
  defaultValues?: Partial<Stage4Data>
  onSubmit: (data: Stage4Data) => void
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

export function Stage4Documents({ defaultValues, onSubmit, onBack, isLoading, participant }: Stage4Props) {
  // Consent toggles
  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>({
    consent_service_delivery: defaultValues?.consent_service_delivery ?? false,
    consent_data_collection: defaultValues?.consent_data_collection ?? false,
    consent_information_sharing: defaultValues?.consent_information_sharing ?? false,
    consent_photo_media: defaultValues?.consent_photo_media ?? false,
    consent_emergency_contact: defaultValues?.consent_emergency_contact ?? false,
    consent_gp_communication: defaultValues?.consent_gp_communication ?? false,
  })

  // Service agreement review
  const [agreementReviewed, setAgreementReviewed] = useState(defaultValues?.service_agreement_reviewed ?? false)
  const [termsAccepted, setTermsAccepted] = useState(defaultValues?.service_agreement_terms_accepted ?? false)

  // Signatures
  const [participantSignature, setParticipantSignature] = useState(defaultValues?.participant_signature || '')
  const [providerSignature, setProviderSignature] = useState(defaultValues?.provider_signature || '')

  // Welcome pack
  const [welcomePackGenerated, setWelcomePackGenerated] = useState(
    defaultValues?.documents_generated?.includes('welcome_pack') ?? false
  )
  const [generatingWelcomePack, setGeneratingWelcomePack] = useState(false)
  const [welcomePackBlob, setWelcomePackBlob] = useState<Blob | null>(null)

  // Computed statuses
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
    const data: Stage4Data = {
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
            <CardTitle className="text-base">Documents & Agreements</CardTitle>
            <Badge variant={allComplete ? 'default' : 'secondary'} className={allComplete ? 'bg-green-600' : ''}>
              {completedDocs.length}/3 Complete
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Review and complete each document digitally. PDFs are generated automatically for compliance records.
          </p>
        </CardHeader>
      </Card>

      {/* ── 1. Service Agreement (digital form) ── */}
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
              <p className="text-xs text-muted-foreground mt-0.5">
                Review the agreement details and confirm acceptance.
              </p>
            </div>
            {serviceAgreementComplete && (
              <Badge variant="default" className="bg-green-600">Complete</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Agreement Summary — pre-filled from participant data */}
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
                      const group = { name: ALL_REGISTRATION_GROUPS[code] || code }
                      return (
                        <div key={code} className="flex items-center gap-2 rounded bg-muted/50 px-3 py-2">
                          <span className="font-mono text-xs text-muted-foreground">{code}</span>
                          <span className="text-sm">{group?.name || code}</span>
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
                <p><strong>Cancellations:</strong> If you need to cancel a scheduled support, please give at least 48 hours notice. Cancellations with less than 48 hours notice, or failure to attend ("no-show"), may be charged at 100% of the agreed rate in line with NDIS Pricing Arrangements.</p>
                <p><strong>Changes to services:</strong> Either party may request changes to services by providing reasonable notice. Changes will be documented as an addendum to this agreement.</p>
                <p><strong>Ending this agreement:</strong> Either party may end this agreement by providing 14 days written notice. In the event of a safety concern, services may be suspended immediately.</p>
                <p><strong>Complaints:</strong> If you are unhappy with our services, you can make a complaint to us directly, to the NDIS Quality and Safeguards Commission (1800 035 544), or to your Support Coordinator.</p>
                <p><strong>Privacy:</strong> We handle your personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Confirmation checkboxes */}
          <div className="space-y-3 pt-2 border-t">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={agreementReviewed}
                onCheckedChange={(checked) => setAgreementReviewed(!!checked)}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium">I have reviewed the agreement details above</span>
                <p className="text-xs text-muted-foreground">Confirm you have gone through all sections with the participant.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                disabled={!agreementReviewed}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium">Participant accepts the terms and conditions</span>
                <p className="text-xs text-muted-foreground">The participant (or their guardian) agrees to the terms above.</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Consent Form (digital form) ── */}
      <Card className={consentFormComplete ? 'border-green-200' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {consentFormComplete ? (
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <CardTitle className="text-base">Consent Form</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Go through each consent item with the participant and toggle the ones they agree to.
              </p>
            </div>
            {consentFormComplete ? (
              <Badge variant="default" className="bg-green-600">Complete</Badge>
            ) : (
              <Badge variant="secondary">
                {CONSENT_ITEMS.filter((i) => consents[i.key]).length}/{CONSENT_ITEMS.length}
              </Badge>
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
              <Switch
                checked={consents[item.key]}
                onCheckedChange={() => toggleConsent(item.key)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              {consents[item.key] && (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── 3. Signatures ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signatures</CardTitle>
          <p className="text-xs text-muted-foreground">
            Capture signatures for both the Service Agreement and Consent Form.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Participant Signature</Label>
            {participantSignature ? (
              <div className="space-y-2">
                <div className="border rounded-lg p-2 bg-white">
                  <img src={participantSignature} alt="Participant signature" className="h-20 mx-auto" />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setParticipantSignature('')}>
                  Clear & Re-sign
                </Button>
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
                <Button type="button" variant="outline" size="sm" onClick={() => setProviderSignature('')}>
                  Clear & Re-sign
                </Button>
              </div>
            ) : (
              <SignaturePad onSave={setProviderSignature} label="Provider Signature" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Welcome Pack (stays as PDF — informational) ── */}
      <Card className={welcomePackGenerated ? 'border-green-200' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {welcomePackGenerated ? (
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <FileCheck className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <CardTitle className="text-base">Welcome Pack</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Participant handbook with rights, complaints process and key information.
              </p>
            </div>
            {welcomePackGenerated && (
              <Badge variant="default" className="bg-green-600">Provided</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={welcomePackGenerated ? 'outline' : 'default'}
              size="sm"
              disabled={generatingWelcomePack || !participant}
              onClick={handleGenerateWelcomePack}
            >
              {generatingWelcomePack ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-1" />
              )}
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

      {/* ── Status Summary ── */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {[
              { label: 'Service Agreement', done: serviceAgreementComplete },
              { label: 'Consent Form', done: consentFormComplete },
              { label: 'Welcome Pack', done: welcomePackGenerated },
            ].map((doc) => (
              <div key={doc.label} className="flex items-center gap-2">
                {doc.done ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={`text-sm ${doc.done ? 'text-green-800' : 'text-muted-foreground'}`}>
                  {doc.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!allComplete && (
        <Alert>
          <AlertDescription>
            Complete all documents before proceeding. You can still save and come back later.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
}
