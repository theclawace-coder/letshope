import { Document, Text, View } from '@react-pdf/renderer'
import { BrandedPage, Field, FieldRow, Section, SignatureBlock, Spacer, Divider, SimpleTable, InfoBox } from '../components'
import { baseStyles } from '../styles'
import type { OrgInfo } from '../components'
import type { Tables } from '@/lib/types/database'
import type { Goal } from '@/lib/types'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'

interface SupportPlanPdfProps {
  org: OrgInfo
  participant: Tables<'participants'>
  generatedDate: string
  participantSignature?: string | null
  providerSignature?: string | null
}

export function SupportPlanPdf({ org, participant, generatedDate, participantSignature, providerSignature }: SupportPlanPdfProps) {
  const goals = (participant.goals || []) as unknown as Goal[]

  return (
    <Document>
      <BrandedPage org={org} documentTitle="Support Plan">
        <Text style={baseStyles.title}>Individualised Support Plan</Text>
        <Text style={baseStyles.subtitle}>{participant.first_name} {participant.last_name}</Text>

        {/* Participant summary */}
        <Section title="Participant Summary" />
        <FieldRow>
          <Field label="Full Name" value={`${participant.first_name} ${participant.last_name}`} half />
          <Field label="NDIS Number" value={participant.ndis_number || '-'} half />
        </FieldRow>
        <FieldRow>
          <Field label="Date of Birth" value={participant.date_of_birth || '-'} half />
          <Field label="Funding Type" value={participant.funding_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '-'} half />
        </FieldRow>
        <FieldRow>
          <Field label="Plan Start" value={participant.plan_start_date || '-'} half />
          <Field label="Plan End" value={participant.plan_end_date || '-'} half />
        </FieldRow>
        {participant.communication_needs && <Field label="Communication Needs" value={participant.communication_needs} />}
        {participant.cultural_needs && <Field label="Cultural Needs" value={participant.cultural_needs} />}
        {participant.mobility_needs && <Field label="Mobility Needs" value={participant.mobility_needs} />}

        {/* Services */}
        <Section title="Services" />
        {participant.services_requested?.length > 0 ? (
          <SimpleTable
            columns={[
              { key: 'code', header: 'NDIS Code', width: '20%' },
              { key: 'service', header: 'Service', width: '80%' },
            ]}
            rows={participant.services_requested.map((code) => ({
              code,
              service: ALL_REGISTRATION_GROUPS[code] || code,
            }))}
          />
        ) : (
          <Text style={baseStyles.body}>No services allocated yet</Text>
        )}

        {/* Goals */}
        <Section title="Goals and Strategies" />
        {goals.length > 0 ? (
          goals.map((g, i) => (
            <View key={i} style={{ marginBottom: 12, backgroundColor: '#f8fafc', borderRadius: 4, padding: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={[baseStyles.body, baseStyles.bold]}>Goal {i + 1}</Text>
                <Text style={[baseStyles.badge, baseStyles.badgePrimary]}>{g.priority}</Text>
              </View>
              <Text style={baseStyles.body}>{g.goal}</Text>
              {g.notes && (
                <>
                  <Spacer />
                  <Text style={[baseStyles.small, baseStyles.bold]}>Notes:</Text>
                  <Text style={baseStyles.body}>{g.notes}</Text>
                </>
              )}
            </View>
          ))
        ) : (
          <Text style={baseStyles.body}>Goals to be determined in consultation with the participant.</Text>
        )}

        {/* Support team */}
        {participant.support_coordinator_name && (
          <>
            <Section title="Support Team" />
            <FieldRow>
              <Field label="Support Coordinator" value={participant.support_coordinator_name} half />
              <Field label="SC Phone" value={participant.support_coordinator_phone || '-'} half />
            </FieldRow>
            {participant.lac_name && (
              <FieldRow>
                <Field label="LAC" value={participant.lac_name} half />
                <Field label="LAC Contact" value={participant.lac_contact || '-'} half />
              </FieldRow>
            )}
          </>
        )}

        {/* Review */}
        <Section title="Plan Review" />
        <InfoBox>
          <Text style={baseStyles.body}>
            This support plan will be reviewed regularly (at least every 12 months or when the participant's NDIS plan
            is reviewed). Reviews will be conducted in consultation with {participant.first_name} and their support team.
          </Text>
        </InfoBox>

        {/* Signatures */}
        <Section title="Agreement" />
        <Text style={baseStyles.body}>
          By signing below, the participant (or their guardian/nominee) agrees that this support plan accurately
          reflects their goals, needs, and chosen supports.
        </Text>
        <Spacer />
        <View style={baseStyles.signatureBlock}>
          <SignatureBlock label="Participant / Guardian" signatureDataUrl={participantSignature} date={generatedDate} />
          <SignatureBlock label="Provider Representative" signatureDataUrl={providerSignature} date={generatedDate} />
        </View>

        <Spacer />
        <Divider />
        <Text style={baseStyles.small}>Document generated: {generatedDate} | {org.name}</Text>
      </BrandedPage>
    </Document>
  )
}
