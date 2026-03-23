import { Document, Text, View } from '@react-pdf/renderer'
import { BrandedPage, Field, FieldRow, Section, Spacer, Divider, InfoBox, PdfBadge } from '../components'
import { baseStyles } from '../styles'
import type { OrgInfo } from '../components'
import type { Tables } from '@/lib/types/database'

interface ComplaintFormProps {
  org: OrgInfo
  complaint: Tables<'complaints'>
  participantName?: string
  generatedDate: string
}

export function ComplaintFormPdf({ org, complaint, participantName, generatedDate }: ComplaintFormProps) {
  const statusLabel = complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)
  const categoryLabel = complaint.category?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '-'

  return (
    <Document>
      <BrandedPage org={org} documentTitle="Complaint Form" documentId={complaint.id.slice(0, 8).toUpperCase()}>
        <Text style={baseStyles.title}>Complaint Form</Text>
        <Text style={baseStyles.subtitle}>Complaints and Feedback Management</Text>

        {/* Status banner */}
        <InfoBox>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[baseStyles.body, baseStyles.bold]}>Complaint Status</Text>
            <PdfBadge
              text={statusLabel}
              variant={complaint.status === 'resolved' || complaint.status === 'closed' ? 'success' : complaint.status === 'investigating' ? 'warning' : 'danger'}
            />
          </View>
        </InfoBox>

        {/* Complaint details */}
        <Section title="Complaint Details" />
        <FieldRow>
          <Field label="Date of Complaint" value={complaint.complaint_date} half />
          <Field label="Category" value={categoryLabel} half />
        </FieldRow>
        <FieldRow>
          <Field label="Complainant Name" value={complaint.complainant_name || '-'} half />
          <Field label="Relationship" value={complaint.complainant_relationship || '-'} half />
        </FieldRow>
        {participantName && <Field label="Participant" value={participantName} />}

        <Section title="Description of Complaint" />
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, marginVertical: 4 }}>
          <Text style={baseStyles.body}>{complaint.description}</Text>
        </View>

        {/* Acknowledgement */}
        <Section title="Acknowledgement" />
        <FieldRow>
          <Field label="Acknowledged" value={complaint.acknowledged ? 'Yes' : 'No'} half />
          <Field label="Acknowledged Date" value={complaint.acknowledged_date || '-'} half />
        </FieldRow>
        <Field label="Acknowledge Deadline" value={complaint.acknowledge_deadline || '-'} />

        {/* Resolution */}
        <Section title="Resolution" />
        <FieldRow>
          <Field label="Resolution Deadline" value={complaint.resolution_deadline || '-'} half />
          <Field label="Resolution Date" value={complaint.resolution_date || '-'} half />
        </FieldRow>
        {complaint.resolution && (
          <>
            <Text style={baseStyles.subheading}>Resolution Details</Text>
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, marginVertical: 4 }}>
              <Text style={baseStyles.body}>{complaint.resolution}</Text>
            </View>
          </>
        )}

        {/* NDIS Commission info */}
        <Spacer />
        <Divider />
        <InfoBox>
          <Text style={[baseStyles.body, baseStyles.bold]}>NDIS Quality and Safeguards Commission</Text>
          <Spacer />
          <Text style={baseStyles.body}>
            If you are not satisfied with how your complaint has been handled, you can contact the NDIS Quality
            and Safeguards Commission:
          </Text>
          <Spacer />
          <Text style={baseStyles.body}>Phone: 1800 035 544 (free call from landlines)</Text>
          <Text style={baseStyles.body}>TTY: 133 677</Text>
          <Text style={baseStyles.body}>National Relay Service: 1300 555 727</Text>
        </InfoBox>

        <Spacer />
        <Text style={baseStyles.small}>
          Document generated: {generatedDate} | Ref: {complaint.id.slice(0, 8).toUpperCase()}
        </Text>
      </BrandedPage>
    </Document>
  )
}
