import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  usePolicyMaster,
  usePolicyVersions,
  useVersionChunks,
  usePublishDraft,
  useUpdatePolicyMaster,
  type PolicyVersion,
} from '../hooks/usePolicyLibrary'
import { SupersedeDialog } from '../components/SupersedeDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  GitBranch,
  GitMerge,
  Plus,
  CheckCircle,
  Clock,
  FileText,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/AuthProvider'

export function PolicyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'director' || profile?.role === 'admin'

  const { data: master, isLoading: masterLoading } = usePolicyMaster(id)
  const { data: versions, isLoading: versionsLoading } = usePolicyVersions(id)
  const publishDraft = usePublishDraft()
  const updateMaster = useUpdatePolicyMaster()

  const [supersedeOpen, setSupersedeOpen] = useState(false)
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ description: '', review_cycle_months: 12 })

  const currentVersion = versions?.find((v) => v.status === 'current')
  const draftVersion = versions?.find((v) => v.status === 'draft')

  if (masterLoading || versionsLoading) return <LoadingState />
  if (!master) return <div>Policy document not found</div>

  const handleStartEdit = () => {
    setEditForm({
      description: master.description ?? '',
      review_cycle_months: master.review_cycle_months,
    })
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    try {
      await updateMaster.mutateAsync({
        id: master.id,
        description: editForm.description || null,
        review_cycle_months: editForm.review_cycle_months,
      })
      setEditing(false)
      toast.success('Policy details updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  const handlePublishDraft = async () => {
    if (!draftVersion) return
    await publishDraft.mutateAsync({ versionId: draftVersion.id, masterId: master.id })
  }

  return (
    <div>
      <PageHeader
        title={master.title}
        description={master.source}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/policies')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {isAdmin && (
              <Button onClick={() => setSupersedeOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Version
              </Button>
            )}
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Current Version</div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">
                v{currentVersion?.version_number ?? 1}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Category</div>
            <Badge variant="outline" className="capitalize">
              {master.category.replace(/_/g, ' ')}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Effective Date</div>
            <div className="text-sm font-medium">
              {currentVersion?.effective_date
                ? formatDate(currentVersion.effective_date)
                : '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Review Due</div>
            <div className={cn(
              'text-sm font-medium',
              currentVersion?.review_date && new Date(currentVersion.review_date) <= new Date()
                ? 'text-amber-600'
                : '',
            )}>
              {currentVersion?.review_date
                ? formatDate(currentVersion.review_date)
                : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Draft Banner */}
      {draftVersion && isAdmin && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">
                Draft v{draftVersion.version_number} ready for review
              </span>
              {draftVersion.change_summary && (
                <span className="text-xs text-blue-600 ml-2">
                  — {draftVersion.change_summary}
                </span>
              )}
            </div>
            <Button size="sm" onClick={handlePublishDraft} disabled={publishDraft.isPending}>
              {publishDraft.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Publish Draft
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Details</CardTitle>
              {isAdmin && !editing && (
                <Button variant="ghost" size="sm" onClick={handleStartEdit}>
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      placeholder="Brief summary of this policy..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Review Cycle (months)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={editForm.review_cycle_months}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, review_cycle_months: parseInt(e.target.value) || 12 }))
                      }
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSaveEdit} disabled={updateMaster.isPending}>
                      {updateMaster.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-xs text-muted-foreground">Description</div>
                    <div className="text-sm mt-0.5">
                      {master.description || 'No description set'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Review Cycle</div>
                    <div className="text-sm mt-0.5">
                      Every {master.review_cycle_months} month{master.review_cycle_months !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Versions</div>
                    <div className="text-sm mt-0.5">{versions?.length ?? 0}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Version History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GitMerge className="h-4 w-4" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!versions?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No versions recorded yet.
                </p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

                  <div className="space-y-1">
                    {versions.map((v, i) => (
                      <VersionTimelineItem
                        key={v.id}
                        version={v}
                        isLatest={i === 0}
                        expanded={expandedVersion === v.id}
                        onToggle={() =>
                          setExpandedVersion(expandedVersion === v.id ? null : v.id)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Supersede Dialog */}
      <SupersedeDialog
        open={supersedeOpen}
        onOpenChange={setSupersedeOpen}
        masterId={master.id}
        currentVersionNumber={currentVersion?.version_number ?? 1}
      />
    </div>
  )
}

// ─── Timeline Item ────────────────────────────────────────────

function VersionTimelineItem({
  version,
  isLatest,
  expanded,
  onToggle,
}: {
  version: PolicyVersion
  isLatest: boolean
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative pl-9">
      {/* Dot */}
      <div
        className={cn(
          'absolute left-[9px] top-3 h-3 w-3 rounded-full border-2 z-10',
          version.status === 'current'
            ? 'bg-green-500 border-green-300'
            : version.status === 'draft'
              ? 'bg-blue-500 border-blue-300'
              : 'bg-gray-300 border-gray-200',
        )}
      />

      <button
        onClick={onToggle}
        className={cn(
          'w-full text-left rounded-lg p-3 transition-colors',
          expanded ? 'bg-muted' : 'hover:bg-muted/50',
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              v{version.version_number}
            </span>
            <StatusBadge status={version.status} />
            {isLatest && version.status === 'current' && (
              <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                Latest
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {version.effective_date && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(version.effective_date)}
              </span>
            )}
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </div>

        {version.change_summary && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {version.change_summary}
          </p>
        )}
      </button>

      {expanded && <VersionDetails version={version} />}
    </div>
  )
}

// ─── Expanded Version Details ─────────────────────────────────

function VersionDetails({ version }: { version: PolicyVersion }) {
  const { data: chunks, isLoading } = useVersionChunks(version.id)

  return (
    <div className="ml-3 pl-3 border-l-2 border-muted mb-2 space-y-3 py-2">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div>
          <span className="text-muted-foreground">Effective:</span>{' '}
          {version.effective_date ? formatDate(version.effective_date) : '—'}
        </div>
        <div>
          <span className="text-muted-foreground">Review due:</span>{' '}
          {version.review_date ? formatDate(version.review_date) : '—'}
        </div>
        <div>
          <span className="text-muted-foreground">Approved:</span>{' '}
          {version.approved_at ? formatDateTime(version.approved_at) : '—'}
        </div>
        <div>
          <span className="text-muted-foreground">Created:</span>{' '}
          {formatDateTime(version.created_at)}
        </div>
        {version.superseded_at && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Superseded:</span>{' '}
            {formatDateTime(version.superseded_at)}
          </div>
        )}
      </div>

      {version.change_summary && (
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">Change Summary</div>
          <p className="text-sm">{version.change_summary}</p>
        </div>
      )}

      <Separator />

      <div>
        <div className="text-xs text-muted-foreground mb-1">
          Content Chunks ({isLoading ? '...' : chunks?.length ?? 0})
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading chunks...
          </div>
        ) : !chunks?.length ? (
          <p className="text-xs text-muted-foreground py-1">No chunks linked to this version.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {chunks.map((c) => (
              <div
                key={c.id}
                className="text-xs bg-background rounded p-2 border"
              >
                <div className="font-medium mb-0.5">
                  {c.title}{' '}
                  <span className="text-muted-foreground font-normal">
                    (chunk {c.chunk_index})
                  </span>
                </div>
                <div className="text-muted-foreground line-clamp-2">{c.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
