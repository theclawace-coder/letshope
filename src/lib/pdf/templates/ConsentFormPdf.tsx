import { Document, Text, View } from '@react-pdf/renderer'
import { BrandedPage, Field, FieldRow, Section, SignatureBlock, Spacer, CheckItem, InfoBox } from '../components'
import { baseStyles } from '../styles'
import type { OrgInfo } from '../components'
import type { Tables } from '@/lib/types/database'
import type { Address } from '@/lib/types'

interface ConsentFormProps {
  org: OrgInfo
  participant: Tables<'participants'>
  generatedDate: string
  participantSignature?: string | null
  providerSignature?: string | null
}

export function ConsentFormPdf({ org, participant, generatedDate, participantSignature, providerSignature }: ConsentFormProps) {
  const address = participant.address as Address | null
  const addressStr = address ? `${address.street}, ${address.suburb} ${address.state} ${address.postcode}` : '-'

  return (
    <Document>
      <BrandedPage org={org} documentTitle="Consent Form">
        <Text style={baseStyles.title}>Consent Form</Text>
        <Text style={baseStyles.subtitle}>Collection, Use and Disclosure of Personal Information</Text>

        {/* Participant details */}
        <Section title="Participant Details" />
        <FieldRow>
          <Field label="Full Name" value={`${participant.first_name} ${participant.last_name}`} half />
          <Field label="Date of Birth" value={participant.date_of_birth || '-'} half />
        </FieldRow>
        <FieldRow>
          <Field label="NDIS Number" value={participant.ndis_number || '-'} half />
          <Field label="Phone" value={participant.phone || '-'} half />
        </FieldRow>
        <Field label="Address" value={addressStr} />
        {participant.has_guardian && (
          <FieldRow>
            <Field label="Guardian Name" value={participant.guardian_name || '-'} half />
            <Field label="Relationship" value={participant.guardian_relationship || '-'} half />
          </FieldRow>
        )}

        {/* Purpose */}
        <Section title="Purpose of Collection" />
        <Text style={baseStyles.body}>
          {org.name} collects personal information about you in order to provide you with disability support
          services under the National Disability Insurance Scheme (NDIS). We are committed to protecting your
          privacy and handling your personal information in accordance with the Privacy Act 1988 (Cth) and the
          Australian Privacy Principles.
        </Text>

        <Section title="Types of Information Collected" />
        <Text style={baseStyles.body}>We may collect the following types of personal information:</Text>
        <Spacer />
        <CheckItem label="Name, address, date of birth, and contact details" checked />
        <CheckItem label="NDIS participant number and plan details" checked />
        <CheckItem label="Medical history, diagnoses, allergies, and medications" checked />
        <CheckItem label="Emergency contact details" checked />
        <CheckItem label="Guardian/nominee details (if applicable)" checked />
        <CheckItem label="Cultural and linguistic background" checked />
        <CheckItem label="Support needs, goals, and preferences" checked />
        <CheckItem label="Progress notes and service delivery records" checked />
        <CheckItem label="Photos or recordings (with separate consent)" checked />

        <Section title="How We Use Your Information" />
        <Text style={baseStyles.body}>Your personal information will be used to:</Text>
        <Spacer />
        <CheckItem label="Deliver disability support services to you" checked />
        <CheckItem label="Develop and review your individual support plan" checked />
        <CheckItem label="Communicate with you about your services" checked />
        <CheckItem label="Process NDIS claims and invoicing" checked />
        <CheckItem label="Meet our legal and regulatory obligations" checked />
        <CheckItem label="Improve the quality and safety of our services" checked />

        <Section title="Disclosure of Information" />
        <Text style={baseStyles.body}>
          We may disclose your personal information to:
        </Text>
        <Spacer />
        <CheckItem label="The National Disability Insurance Agency (NDIA)" checked />
        <CheckItem label="NDIS Quality and Safeguards Commission" checked />
        <CheckItem label="Your support coordinator, LAC, or plan manager" checked />
        <CheckItem label="Other service providers involved in your care (with your consent)" checked />
        <CheckItem label="Medical practitioners and health professionals" checked />
        <CheckItem label="Emergency services (in case of emergency)" checked />
        <CheckItem label="Government agencies as required by law" checked />

        <Section title="Your Rights" />
        <Text style={baseStyles.body}>You have the right to:</Text>
        <Spacer />
        <CheckItem label="Access your personal information held by us" checked />
        <CheckItem label="Request correction of inaccurate information" checked />
        <CheckItem label="Withdraw this consent at any time (in writing)" checked />
        <CheckItem label="Make a privacy complaint if you believe your information has been mishandled" checked />

        <InfoBox>
          <Text style={[baseStyles.body, baseStyles.bold]}>Important:</Text>
          <Text style={baseStyles.body}>
            Withdrawing consent may affect our ability to continue providing certain services. We will discuss
            any implications with you before any changes take effect.
          </Text>
        </InfoBox>

        {/* Consent declaration */}
        <Section title="Consent Declaration" />
        <Text style={baseStyles.body}>
          I, {participant.has_guardian ? (participant.guardian_name || 'the guardian/nominee') : `${participant.first_name} ${participant.last_name}`},
          {participant.has_guardian ? ` on behalf of ${participant.first_name} ${participant.last_name},` : ''} consent
          to {org.name} collecting, using, and disclosing my personal information as described above for the purpose
          of receiving NDIS-funded disability support services.
        </Text>
        <Spacer />
        <Text style={baseStyles.body}>
          I understand that I can withdraw this consent at any time by providing written notice.
        </Text>

        {/* Signatures */}
        <Spacer />
        <View style={baseStyles.signatureBlock}>
          <SignatureBlock
            label={participant.has_guardian ? 'Guardian/Nominee Signature' : 'Participant Signature'}
            signatureDataUrl={participantSignature}
            date={generatedDate}
          />
          <SignatureBlock
            label="Provider Representative"
            signatureDataUrl={providerSignature}
            date={generatedDate}
          />
        </View>

        <Spacer />
        <Text style={baseStyles.small}>Document generated: {generatedDate}</Text>
      </BrandedPage>
    </Document>
  )
}
