import { Document, Text } from '@react-pdf/renderer'
import { BrandedPage, Field, FieldRow, Section, Spacer, Divider, SimpleTable } from '../components'
import { baseStyles } from '../styles'
import type { OrgInfo } from '../components'
import type { Tables } from '@/lib/types/database'
import type { Address, EmergencyContact, Goal } from '@/lib/types'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'

interface IntakeFormPdfProps {
  org: OrgInfo
  participant: Tables<'participants'>
  generatedDate: string
}

export function IntakeFormPdf({ org, participant, generatedDate }: IntakeFormPdfProps) {
  const address = participant.address as Address | null
  const addressStr = address ? `${address.street}, ${address.suburb} ${address.state} ${address.postcode}` : '-'
  const emergencyContacts = (participant.emergency_contacts || []) as unknown as EmergencyContact[]
  const goals = (participant.goals || []) as unknown as Goal[]
  const fundingLabel = participant.funding_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '-'

  return (
    <Document>
      <BrandedPage org={org} documentTitle="Intake Form">
        <Text style={baseStyles.title}>Participant Intake Form</Text>
        <Text style={baseStyles.subtitle}>{participant.first_name} {participant.last_name}</Text>

        {/* Personal details */}
        <Section title="Personal Details" />
        <FieldRow>
          <Field label="First Name" value={participant.first_name} half />
          <Field label="Last Name" value={participant.last_name} half />
        </FieldRow>
        <FieldRow>
          <Field label="Preferred Name" value={participant.preferred_name || '-'} half />
          <Field label="Date of Birth" value={participant.date_of_birth || '-'} half />
        </FieldRow>
        <FieldRow>
          <Field label="Gender" value={participant.gender || '-'} half />
          <Field label="NDIS Number" value={participant.ndis_number || '-'} half />
        </FieldRow>
        <Field label="Address" value={addressStr} />
        <FieldRow>
          <Field label="Phone" value={participant.phone || '-'} half />
          <Field label="Email" value={participant.email || '-'} half />
        </FieldRow>

        {/* Guardian */}
        {participant.has_guardian && (
          <>
            <Section title="Guardian / Nominee" />
            <FieldRow>
              <Field label="Guardian Name" value={participant.guardian_name || '-'} half />
              <Field label="Relationship" value={participant.guardian_relationship || '-'} half />
            </FieldRow>
            <FieldRow>
              <Field label="Phone" value={participant.guardian_phone || '-'} half />
              <Field label="Authority" value={participant.guardian_authority || '-'} half />
            </FieldRow>
          </>
        )}

        {/* NDIS plan */}
        <Section title="NDIS Plan Details" />
        <FieldRow>
          <Field label="Funding Type" value={fundingLabel} half />
          <Field label="Plan Number" value={participant.plan_number || '-'} half />
        </FieldRow>
        <FieldRow>
          <Field label="Plan Start" value={participant.plan_start_date || '-'} half />
          <Field label="Plan End" value={participant.plan_end_date || '-'} half />
        </FieldRow>

        {/* Support team */}
        <Section title="Support Team" />
        <FieldRow>
          <Field label="Support Coordinator" value={participant.support_coordinator_name || '-'} half />
          <Field label="SC Phone" value={participant.support_coordinator_phone || '-'} half />
        </FieldRow>
        <Field label="SC Email" value={participant.support_coordinator_email || '-'} />
        <FieldRow>
          <Field label="LAC" value={participant.lac_name || '-'} half />
          <Field label="LAC Contact" value={participant.lac_contact || '-'} half />
        </FieldRow>

        {/* Medical */}
        <Section title="Medical Information" />
        <FieldRow>
          <Field label="GP Name" value={participant.gp_name || '-'} half />
          <Field label="GP Phone" value={participant.gp_phone || '-'} half />
        </FieldRow>
        <Field label="GP Address" value={participant.gp_address || '-'} />
        <Field label="Medical Conditions" value={participant.medical_conditions?.join(', ') || 'None recorded'} />
        <Field label="Allergies" value={participant.allergies?.join(', ') || 'None recorded'} />

        {/* Communication & needs */}
        <Section title="Communication & Support Needs" />
        <Field label="Communication Needs" value={participant.communication_needs || '-'} />
        <Field label="Cultural Needs" value={participant.cultural_needs || '-'} />
        <Field label="Mobility Needs" value={participant.mobility_needs || '-'} />
        <Field label="Living Situation" value={participant.living_situation || '-'} />

        {/* Services requested */}
        <Section title="Services Requested" />
        {participant.services_requested?.length > 0 ? (
          <SimpleTable
            columns={[
              { key: 'code', header: 'Code', width: '20%' },
              { key: 'service', header: 'Service', width: '80%' },
            ]}
            rows={participant.services_requested.map((code) => ({
              code,
              service: ALL_REGISTRATION_GROUPS[code] || code,
            }))}
          />
        ) : (
          <Text style={baseStyles.body}>No services selected</Text>
        )}

        {/* Emergency contacts */}
        <Section title="Emergency Contacts" />
        {emergencyContacts.length > 0 ? (
          <SimpleTable
            columns={[
              { key: 'name', header: 'Name', width: '30%' },
              { key: 'relationship', header: 'Relationship', width: '25%' },
              { key: 'phone', header: 'Phone', width: '25%' },
              { key: 'guardian', header: 'Guardian', width: '20%' },
            ]}
            rows={emergencyContacts.map((ec) => ({
              name: ec.name,
              relationship: ec.relationship,
              phone: ec.phone,
              guardian: ec.is_guardian ? 'Yes' : 'No',
            }))}
          />
        ) : (
          <Text style={baseStyles.body}>No emergency contacts recorded</Text>
        )}

        {/* Goals */}
        <Section title="Goals" />
        {goals.length > 0 ? (
          <SimpleTable
            columns={[
              { key: 'goal', header: 'Goal', width: '70%' },
              { key: 'priority', header: 'Priority', width: '30%' },
            ]}
            rows={goals.map((g) => ({
              goal: g.goal,
              priority: g.priority.charAt(0).toUpperCase() + g.priority.slice(1),
            }))}
          />
        ) : (
          <Text style={baseStyles.body}>No goals recorded yet</Text>
        )}

        {/* Budget */}
        {(participant.budget_core || participant.budget_capacity_building || participant.budget_capital) && (
          <>
            <Section title="NDIS Plan Budget" />
            <FieldRow>
              <Field label="Core Supports" value={participant.budget_core ? `$${participant.budget_core.toFixed(2)}` : '-'} half />
              <Field label="Capacity Building" value={participant.budget_capacity_building ? `$${participant.budget_capacity_building.toFixed(2)}` : '-'} half />
            </FieldRow>
            <Field label="Capital" value={participant.budget_capital ? `$${participant.budget_capital.toFixed(2)}` : '-'} />
          </>
        )}

        {/* Referral info */}
        <Section title="Referral Information" />
        <FieldRow>
          <Field label="Referral Source" value={participant.referral_source || '-'} half />
          <Field label="Referral Date" value={participant.referral_date || '-'} half />
        </FieldRow>
        <FieldRow>
          <Field label="Urgency" value={participant.urgency || '-'} half />
          <Field label="Status" value={participant.status} half />
        </FieldRow>
        {participant.referral_notes && (
          <Field label="Referral Notes" value={participant.referral_notes} />
        )}

        <Spacer />
        <Divider />
        <Text style={baseStyles.small}>Document generated: {generatedDate} | {org.name}</Text>
      </BrandedPage>
    </Document>
  )
}
