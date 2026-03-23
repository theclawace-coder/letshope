import { Document, Text, View } from '@react-pdf/renderer'
import { BrandedPage, Field, FieldRow, Section, Spacer, Divider, WarningBox } from '../components'
import { baseStyles } from '../styles'
import type { OrgInfo } from '../components'
import type { Tables } from '@/lib/types/database'

interface ProgressNotePdfProps {
  org: OrgInfo
  note: Tables<'progress_notes'>
  participantName: string
  workerName: string
  generatedDate: string
}

export function ProgressNotePdf({ org, note, participantName, workerName, generatedDate }: ProgressNotePdfProps) {
  return (
    <Document>
      <BrandedPage org={org} documentTitle="Progress Notes" documentId={note.id.slice(0, 8).toUpperCase()}>
        <Text style={baseStyles.title}>Progress Notes</Text>
        <Text style={baseStyles.subtitle}>{participantName}</Text>

        <Section title="Session Details" />
        <FieldRow>
          <Field label="Participant" value={participantName} half />
          <Field label="Worker" value={workerName} half />
        </FieldRow>
        <FieldRow>
          <Field label="Date" value={note.note_date} half />
          <Field label="Service Type" value={note.service_type || '-'} half />
        </FieldRow>

        {note.goals_addressed?.length > 0 && (
          <>
            <Section title="Goals Addressed" />
            {note.goals_addressed.map((goal, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 3, gap: 6 }}>
                <Text style={[baseStyles.body, baseStyles.bold]}>{i + 1}.</Text>
                <Text style={[baseStyles.body, { flex: 1 }]}>{goal}</Text>
              </View>
            ))}
          </>
        )}

        {note.presentation && (
          <>
            <Section title="Participant Presentation" />
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, marginVertical: 4 }}>
              <Text style={baseStyles.body}>{note.presentation}</Text>
            </View>
          </>
        )}

        <Section title="Notes" />
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, marginVertical: 4 }}>
          <Text style={baseStyles.body}>{note.content}</Text>
        </View>

        {note.actions_taken && (
          <>
            <Section title="Actions Taken" />
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, marginVertical: 4 }}>
              <Text style={baseStyles.body}>{note.actions_taken}</Text>
            </View>
          </>
        )}

        {note.concern_flagged && (
          <WarningBox>
            <Text style={[baseStyles.body, baseStyles.bold]}>Concern Flagged</Text>
            <Text style={baseStyles.body}>
              A concern was flagged during this session. Please refer to the Concerns register for details.
            </Text>
          </WarningBox>
        )}

        <Spacer />
        <Divider />
        <Text style={baseStyles.small}>
          Document generated: {generatedDate} | Ref: {note.id.slice(0, 8).toUpperCase()}
        </Text>
      </BrandedPage>
    </Document>
  )
}
