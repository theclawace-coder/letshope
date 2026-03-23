import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorker, useUpdateWorker, useArchiveWorker, useRestoreWorker } from '../hooks/useWorkers'
import { useWorkerCompliance } from '../hooks/useWorkerCompliance'
import { useBookings } from '../hooks/useBookings'
import { useAuth } from '@/providers/AuthProvider'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ComplianceStatusBadge } from '../components/ComplianceStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Phone, Mail, CheckCircle, XCircle, MinusCircle, Pencil, Archive, RotateCcw, Save, X } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { REGISTRATION_GROUPS } from '@/lib/constants'
import { WORKER_ONBOARDING_STAGES, EMPLOYMENT_TYPES, SCREENING_STATUS_OPTIONS, POLICE_CHECK_STATUS_OPTIONS, WWCC_STATUS_OPTIONS } from '../constants'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface WorkerEditFields {
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  role_title: string
  employment_type: string
  status: string
  ndis_screening_status: string
  ndis_screening_number: string
  ndis_screening_date: string
  police_check_status: string
  police_check_date: string
  police_check_expiry: string
  wwcc_status: string
  wwcc_number: string
  wwcc_expiry: string
  ahpra_number: string
  ahpra_status: string
  ahpra_expiry: string
}

export function WorkerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: worker, isLoading } = useWorker(id)
  const complianceData = useWorkerCompliance(worker ? [worker] : undefined)
  const compliance = complianceData[0]
  const updateWorker = useUpdateWorker()
  const archiveWorker = useArchiveWorker()
  const restoreWorker = useRestoreWorker()

  const [isEditing, setIsEditing] = useState(false)
  const [editFields, setEditFields] = useState<WorkerEditFields>({} as WorkerEditFields)
  const [archiveReason, setArchiveReason] = useState('')

  interface AssignmentRow {
    id: string
    worker_id: string
    participant_id: string
    registration_group: string
    assigned_date: string | null
    is_active: boolean
    participants: { first_name: string; last_name: string } | null
  }

  interface DocumentRow {
    id: string
    name: string
    category: string | null
    created_at: string
  }

  interface WorkflowRow {
    id: string
    status: string
    current_stage: number
  }

  const { data: assignments } = useQuery({
    queryKey: ['worker-assignments', id],
    queryFn: async () => {
      if (!id) return [] as AssignmentRow[]
      const { data, error } = await supabase
        .from('worker_participant_assignments')
        .select('*, participants(first_name, last_name)')
        .eq('worker_id', id)
        .order('assigned_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as AssignmentRow[]
    },
    enabled: !!id,
  })

  const { data: documents } = useQuery({
    queryKey: ['worker-documents', id],
    queryFn: async () => {
      if (!id) return [] as DocumentRow[]
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('worker_id', id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as DocumentRow[]
    },
    enabled: !!id,
  })

  const { data: workflow } = useQuery({
    queryKey: ['worker-workflow', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('type', 'worker_onboarding')
        .eq('reference_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as unknown as WorkflowRow | null
    },
    enabled: !!id,
  })

  const today = new Date().toISOString().split('T')[0]
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const { data: upcomingBookings } = useBookings({
    workerId: id,
    dateFrom: today,
    dateTo: weekFromNow,
  })

  if (isLoading) return <LoadingState />
  if (!worker) return <div>Worker not found</div>

  const isArchived = !!(worker as Record<string, unknown>).archived_at
  const qualifiedGroups = (worker.qualified_registration_groups as string[] | null) || []

  function startEditing() {
    if (!worker) return
    setEditFields({
      first_name: worker.first_name || '',
      last_name: worker.last_name || '',
      email: worker.email || '',
      phone: worker.phone || '',
      date_of_birth: worker.date_of_birth || '',
      role_title: worker.role_title || '',
      employment_type: worker.employment_type || '',
      status: worker.status || '',
      ndis_screening_status: worker.ndis_screening_status || '',
      ndis_screening_number: worker.ndis_screening_number || '',
      ndis_screening_date: worker.ndis_screening_date || '',
      police_check_status: worker.police_check_status || '',
      police_check_date: worker.police_check_date || '',
      police_check_expiry: worker.police_check_expiry || '',
      wwcc_status: worker.wwcc_status || '',
      wwcc_number: worker.wwcc_number || '',
      wwcc_expiry: worker.wwcc_expiry || '',
      ahpra_number: worker.ahpra_number || '',
      ahpra_status: worker.ahpra_status || '',
      ahpra_expiry: worker.ahpra_expiry || '',
    })
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setEditFields({} as WorkerEditFields)
  }

  async function saveChanges() {
    if (!id) return
    const cleaned: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(editFields)) {
      cleaned[key] = value || null
    }
    await updateWorker.mutateAsync({ id, data: cleaned })
    setIsEditing(false)
  }

  async function handleArchive() {
    if (!id || !profile?.id) return
    await archiveWorker.mutateAsync({ id, userId: profile.id, reason: archiveReason || undefined })
    setArchiveReason('')
    navigate('/workers')
  }

  async function handleRestore() {
    if (!id || !profile?.id) return
    await restoreWorker.mutateAsync({ id, userId: profile.id })
  }

  function updateField(field: keyof WorkerEditFields, value: string) {
    setEditFields((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div>
      <PageHeader
        title={`${worker.first_name} ${worker.last_name}`}
        description={worker.role_title || undefined}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/workers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {isArchived ? (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Archive className="h-3.5 w-3.5 mr-1" />
                Archived
              </Badge>
            ) : (
              <StatusBadge status={worker.status} />
            )}
          </div>
        }
      />

      {isArchived && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-900">This worker is archived</p>
            <p className="text-sm text-amber-700">
              Archived {formatDate((worker as Record<string, unknown>).archived_at as string)}
              {(worker as Record<string, unknown>).archive_reason ? (
                <> — {String((worker as Record<string, unknown>).archive_reason)}</>
              ) : null}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRestore} disabled={restoreWorker.isPending}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {restoreWorker.isPending ? 'Restoring...' : 'Restore Worker'}
          </Button>
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Edit / Archive action bar */}
          {!isArchived && (
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={cancelEditing} disabled={updateWorker.isPending}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={saveChanges} disabled={updateWorker.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateWorker.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Dialog>
                    <DialogTrigger render={<Button variant="outline" className="text-red-600 hover:text-red-700" />}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Archive Worker</DialogTitle>
                        <DialogDescription>
                          This will archive {worker.first_name} {worker.last_name} and their future bookings and assignments.
                          Archived workers can be restored at any time. This action is logged for NDIS compliance.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-2">
                        <label className="text-sm font-medium mb-1.5 block">Reason (optional)</label>
                        <Textarea
                          placeholder="e.g. Worker resigned, contract ended..."
                          value={archiveReason}
                          onChange={(e) => setArchiveReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <DialogFooter>
                        <DialogClose render={<Button variant="outline" />}>
                          Cancel
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={handleArchive}
                          disabled={archiveWorker.isPending}
                        >
                          {archiveWorker.isPending ? 'Archiving...' : 'Archive Worker'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={startEditing}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {isEditing ? (
                  <>
                    <EditRow label="First Name">
                      <Input value={editFields.first_name} onChange={(e) => updateField('first_name', e.target.value)} />
                    </EditRow>
                    <EditRow label="Last Name">
                      <Input value={editFields.last_name} onChange={(e) => updateField('last_name', e.target.value)} />
                    </EditRow>
                    <EditRow label="Date of Birth">
                      <Input type="date" value={editFields.date_of_birth} onChange={(e) => updateField('date_of_birth', e.target.value)} />
                    </EditRow>
                    <EditRow label="Employment Type">
                      <Select value={editFields.employment_type} onValueChange={(v) => updateField('employment_type', v ?? '')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </EditRow>
                    <EditRow label="Role">
                      <Input value={editFields.role_title} onChange={(e) => updateField('role_title', e.target.value)} />
                    </EditRow>
                    <EditRow label="Status">
                      <Select value={editFields.status} onValueChange={(v) => updateField('status', v ?? '')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="onboarding">Onboarding</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </EditRow>
                    <EditRow label="Phone">
                      <Input value={editFields.phone} onChange={(e) => updateField('phone', e.target.value)} />
                    </EditRow>
                    <EditRow label="Email">
                      <Input type="email" value={editFields.email} onChange={(e) => updateField('email', e.target.value)} />
                    </EditRow>
                  </>
                ) : (
                  <>
                    <InfoRow label="Date of Birth" value={formatDate(worker.date_of_birth)} />
                    <InfoRow label="Employment Type" value={worker.employment_type} />
                    <InfoRow label="Role" value={worker.role_title} />
                    {worker.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{worker.phone}</span>
                      </div>
                    )}
                    {worker.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{worker.email}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compliance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {isEditing ? (
                  <>
                    <EditRow label="NDIS Screening">
                      <Select value={editFields.ndis_screening_status} onValueChange={(v) => updateField('ndis_screening_status', v ?? '')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SCREENING_STATUS_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </EditRow>
                    <EditRow label="Screening Number">
                      <Input value={editFields.ndis_screening_number} onChange={(e) => updateField('ndis_screening_number', e.target.value)} />
                    </EditRow>
                    <EditRow label="Screening Date">
                      <Input type="date" value={editFields.ndis_screening_date} onChange={(e) => updateField('ndis_screening_date', e.target.value)} />
                    </EditRow>
                    <EditRow label="Police Check">
                      <Select value={editFields.police_check_status} onValueChange={(v) => updateField('police_check_status', v ?? '')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {POLICE_CHECK_STATUS_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </EditRow>
                    <EditRow label="Police Check Date">
                      <Input type="date" value={editFields.police_check_date} onChange={(e) => updateField('police_check_date', e.target.value)} />
                    </EditRow>
                    <EditRow label="Police Check Expiry">
                      <Input type="date" value={editFields.police_check_expiry} onChange={(e) => updateField('police_check_expiry', e.target.value)} />
                    </EditRow>
                    <EditRow label="WWCC Status">
                      <Select value={editFields.wwcc_status} onValueChange={(v) => updateField('wwcc_status', v ?? '')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {WWCC_STATUS_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </EditRow>
                    <EditRow label="WWCC Number">
                      <Input value={editFields.wwcc_number} onChange={(e) => updateField('wwcc_number', e.target.value)} />
                    </EditRow>
                    <EditRow label="WWCC Expiry">
                      <Input type="date" value={editFields.wwcc_expiry} onChange={(e) => updateField('wwcc_expiry', e.target.value)} />
                    </EditRow>
                  </>
                ) : (
                  <>
                    {compliance && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Overall Status</span>
                          <ComplianceStatusBadge status={compliance.overallStatus} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{compliance.completedSteps}/{compliance.totalSteps} steps</span>
                        </div>
                        <Progress value={(compliance.completedSteps / compliance.totalSteps) * 100} />
                      </>
                    )}
                    <InfoRow label="NDIS Screening" value={worker.ndis_screening_status?.replace(/_/g, ' ')} />
                    <InfoRow label="Police Check" value={worker.police_check_status?.replace(/_/g, ' ')} />
                    <InfoRow label="Police Check Expiry" value={formatDate(worker.police_check_expiry)} />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registration Groups</CardTitle>
              </CardHeader>
              <CardContent>
                {qualifiedGroups.length > 0 ? (
                  <div className="space-y-2">
                    {qualifiedGroups.map((code) => (
                      <div key={code} className="flex items-center gap-3 text-sm">
                        <Badge variant="outline" className="font-mono">{code}</Badge>
                        <span>{REGISTRATION_GROUPS[code]?.name || code}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No registration groups assigned</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">AHPRA Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {isEditing ? (
                  <>
                    <EditRow label="AHPRA Number">
                      <Input value={editFields.ahpra_number} onChange={(e) => updateField('ahpra_number', e.target.value)} />
                    </EditRow>
                    <EditRow label="AHPRA Status">
                      <Input value={editFields.ahpra_status} onChange={(e) => updateField('ahpra_status', e.target.value)} />
                    </EditRow>
                    <EditRow label="AHPRA Expiry">
                      <Input type="date" value={editFields.ahpra_expiry} onChange={(e) => updateField('ahpra_expiry', e.target.value)} />
                    </EditRow>
                  </>
                ) : (
                  <>
                    <InfoRow label="AHPRA Number" value={worker.ahpra_number} />
                    <InfoRow label="AHPRA Status" value={worker.ahpra_status} />
                    <InfoRow label="AHPRA Expiry" value={formatDate(worker.ahpra_expiry)} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Worker Onboarding Checklist</CardTitle>
              {workflow && workflow.status === 'in_progress' && (
                <Button size="sm" onClick={() => navigate(`/workers/onboarding/${workflow.id}`)}>
                  Continue Onboarding
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {compliance ? (
                <div className="space-y-3">
                  {WORKER_ONBOARDING_STAGES.map((stage) => {
                    const item = compliance.items[stage.number - 1]
                    return (
                      <div key={stage.number} className="flex items-center gap-3 text-sm">
                        {item?.status === 'green' || item?.status === 'na' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                        ) : item?.status === 'amber' ? (
                          <MinusCircle className="h-5 w-5 text-amber-600 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                        )}
                        <div className="flex-1">
                          <span className="font-medium">{stage.title}</span>
                          <span className="text-muted-foreground ml-2">— {stage.description}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{item?.detail}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No onboarding data available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documents && documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Uploaded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell className="capitalize">{doc.category?.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{formatDate(doc.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No documents uploaded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Participant Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments && assignments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Registration Group</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a) => {
                      const p = a.participants as { first_name: string; last_name: string } | null
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            {p ? `${p.first_name} ${p.last_name}` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">{a.registration_group}</Badge>
                            <span className="ml-2 text-sm">
                              {REGISTRATION_GROUPS[a.registration_group]?.name || ''}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(a.assigned_date)}</TableCell>
                          <TableCell>
                            <Badge variant={a.is_active ? 'default' : 'secondary'}>
                              {a.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No participant assignments yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings && upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">{b.participant_name || 'Unknown Participant'}</p>
                        <p className="text-muted-foreground">
                          {formatDate(b.booking_date)} &middot; {b.start_time} – {b.end_time}
                        </p>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No upcoming bookings this week.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

function EditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground shrink-0 w-36">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}
