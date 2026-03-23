import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useParticipant, useUpdateParticipant } from '../hooks/useParticipants'
import { useArchiveRecord, useRestoreRecord } from '@/hooks/useArchive'
import { useAuth } from '@/providers/AuthProvider'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft, Phone, Mail, MapPin, Stethoscope, Shield, Plus, FileText,
  Flag, Globe, Pencil, Archive, ArchiveRestore, AlertTriangle,
} from 'lucide-react'
import { formatDate, formatFullName, formatCurrency } from '@/lib/formatters'
import { REGISTRATION_GROUPS } from '@/lib/constants'
import type { Address, EmergencyContact, Goal } from '@/lib/types'
import { useParticipantProgressNotes } from '@/features/progress-notes/hooks/useProgressNotes'
import { useParticipantConcerns } from '@/features/concerns/hooks/useConcerns'
import { ProgressNoteCard } from '@/features/progress-notes/components/ProgressNoteCard'
import { ConcernCard } from '@/features/concerns/components/ConcernCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ParticipantDocumentsTab } from '@/features/documents/components/ParticipantDocumentsTab'
import { PortalAccessManager } from '@/features/portal/components/PortalAccessManager'
import { ParticipantPlansTab } from '@/features/service-agreements/components/ParticipantPlansTab'
import { ParticipantEditForm } from '../components/ParticipantEditForm'
import { toast } from 'sonner'

export function ParticipantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: participant, isLoading } = useParticipant(id)
  const { data: progressNotes } = useParticipantProgressNotes(id)
  const { data: concerns } = useParticipantConcerns(id)
  const updateParticipant = useUpdateParticipant()
  const archiveRecord = useArchiveRecord()
  const restoreRecord = useRestoreRecord()

  const [isEditing, setIsEditing] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [archiveReason, setArchiveReason] = useState('')

  if (isLoading) return <LoadingState />
  if (!participant) return <div>Participant not found</div>

  const isArchived = !!(participant as Record<string, unknown>).archived_at
  const openConcernsCount = concerns?.filter((c) => c.status === 'open').length ?? 0

  const address = participant.address as Address | null
  const emergencyContacts = (participant.emergency_contacts || []) as unknown as EmergencyContact[]
  const goals = (participant.goals || []) as unknown as Goal[]

  function handleSave(data: Record<string, unknown>) {
    if (!id || !user) return
    updateParticipant.mutate(
      { id, data },
      {
        onSuccess: () => {
          setIsEditing(false)
          toast.success('Participant updated successfully')
        },
        onError: (err) => {
          toast.error(`Failed to update: ${err.message}`)
        },
      }
    )
  }

  function handleArchive() {
    if (!id) return
    archiveRecord.mutate(
      { table: 'participants', id, reason: archiveReason || undefined, cascade: true },
      {
        onSuccess: () => {
          setShowArchiveDialog(false)
          setArchiveReason('')
          toast.success('Participant archived')
          navigate('/participants')
        },
        onError: (err) => {
          toast.error(`Failed to archive: ${err.message}`)
        },
      }
    )
  }

  function handleRestore() {
    if (!id) return
    restoreRecord.mutate(
      { table: 'participants', id },
      {
        onSuccess: () => {
          toast.success('Participant restored')
        },
        onError: (err) => {
          toast.error(`Failed to restore: ${err.message}`)
        },
      }
    )
  }

  // Edit mode — show the edit form
  if (isEditing) {
    return (
      <div>
        <PageHeader
          title={`Edit: ${formatFullName(participant.first_name, participant.last_name, participant.preferred_name)}`}
          description={participant.ndis_number ? `NDIS: ${participant.ndis_number}` : undefined}
        />
        <ParticipantEditForm
          participant={participant}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isSaving={updateParticipant.isPending}
        />
      </div>
    )
  }

  // View mode
  return (
    <div>
      <PageHeader
        title={formatFullName(participant.first_name, participant.last_name, participant.preferred_name)}
        description={participant.ndis_number ? `NDIS: ${participant.ndis_number}` : undefined}
        action={
          <div className="flex gap-2 items-center">
            <Button variant="outline" onClick={() => navigate('/participants')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {isArchived ? (
              <Button
                variant="outline"
                onClick={handleRestore}
                disabled={restoreRecord.isPending}
              >
                <ArchiveRestore className="h-4 w-4 mr-2" />
                {restoreRecord.isPending ? 'Restoring...' : 'Restore'}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowArchiveDialog(true)}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </>
            )}

            <StatusBadge status={participant.status} />
            {isArchived && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <Archive className="h-3 w-3 mr-1" />
                Archived
              </Badge>
            )}
          </div>
        }
      />

      {isArchived && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            This participant was archived on{' '}
            <strong>{formatDate((participant as Record<string, unknown>).archived_at as string)}</strong>.
            {(participant as Record<string, unknown>).archive_reason && (
              <> Reason: {(participant as Record<string, unknown>).archive_reason as string}</>
            )}
          </span>
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="concerns" className="relative">
            Concerns
            {openConcernsCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 min-w-5 px-1 text-xs">
                {openConcernsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-1">
            Plans & Agreements
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="portal" className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" />
            Portal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Date of Birth" value={formatDate(participant.date_of_birth)} />
                <InfoRow label="Gender" value={participant.gender} />
                <InfoRow label="Funding Type" value={participant.funding_type?.replace(/_/g, ' ')} />
                <InfoRow label="Plan Start" value={formatDate(participant.plan_start_date)} />
                <InfoRow label="Plan End" value={formatDate(participant.plan_end_date)} />
                {participant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{participant.phone}</span>
                  </div>
                )}
                {participant.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{participant.email}</span>
                  </div>
                )}
                {address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{`${address.street}, ${address.suburb} ${address.state} ${address.postcode}`}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Support Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Support Coordinator" value={participant.support_coordinator_name} />
                <InfoRow label="SC Phone" value={participant.support_coordinator_phone} />
                <InfoRow label="LAC" value={participant.lac_name} />
                {participant.has_guardian && (
                  <>
                    <InfoRow label="Guardian" value={participant.guardian_name} />
                    <InfoRow label="Relationship" value={participant.guardian_relationship} />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                {emergencyContacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No emergency contacts recorded</p>
                ) : (
                  <div className="space-y-3">
                    {emergencyContacts.map((ec, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium">{ec.name} ({ec.relationship})</p>
                        <p className="text-muted-foreground">{ec.phone}</p>
                        {ec.is_guardian && <Badge variant="secondary" className="mt-1">Guardian</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Goals</CardTitle>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No goals recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {goals.map((g, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="capitalize shrink-0">{g.priority}</Badge>
                        <span>{g.goal}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" /> GP Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow label="GP Name" value={participant.gp_name} />
                <InfoRow label="GP Phone" value={participant.gp_phone} />
                <InfoRow label="GP Address" value={participant.gp_address} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Medical Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                {participant.medical_conditions?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {participant.medical_conditions.map((c, i) => (
                      <Badge key={i} variant="secondary">{c}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None recorded</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Allergies</CardTitle>
              </CardHeader>
              <CardContent>
                {participant.allergies?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {participant.allergies.map((a, i) => (
                      <Badge key={i} variant="destructive">{a}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None recorded</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow label="Risk Level" value={participant.risk_level} />
                <InfoRow label="Assessment Date" value={formatDate(participant.risk_assessment_date)} />
                <InfoRow label="Review Date" value={formatDate(participant.risk_review_date)} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registered Services</CardTitle>
            </CardHeader>
            <CardContent>
              {participant.services_requested?.length ? (
                <div className="space-y-2">
                  {participant.services_requested.map((code) => (
                    <div key={code} className="flex items-center gap-3 text-sm">
                      <Badge variant="outline" className="font-mono">{code}</Badge>
                      <span>{REGISTRATION_GROUPS[code]?.name || code}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No services selected</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => navigate(`/progress-notes/new?participantId=${id}`)} disabled={isArchived}>
              <Plus className="h-4 w-4 mr-2" />
              Add Progress Note
            </Button>
          </div>
          {!progressNotes?.length ? (
            <EmptyState
              icon={FileText}
              title="No progress notes"
              description="No progress notes have been recorded for this participant yet."
              action={
                !isArchived ? (
                  <Button onClick={() => navigate(`/progress-notes/new?participantId=${id}`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Write First Note
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {progressNotes.map((note) => (
                <ProgressNoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="concerns" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => navigate(`/concerns/new?participantId=${id}`)} disabled={isArchived}>
              <Plus className="h-4 w-4 mr-2" />
              Flag Concern
            </Button>
          </div>
          {!concerns?.length ? (
            <EmptyState
              icon={Flag}
              title="No concerns"
              description="No concerns have been flagged for this participant."
            />
          ) : (
            <div className="space-y-3">
              {concerns.map((concern) => (
                <ConcernCard
                  key={concern.id}
                  concern={concern}
                  onClick={() => navigate(`/concerns/${concern.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <ParticipantPlansTab participantId={participant.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <ParticipantDocumentsTab participant={participant} />
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <BudgetCard label="Core Supports" amount={participant.budget_core} />
            <BudgetCard label="Capacity Building" amount={participant.budget_capacity_building} />
            <BudgetCard label="Capital" amount={participant.budget_capital} />
          </div>
        </TabsContent>

        <TabsContent value="portal" className="mt-4">
          <PortalAccessManager
            participantId={participant.id}
            participantName={formatFullName(participant.first_name, participant.last_name, participant.preferred_name)}
          />
        </TabsContent>
      </Tabs>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive Participant</DialogTitle>
            <DialogDescription>
              This will archive{' '}
              <strong>{formatFullName(participant.first_name, participant.last_name, participant.preferred_name)}</strong>{' '}
              and cascade to their future bookings, draft service agreements, and worker assignments.
              Archived participants can be restored at any time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm">Reason (optional)</Label>
            <Input
              placeholder="e.g., Participant exited services"
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={archiveRecord.isPending}
            >
              <Archive className="h-4 w-4 mr-2" />
              {archiveRecord.isPending ? 'Archiving...' : 'Archive Participant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value || '-'}</span>
    </div>
  )
}

function BudgetCard({ label, amount }: { label: string; amount: number | null }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
      </CardContent>
    </Card>
  )
}
