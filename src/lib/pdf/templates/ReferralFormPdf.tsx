import { Document, Text, View } from '@react-pdf/renderer'
import { BrandedPage, Field, FieldRow, Section, Spacer, Divider, PdfBadge } from '../components'
import { baseStyles } from '../styles'
import type { OrgInfo } from '../components'
import type { Tables } from '@/lib/types/database'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'

interface ReferralFormPdfProps {
  org: OrgInfo
  participant: Tables<'participants'>
  generatedDate: string
}

export function ReferralFormPdf({ org, participant, generatedDate }: ReferralFormPdfProps) {
  const urgencyVariant = participant.urgency === 'crisis' ? 'danger' : participant.urgency === 'urgent' ? 'warning' : 'success'

  return (
    <Document>
      <BrandedPage org={org} documentTitle="Referral Form">
        <Text style={baseStyles.title}>Referral Form</Text>
        <Text style={baseStyles.subtitle}>{org.name} — New Participant Referral</Text>

        <Section title="Referral Details" />
        <FieldRow>
          <Field label="Referral Date" value={participant.referral_date || generatedDate} half />
          <Field label="Referral Source" value={participant.referral_source || '-'} half />
        </FieldRow>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Text style={baseStyles.fieldLabel}>Urgency</Text>
          <PdfBadge text={(participant.urgency || 'routine').toUpperCase()} variant={urgencyVariant} />
        </View>

        <Section title="Participant Details" />
        <FieldRow>
          <Field label="First Name" value={participant.first_name} half />
          <Field label="Last Name" value={participant.last_name} half />
        </FieldRow>
        <FieldRow>
          <Field label="Phone" value={participant.phone || '-'} half />
          <Field label="Email" value={participant.email || '-'} half />
        </FieldRow>
        <Field label="NDIS Number" value={participant.ndis_number || '-'} />

        <Section title="Services Requested" />
        {participant.services_requested?.length > 0 ? (
          participant.services_requested.map((code) => (
            <View key={code} style={{ flexDirection: 'row', marginBottom: 4, gap: 8 }}>
              <PdfBadge text={code} variant="primary" />
              <Text style={baseStyles.body}>{ALL_REGISTRATION_GROUPS[code] || code}</Text>
            </View>
          ))
        ) : (
          <Text style={baseStyles.body}>No services specified</Text>
        )}

        {participant.referral_notes && (
          <>
            <Section title="Referral Notes" />
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, marginVertical: 4 }}>
              <Text style={baseStyles.body}>{participant.referral_notes}</Text>
            </View>
          </>
        )}

        <Spacer />
        <Divider />
        <Text style={baseStyles.small}>Document generated: {generatedDate} | {org.name}</Text>
      </BrandedPage>
    </Document>
  )
}
