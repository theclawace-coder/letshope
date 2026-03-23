import { Document, Text, View } from '@react-pdf/renderer'
import { BrandedPage, Field, FieldRow, Section, SignatureBlock, Spacer, SimpleTable, CheckItem } from '../components'
import { baseStyles } from '../styles'
import type { OrgInfo } from '../components'
import type { Tables } from '@/lib/types/database'
import type { Address } from '@/lib/types'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'

interface ServiceAgreementProps {
  org: OrgInfo
  participant: Tables<'participants'>
  agreement: Tables<'service_agreements'>
  generatedDate: string
}

export function ServiceAgreementPdf({ org, participant, agreement, generatedDate }: ServiceAgreementProps) {
  const address = participant.address as Address | null
  const addressStr = address ? `${address.street}, ${address.suburb} ${address.state} ${address.postcode}` : '-'
  const services = (agreement.services || []) as Array<{ code: string; name?: string; hours?: number; rate?: number }>
  const fundingLabel = participant.funding_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '-'

  return (
    <Document>
      <BrandedPage org={org} documentTitle="Service Agreement" documentId={agreement.id.slice(0, 8).toUpperCase()}>
        {/* Title */}
        <Text style={baseStyles.title}>Service Agreement</Text>
        <Text style={baseStyles.subtitle}>Between {org.name} and {participant.first_name} {participant.last_name}</Text>

        {/* Parties */}
        <Section title="1. Parties to this Agreement" />
        <View style={baseStyles.infoBox}>
          <Text style={[baseStyles.body, baseStyles.bold]}>Provider</Text>
          <Text style={baseStyles.body}>{org.name}</Text>
          {org.abn && <Text style={baseStyles.small}>ABN: {org.abn}</Text>}
          {org.ndis_registration_number && <Text style={baseStyles.small}>NDIS Registration: {org.ndis_registration_number}</Text>}
          {org.phone && <Text style={baseStyles.small}>Phone: {org.phone}</Text>}
          {org.email && <Text style={baseStyles.small}>Email: {org.email}</Text>}
        </View>
        <Spacer />
        <View style={baseStyles.infoBox}>
          <Text style={[baseStyles.body, baseStyles.bold]}>Participant</Text>
          <Text style={baseStyles.body}>{participant.first_name} {participant.last_name}</Text>
          {participant.ndis_number && <Text style={baseStyles.small}>NDIS Number: {participant.ndis_number}</Text>}
          <Text style={baseStyles.small}>Date of Birth: {participant.date_of_birth || '-'}</Text>
          <Text style={baseStyles.small}>Address: {addressStr}</Text>
          {participant.phone && <Text style={baseStyles.small}>Phone: {participant.phone}</Text>}
          {participant.email && <Text style={baseStyles.small}>Email: {participant.email}</Text>}
        </View>
        {participant.has_guardian && (
          <>
            <Spacer />
            <View style={baseStyles.infoBox}>
              <Text style={[baseStyles.body, baseStyles.bold]}>Guardian / Nominee</Text>
              <Text style={baseStyles.body}>{participant.guardian_name || '-'}</Text>
              <Text style={baseStyles.small}>Relationship: {participant.guardian_relationship || '-'}</Text>
              <Text style={baseStyles.small}>Phone: {participant.guardian_phone || '-'}</Text>
            </View>
          </>
        )}

        {/* Agreement Period */}
        <Section title="2. Agreement Period" />
        <FieldRow>
          <Field label="Start Date" value={agreement.start_date || participant.plan_start_date || '-'} half />
          <Field label="End Date" value={agreement.end_date || participant.plan_end_date || '-'} half />
        </FieldRow>
        <Field label="Funding Type" value={fundingLabel} />
        {participant.plan_number && <Field label="NDIS Plan Number" value={participant.plan_number} />}

        {/* Services */}
        <Section title="3. Services to be Provided" />
        {services.length > 0 ? (
          <SimpleTable
            columns={[
              { key: 'code', header: 'NDIS Code', width: '15%' },
              { key: 'name', header: 'Service', width: '45%' },
              { key: 'hours', header: 'Hours/Qty', width: '15%' },
              { key: 'rate', header: 'Rate ($/hr)', width: '15%' },
              { key: 'total', header: 'Total', width: '10%' },
            ]}
            rows={services.map((s) => ({
              code: s.code,
              name: s.name || ALL_REGISTRATION_GROUPS[s.code] || s.code,
              hours: s.hours != null ? String(s.hours) : '-',
              rate: s.rate != null ? `$${s.rate.toFixed(2)}` : '-',
              total: s.hours != null && s.rate != null ? `$${(s.hours * s.rate).toFixed(2)}` : '-',
            }))}
          />
        ) : (
          <Text style={baseStyles.body}>
            {participant.services_requested?.map((code) => ALL_REGISTRATION_GROUPS[code] || code).join(', ') || 'Services as outlined in NDIS plan.'}
          </Text>
        )}

        {/* Budget */}
        {(participant.budget_core || participant.budget_capacity_building || participant.budget_capital) && (
          <>
            <Section title="4. NDIS Plan Budget" />
            <SimpleTable
              columns={[
                { key: 'category', header: 'Budget Category', width: '50%' },
                { key: 'amount', header: 'Amount', width: '50%' },
              ]}
              rows={[
                ...(participant.budget_core ? [{ category: 'Core Supports', amount: `$${participant.budget_core.toFixed(2)}` }] : []),
                ...(participant.budget_capacity_building ? [{ category: 'Capacity Building', amount: `$${participant.budget_capacity_building.toFixed(2)}` }] : []),
                ...(participant.budget_capital ? [{ category: 'Capital', amount: `$${participant.budget_capital.toFixed(2)}` }] : []),
              ]}
            />
          </>
        )}

        {/* Rights & Responsibilities */}
        <Section title="5. Your Rights" />
        <Text style={baseStyles.body}>As a participant, you have the right to:</Text>
        <Spacer />
        <CheckItem label="Be treated with dignity and respect" checked />
        <CheckItem label="Have your privacy and confidentiality maintained" checked />
        <CheckItem label="Be involved in decisions about your supports" checked />
        <CheckItem label="Choose who provides your supports" checked />
        <CheckItem label="Provide feedback or make a complaint without fear of retribution" checked />
        <CheckItem label="Access your personal information held by us" checked />
        <CheckItem label="Have supports delivered safely and competently" checked />

        <Section title="6. Our Responsibilities" />
        <Text style={baseStyles.body}>{org.name} will:</Text>
        <Spacer />
        <CheckItem label="Deliver supports as outlined in this agreement" checked />
        <CheckItem label="Communicate openly and honestly" checked />
        <CheckItem label="Respect your privacy and handle personal information in accordance with the Privacy Act" checked />
        <CheckItem label="Provide you with 14 days written notice of any changes" checked />
        <CheckItem label="Keep accurate records of supports delivered" checked />
        <CheckItem label="Invoice accurately and within agreed timeframes" checked />

        <Section title="7. Cancellation Policy" />
        <Text style={baseStyles.body}>
          If you need to cancel a scheduled support, please provide at least 2 business days notice. Short notice cancellations
          (less than 2 business days) may be charged at 90% of the agreed rate in accordance with the NDIS Pricing Arrangements
          and Price Limits. No show cancellations (where no notice is given) may be charged at 100% of the agreed rate.
        </Text>

        <Section title="8. Complaints and Feedback" />
        <Text style={baseStyles.body}>
          If you are unhappy with our services, you can:
        </Text>
        <Spacer />
        <Text style={baseStyles.body}>1. Talk to your support worker or contact us directly</Text>
        <Text style={baseStyles.body}>2. Contact our complaints officer at {org.phone || org.email || 'the details above'}</Text>
        <Text style={baseStyles.body}>3. Contact the NDIS Quality and Safeguards Commission on 1800 035 544</Text>

        <Section title="9. Ending this Agreement" />
        <Text style={baseStyles.body}>
          Either party may end this agreement by providing 14 days written notice. {org.name} will assist with
          transitioning to another provider if requested. In cases of immediate risk to safety, this agreement may
          be ended without notice.
        </Text>

        {/* Signatures */}
        <Section title="10. Signatures" />
        <Text style={baseStyles.body}>
          By signing below, both parties agree to the terms and conditions outlined in this Service Agreement.
        </Text>
        <Spacer />
        <View style={baseStyles.signatureBlock}>
          <SignatureBlock
            label="Participant (or Guardian/Nominee)"
            signatureDataUrl={agreement.participant_signature_data}
            date={agreement.participant_signed_date || generatedDate}
          />
          <SignatureBlock
            label={`Provider Representative - ${org.name}`}
            date={agreement.provider_signed_date || generatedDate}
          />
        </View>

        {agreement.notes && (
          <>
            <Spacer />
            <Section title="Additional Notes" />
            <Text style={baseStyles.body}>{agreement.notes}</Text>
          </>
        )}

        <Spacer />
        <Text style={baseStyles.small}>
          Document generated: {generatedDate} | Version {agreement.version}
        </Text>
      </BrandedPage>
    </Document>
  )
}
