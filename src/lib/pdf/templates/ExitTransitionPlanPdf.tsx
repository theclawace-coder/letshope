import { Document, Text, View } from '@react-pdf/renderer'
import { BrandedPage, Field, FieldRow, Section, SignatureBlock, Spacer, Divider, CheckItem, InfoBox } from '../components'
import { baseStyles } from '../styles'
import type { OrgInfo } from '../components'
import type { Tables } from '@/lib/types/database'

interface ExitTransitionPlanProps {
  org: OrgInfo
  participant: Tables<'participants'>
  generatedDate: string
  reason?: string
  newProvider?: string
  transitionDate?: string
  notes?: string
}

export function ExitTransitionPlanPdf({ org, participant, generatedDate, reason, newProvider, transitionDate, notes }: ExitTransitionPlanProps) {
  return (
    <Document>
      <BrandedPage org={org} documentTitle="Exit & Transition Plan">
        <Text style={baseStyles.title}>Exit &amp; Transition Plan</Text>
        <Text style={baseStyles.subtitle}>{participant.first_name} {participant.last_name}</Text>

        <Section title="Participant Details" />
        <FieldRow>
          <Field label="Full Name" value={`${participant.first_name} ${participant.last_name}`} half />
          <Field label="NDIS Number" value={participant.ndis_number || '-'} half />
        </FieldRow>
        <FieldRow>
          <Field label="Date of Birth" value={participant.date_of_birth || '-'} half />
          <Field label="Phone" value={participant.phone || '-'} half />
        </FieldRow>

        <Section title="Exit / Transition Details" />
        <Field label="Reason for Exit / Transition" value={reason || 'To be documented'} />
        <FieldRow>
          <Field label="Planned Transition Date" value={transitionDate || '-'} half />
          <Field label="New Provider (if applicable)" value={newProvider || '-'} half />
        </FieldRow>

        <Section title="Transition Checklist" />
        <CheckItem label="Participant notified of exit/transition process" checked={false} />
        <CheckItem label="Guardian/nominee notified (if applicable)" checked={false} />
        <CheckItem label="Support coordinator notified" checked={false} />
        <CheckItem label="All outstanding services delivered or alternative arrangements made" checked={false} />
        <CheckItem label="Final progress notes completed" checked={false} />
        <CheckItem label="All invoicing finalised" checked={false} />
        <CheckItem label="Service agreement formally ended" checked={false} />
        <CheckItem label="Participant records prepared for handover (if transitioning)" checked={false} />
        <CheckItem label="Personal information handled per consent and Privacy Act" checked={false} />
        <CheckItem label="Feedback collected from participant about their experience" checked={false} />

        <Section title="Information to Transfer" />
        <Text style={baseStyles.body}>
          The following information will be provided to the new provider (with the participant's consent):
        </Text>
        <Spacer />
        <CheckItem label="Service Agreement" checked={false} />
        <CheckItem label="Support Plan and goals" checked={false} />
        <CheckItem label="Risk Assessment" checked={false} />
        <CheckItem label="Progress Notes (summary or full — as consented)" checked={false} />
        <CheckItem label="Incident or concern records (if relevant)" checked={false} />
        <CheckItem label="Medical and health information" checked={false} />

        {notes && (
          <>
            <Section title="Additional Notes" />
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, marginVertical: 4 }}>
              <Text style={baseStyles.body}>{notes}</Text>
            </View>
          </>
        )}

        <Section title="Important Information" />
        <InfoBox>
          <Text style={baseStyles.body}>
            {org.name} will retain participant records for a minimum of 7 years in accordance with NDIS requirements
            and the Privacy Act 1988. You can request access to your records at any time.
          </Text>
        </InfoBox>

        <Section title="Signatures" />
        <View style={baseStyles.signatureBlock}>
          <SignatureBlock label="Participant / Guardian" date={generatedDate} />
          <SignatureBlock label="Provider Representative" date={generatedDate} />
        </View>

        <Spacer />
        <Divider />
        <Text style={baseStyles.small}>Document generated: {generatedDate} | {org.name}</Text>
      </BrandedPage>
    </Document>
  )
}
