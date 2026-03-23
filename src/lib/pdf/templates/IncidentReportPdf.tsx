import { Document, Text, View } from '@react-pdf/renderer'
import { BrandedPage, Field, FieldRow, Section, Spacer, Divider, InfoBox, WarningBox, PdfBadge } from '../components'
import { baseStyles } from '../styles'
import type { OrgInfo } from '../components'
import type { Tables } from '@/lib/types/database'

interface IncidentReportProps {
  org: OrgInfo
  incident: Tables<'incidents'>
  participantName?: string
  workerName?: string
  generatedDate: string
}

export function IncidentReportPdf({ org, incident, participantName, workerName, generatedDate }: IncidentReportProps) {
  const severityVariant = incident.severity === 'critical' || incident.severity === 'major' ? 'danger'
    : incident.severity === 'moderate' ? 'warning' : 'primary'
  const typeLabel = incident.incident_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '-'
  const severityLabel = incident.severity ? incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1) : '-'
  const statusLabel = incident.status.charAt(0).toUpperCase() + incident.status.slice(1)
  const corrective = incident.corrective_actions as string[] | null

  return (
    <Document>
      <BrandedPage org={org} documentTitle="Incident Report" documentId={incident.id.slice(0, 8).toUpperCase()}>
        <Text style={baseStyles.title}>Incident Report</Text>
        <Text style={baseStyles.subtitle}>Incident Management</Text>

        {/* Reportable banner */}
        {incident.is_reportable && (
          <WarningBox>
            <Text style={[baseStyles.body, baseStyles.bold]}>NDIS REPORTABLE INCIDENT</Text>
            <Text style={baseStyles.body}>
              This incident has been identified as reportable to the NDIS Quality and Safeguards Commission.
              {incident.report_deadline ? ` Report deadline: ${incident.report_deadline}` : ''}
            </Text>
            <Text style={baseStyles.body}>
              Reported to Commission: {incident.reported_to_commission ? 'Yes' : 'Pending'}
            </Text>
          </WarningBox>
        )}

        {/* Status */}
        <InfoBox>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Text style={[baseStyles.body, baseStyles.bold]}>Status:</Text>
              <PdfBadge text={statusLabel} variant={incident.status === 'resolved' || incident.status === 'closed' ? 'success' : 'warning'} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Text style={[baseStyles.body, baseStyles.bold]}>Severity:</Text>
              <PdfBadge text={severityLabel} variant={severityVariant} />
            </View>
          </View>
        </InfoBox>

        {/* Incident details */}
        <Section title="Incident Details" />
        <FieldRow>
          <Field label="Incident Date" value={incident.incident_date} half />
          <Field label="Incident Time" value={incident.incident_time || '-'} half />
        </FieldRow>
        <FieldRow>
          <Field label="Incident Type" value={typeLabel} half />
          <Field label="Location" value={incident.location || '-'} half />
        </FieldRow>
        {participantName && <Field label="Participant" value={participantName} />}
        {workerName && <Field label="Worker Involved" value={workerName} />}

        <Section title="Description of Incident" />
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, marginVertical: 4 }}>
          <Text style={baseStyles.body}>{incident.description}</Text>
        </View>

        {/* Investigation */}
        {incident.investigation_notes && (
          <>
            <Section title="Investigation Notes" />
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, marginVertical: 4 }}>
              <Text style={baseStyles.body}>{incident.investigation_notes}</Text>
            </View>
          </>
        )}

        {/* Corrective actions */}
        {corrective && corrective.length > 0 && (
          <>
            <Section title="Corrective Actions" />
            {corrective.map((action, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 4, gap: 6 }}>
                <Text style={[baseStyles.body, baseStyles.bold]}>{i + 1}.</Text>
                <Text style={[baseStyles.body, { flex: 1 }]}>{action}</Text>
              </View>
            ))}
          </>
        )}

        {/* NDIS reporting */}
        {incident.is_reportable && (
          <>
            <Section title="NDIS Commission Reporting" />
            <FieldRow>
              <Field label="Reportable Incident" value="Yes" half />
              <Field label="Reported to Commission" value={incident.reported_to_commission ? 'Yes' : 'No'} half />
            </FieldRow>
            <Field label="Report Deadline" value={incident.report_deadline || '-'} />
            <Spacer />
            <InfoBox>
              <Text style={baseStyles.body}>
                NDIS Quality and Safeguards Commission: 1800 035 544
              </Text>
            </InfoBox>
          </>
        )}

        <Spacer />
        <Divider />
        <Text style={baseStyles.small}>
          Document generated: {generatedDate} | Ref: {incident.id.slice(0, 8).toUpperCase()} | Logged by: {incident.logged_by || '-'}
        </Text>
      </BrandedPage>
    </Document>
  )
}
