import { Document, Text, View } from '@react-pdf/renderer'
import { BrandedPage, Field, FieldRow, Section, Spacer, Divider, InfoBox, PdfBadge } from '../components'
import { baseStyles } from '../styles'
import type { OrgInfo } from '../components'
import type { Tables } from '@/lib/types/database'

interface RiskAssessmentPdfProps {
  org: OrgInfo
  participant: Tables<'participants'>
  riskAnswers: Record<string, string>
  generatedDate: string
}

// Match the onboarding constants risk assessment structure
const RISK_SECTIONS = [
  {
    title: 'Home Environment',
    questions: [
      { key: 'trip_hazards', label: 'Are there trip hazards in the home?' },
      { key: 'bathroom_safety', label: 'Is the bathroom safe and accessible?' },
      { key: 'adequate_lighting', label: 'Is there adequate lighting?' },
      { key: 'pets', label: 'Are there pets in the home?' },
      { key: 'emergency_exits', label: 'Are emergency exits clear and accessible?' },
      { key: 'smoke_alarms', label: 'Are smoke alarms installed and working?' },
    ],
  },
  {
    title: 'Health & Safety',
    questions: [
      { key: 'fall_risk', label: 'Is the participant at risk of falls?' },
      { key: 'skin_integrity', label: 'Are there skin integrity concerns?' },
      { key: 'dysphagia', label: 'Does the participant have swallowing difficulties (dysphagia)?' },
      { key: 'seizures', label: 'Does the participant experience seizures?' },
      { key: 'self_harm', label: 'Is there a risk of self-harm?' },
      { key: 'aggression', label: 'Is there a risk of aggression towards others?' },
      { key: 'wandering', label: 'Is there a risk of wandering/absconding?' },
    ],
  },
  {
    title: 'Communication',
    questions: [
      { key: 'verbal_communication', label: 'Can the participant communicate verbally?' },
      { key: 'hearing_impairment', label: 'Does the participant have a hearing impairment?' },
      { key: 'vision_impairment', label: 'Does the participant have a vision impairment?' },
      { key: 'interpreter_needed', label: 'Is an interpreter required?' },
      { key: 'cognitive_impairment', label: 'Does the participant have cognitive/intellectual impairment?' },
    ],
  },
]

export function RiskAssessmentPdf({ org, participant, riskAnswers, generatedDate }: RiskAssessmentPdfProps) {
  const riskVariant = participant.risk_level === 'high' ? 'danger' : participant.risk_level === 'medium' ? 'warning' : 'success'

  return (
    <Document>
      <BrandedPage org={org} documentTitle="Individual Risk Assessment">
        <Text style={baseStyles.title}>Individual Risk Assessment</Text>
        <Text style={baseStyles.subtitle}>{participant.first_name} {participant.last_name}</Text>

        {/* Summary */}
        <InfoBox>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[baseStyles.body, baseStyles.bold]}>Overall Risk Level</Text>
            <PdfBadge text={(participant.risk_level || 'Not assessed').toUpperCase()} variant={riskVariant} />
          </View>
          <Spacer />
          <FieldRow>
            <Field label="Assessment Date" value={participant.risk_assessment_date || generatedDate} half />
            <Field label="Review Date" value={participant.risk_review_date || '-'} half />
          </FieldRow>
        </InfoBox>

        {/* Participant details */}
        <Section title="Participant Details" />
        <FieldRow>
          <Field label="Full Name" value={`${participant.first_name} ${participant.last_name}`} half />
          <Field label="NDIS Number" value={participant.ndis_number || '-'} half />
        </FieldRow>
        <FieldRow>
          <Field label="Date of Birth" value={participant.date_of_birth || '-'} half />
          <Field label="Living Situation" value={participant.living_situation || '-'} half />
        </FieldRow>

        {participant.medical_conditions?.length > 0 && (
          <Field label="Medical Conditions" value={participant.medical_conditions.join(', ')} />
        )}
        {participant.allergies?.length > 0 && (
          <Field label="Allergies" value={participant.allergies.join(', ')} />
        )}
        {participant.mobility_needs && (
          <Field label="Mobility Needs" value={participant.mobility_needs} />
        )}
        {participant.communication_needs && (
          <Field label="Communication Needs" value={participant.communication_needs} />
        )}

        {/* Risk assessment sections */}
        {RISK_SECTIONS.map((section) => (
          <View key={section.title}>
            <Section title={section.title} />
            {section.questions.map((q) => {
              const answer = riskAnswers[q.key] || 'Not assessed'
              const isRisk = answer.toLowerCase() === 'yes'
              return (
                <View key={q.key} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                  <Text style={[baseStyles.body, { flex: 1 }]}>{q.label}</Text>
                  <PdfBadge text={answer} variant={isRisk ? 'danger' : 'success'} />
                </View>
              )
            })}
          </View>
        ))}

        <Spacer />
        <Divider />
        <Text style={baseStyles.small}>
          Document generated: {generatedDate} | {org.name}
        </Text>
      </BrandedPage>
    </Document>
  )
}
