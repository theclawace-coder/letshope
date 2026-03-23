import { Document, Text, View } from '@react-pdf/renderer'
import { BrandedPage, Section, Spacer, Divider, InfoBox, CheckItem } from '../components'
import { baseStyles, BRAND } from '../styles'
import type { OrgInfo } from '../components'
import type { Tables } from '@/lib/types/database'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'

interface ParticipantHandbookProps {
  org: OrgInfo
  participant: Tables<'participants'>
  generatedDate: string
}

export function ParticipantHandbookPdf({ org, participant, generatedDate }: ParticipantHandbookProps) {
  return (
    <Document>
      {/* Cover page */}
      <BrandedPage org={org} documentTitle="Participant Handbook">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
          <Text style={{ fontSize: 32, fontFamily: 'Helvetica-Bold', color: BRAND.primary, textAlign: 'center', marginBottom: 12 }}>
            Participant Handbook
          </Text>
          <Text style={{ fontSize: 16, color: BRAND.text, textAlign: 'center', marginBottom: 8 }}>
            {org.name}
          </Text>
          <Text style={{ fontSize: 14, color: BRAND.textMuted, textAlign: 'center', marginBottom: 40 }}>
            NDIS Registered Provider
          </Text>
          <View style={{ backgroundColor: BRAND.primaryLight, borderRadius: 8, padding: 20, width: '80%' }}>
            <Text style={{ fontSize: 14, color: BRAND.primary, textAlign: 'center', fontFamily: 'Helvetica-Bold', marginBottom: 8 }}>
              Prepared for
            </Text>
            <Text style={{ fontSize: 18, color: BRAND.text, textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>
              {participant.first_name} {participant.last_name}
            </Text>
            {participant.ndis_number && (
              <Text style={{ fontSize: 10, color: BRAND.textMuted, textAlign: 'center', marginTop: 4 }}>
                NDIS: {participant.ndis_number}
              </Text>
            )}
          </View>
          <Spacer />
          <Text style={{ fontSize: 10, color: BRAND.textMuted, textAlign: 'center' }}>
            Generated: {generatedDate}
          </Text>
        </View>
      </BrandedPage>

      {/* Welcome */}
      <BrandedPage org={org} documentTitle="Participant Handbook">
        <Text style={baseStyles.title}>Welcome</Text>
        <Spacer />
        <Text style={baseStyles.body}>
          Dear {participant.first_name},
        </Text>
        <Spacer />
        <Text style={baseStyles.body}>
          Welcome to {org.name}! We are thrilled to have you as part of our community. This handbook has been
          prepared specifically for you and contains important information about our services, your rights, and
          how we work together to achieve your goals.
        </Text>
        <Spacer />
        <Text style={baseStyles.body}>
          We are committed to providing you with high-quality, person-centred disability supports. Our team is
          here to help you live the life you choose, and we encourage you to share your feedback, ask questions,
          and be actively involved in all decisions about your supports.
        </Text>

        {/* About us */}
        <Section title="About Us" />
        <Text style={baseStyles.body}>
          {org.name} is a registered NDIS provider delivering disability support services across the community.
          {org.ndis_registration_number ? ` Our NDIS registration number is ${org.ndis_registration_number}.` : ''}
          {org.abn ? ` ABN: ${org.abn}.` : ''}
        </Text>
        <Spacer />
        <Text style={baseStyles.body}>
          We provide the following services:
        </Text>
        <Spacer />
        {participant.services_requested?.map((code) => (
          <CheckItem key={code} label={`${code} - ${ALL_REGISTRATION_GROUPS[code] || code}`} checked />
        ))}

        <Section title="Our Values" />
        <CheckItem label="Respect — We treat every person with dignity and respect" checked />
        <CheckItem label="Choice — You decide how you want to live your life" checked />
        <CheckItem label="Inclusion — Everyone deserves to be part of the community" checked />
        <CheckItem label="Safety — Your wellbeing is our top priority" checked />
        <CheckItem label="Quality — We continuously improve our services" checked />
        <CheckItem label="Accountability — We are transparent in everything we do" checked />
      </BrandedPage>

      {/* Your Rights */}
      <BrandedPage org={org} documentTitle="Participant Handbook">
        <Text style={baseStyles.title}>Your Rights</Text>
        <Spacer />
        <Text style={baseStyles.body}>
          As an NDIS participant, you have important rights that are protected by law. The NDIS Quality and
          Safeguards Commission ensures that providers like us meet high standards.
        </Text>

        <Section title="You Have the Right To" />
        <CheckItem label="Be treated with dignity and respect at all times" checked />
        <CheckItem label="Be free from abuse, neglect, exploitation, and violence" checked />
        <CheckItem label="Choose who provides your supports" checked />
        <CheckItem label="Be involved in decisions about your supports and services" checked />
        <CheckItem label="Have your cultural and linguistic needs respected" checked />
        <CheckItem label="Access your personal information we hold about you" checked />
        <CheckItem label="Privacy and confidentiality of your information" checked />
        <CheckItem label="Provide feedback, raise concerns, or make a complaint" checked />
        <CheckItem label="Have your complaints heard and resolved fairly" checked />
        <CheckItem label="Change or leave your service provider at any time" checked />

        <Section title="NDIS Code of Conduct" />
        <Text style={baseStyles.body}>
          All our staff and workers must follow the NDIS Code of Conduct. This means they must:
        </Text>
        <Spacer />
        <CheckItem label="Act with respect for individual rights to freedom of expression, self-determination and decision-making" checked />
        <CheckItem label="Respect the privacy of people with disability" checked />
        <CheckItem label="Provide supports and services in a safe and competent manner" checked />
        <CheckItem label="Act with integrity, honesty and transparency" checked />
        <CheckItem label="Promptly take steps to raise and act on concerns about matters that may impact the quality and safety of supports" checked />
        <CheckItem label="Take all reasonable steps to prevent and respond to all forms of violence, exploitation, neglect and abuse" checked />
        <CheckItem label="Take all reasonable steps to prevent and respond to sexual misconduct" checked />

        <Section title="Advocacy" />
        <Text style={baseStyles.body}>
          You have the right to use an advocate — someone who can speak on your behalf and help you understand your rights.
        </Text>
        <Spacer />
        <InfoBox>
          <Text style={[baseStyles.body, baseStyles.bold]}>National Disability Advocacy Program</Text>
          <Text style={baseStyles.body}>Phone: 1800 880 052</Text>
          <Text style={baseStyles.body}>These services are free and independent.</Text>
        </InfoBox>
      </BrandedPage>

      {/* Complaints */}
      <BrandedPage org={org} documentTitle="Participant Handbook">
        <Text style={baseStyles.title}>Complaints & Feedback</Text>
        <Spacer />
        <Text style={baseStyles.body}>
          We welcome your feedback — both positive and negative. It helps us improve our services. You will
          never be treated differently for making a complaint.
        </Text>

        <Section title="How to Give Feedback or Make a Complaint" />
        <Text style={baseStyles.subheading}>Step 1: Talk to Us</Text>
        <Text style={baseStyles.body}>
          You can speak directly to your support worker, contact our office, or ask someone you trust to speak on your behalf.
        </Text>
        {org.phone && <Text style={baseStyles.body}>Phone: {org.phone}</Text>}
        {org.email && <Text style={baseStyles.body}>Email: {org.email}</Text>}
        <Spacer />

        <Text style={baseStyles.subheading}>Step 2: Formal Complaint</Text>
        <Text style={baseStyles.body}>
          If you are not satisfied after speaking to us, you can lodge a formal complaint. We will acknowledge your
          complaint within 2 business days and aim to resolve it within 21 business days.
        </Text>
        <Spacer />

        <Text style={baseStyles.subheading}>Step 3: External Complaint</Text>
        <Text style={baseStyles.body}>
          If you are still not satisfied, you can contact the NDIS Quality and Safeguards Commission:
        </Text>
        <Spacer />
        <InfoBox>
          <Text style={[baseStyles.body, baseStyles.bold]}>NDIS Quality and Safeguards Commission</Text>
          <Text style={baseStyles.body}>Phone: 1800 035 544 (free call from landlines)</Text>
          <Text style={baseStyles.body}>TTY: 133 677</Text>
          <Text style={baseStyles.body}>Interpreters: 131 450</Text>
          <Text style={baseStyles.body}>National Relay Service: 1300 555 727</Text>
        </InfoBox>

        <Section title="Cancellation Policy" />
        <Text style={baseStyles.body}>
          We understand plans change! Please let us know as early as possible if you need to cancel:
        </Text>
        <Spacer />
        <CheckItem label="2+ business days notice — no charge" checked />
        <CheckItem label="Less than 2 business days — up to 90% may be charged" checked />
        <CheckItem label="No notice (no show) — up to 100% may be charged" checked />

        <Section title="Emergency Contacts" />
        <Text style={baseStyles.body}>In an emergency, always call 000 first.</Text>
        <Spacer />
        <InfoBox>
          <Text style={baseStyles.body}>Emergency Services: 000</Text>
          <Text style={baseStyles.body}>Lifeline: 13 11 14</Text>
          <Text style={baseStyles.body}>Beyond Blue: 1300 22 4636</Text>
          <Text style={baseStyles.body}>{org.name}: {org.phone || org.email || ''}</Text>
        </InfoBox>

        <Section title="Contact Us" />
        {org.phone && <Text style={baseStyles.body}>Phone: {org.phone}</Text>}
        {org.email && <Text style={baseStyles.body}>Email: {org.email}</Text>}
        {org.address && <Text style={baseStyles.body}>Address: {org.address}</Text>}

        <Spacer />
        <Divider />
        <Text style={baseStyles.small}>
          This handbook was prepared for {participant.first_name} {participant.last_name} on {generatedDate}.
          {org.name} — NDIS Registered Provider
        </Text>
      </BrandedPage>
    </Document>
  )
}
