import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useRisk,
  useRiskAssessments,
  useRiskMitigations,
  useRiskReviews,
  useUpdateRiskStatus,
  useUpdateMitigationStatus,
} from '../hooks/useRisks'
import { RiskAssessmentDialog } from '../components/RiskAssessmentDialog'
import { RiskMitigationDialog } from '../components/RiskMitigationDialog'
import { RiskReviewDialog } from '../components/RiskReviewDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Separator available if needed
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  ClipboardCheck,
  Shield,
  Eye,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { RISK_STATUSES, MITIGATION_STATUSES } from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function RiskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: risk, isLoading } = useRisk(id)
  const { data: assessments } = useRiskAssessments(id)
  const { data: mitigations } = useRiskMitigations(id)
  const { data: reviews } = useRiskReviews(id)
  const updateStatus = useUpdateRiskStatus()
  const updateMitigationStatus = useUpdateMitigationStatus()

  const [assessmentOpen, setAssessmentOpen] = useState(false)
  const [mitigationOpen, setMitigationOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)

  if (isLoading) return <LoadingState />
  if (!risk) return <div>Risk not found</div>

  const isActive = risk.status === 'active' || risk.status === 'monitoring' || risk.status === 'escalated'

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return
    try {
      await updateStatus.mutateAsync({ id: risk.id, status: newStatus })
      toast.success(`Risk status updated to ${newStatus.replace(/_/g, ' ')}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleMitigationStatusChange = async (mitigationId: string, newStatus: string) => {
    try {
      await updateMitigationStatus.mutateAsync({
        id: mitigationId,
        status: newStatus,
        riskId: risk.id,
      })
      toast.success('Mitigation status updated')
    } catch {
      toast.error('Failed to update mitigation status')
    }
  }

  return (
    <div>
      <PageHeader
        title={risk.title}
        description={`Risk #${risk.id.slice(0, 8)}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/risks')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {isActive && (
              <>
                <Button variant="outline" onClick={() => setReviewOpen(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </Button>
                <Button variant="outline" onClick={() => setAssessmentOpen(true)}>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Assess
                </Button>
                <Button onClick={() => setMitigationOpen(true)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Add Mitigation
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="space-y-4">
        {/* Risk Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={risk.risk_level} />
              <StatusBadge status={risk.status} />
              <Badge variant="outline" className="capitalize">{risk.category}</Badge>
              {risk.source && (
                <Badge variant="outline" className="capitalize">{risk.source.replace(/_/g, ' ')}</Badge>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participant</span>
                <span className="font-medium">{risk.participant_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Identified By</span>
                <span className="font-medium">{risk.identified_by_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date Identified</span>
                <span className="font-medium">{formatDate(risk.identified_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Review</span>
                <span className={cn(
                  'font-medium',
                  risk.next_review_date && new Date(risk.next_review_date) < new Date() && 'text-red-600'
                )}>
                  {risk.next_review_date ? formatDate(risk.next_review_date) : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Likelihood</span>
                <span className="font-medium capitalize">{risk.likelihood}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Consequence</span>
                <span className="font-medium capitalize">{risk.consequence}</span>
              </div>
            </div>

            {isActive && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Change Status:</span>
                <Select value={risk.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{risk.description}</p>
          </CardContent>
        </Card>

        {/* Context & Controls */}
        {(risk.environment_notes || risk.triggers || risk.existing_controls) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Context & Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {risk.environment_notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Environment Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{risk.environment_notes}</p>
                </div>
              )}
              {risk.triggers && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Triggers</p>
                  <p className="text-sm whitespace-pre-wrap">{risk.triggers}</p>
                </div>
              )}
              {risk.existing_controls && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Existing Controls</p>
                  <p className="text-sm whitespace-pre-wrap">{risk.existing_controls}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mitigation Plans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Mitigation Plans</CardTitle>
            {isActive && (
              <Button variant="outline" size="sm" onClick={() => setMitigationOpen(true)}>
                <Shield className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!mitigations?.length ? (
              <p className="text-sm text-muted-foreground">No mitigation plans yet.</p>
            ) : (
              <div className="space-y-3">
                {mitigations.map((m: Record<string, unknown>) => (
                  <div key={m.id as string} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{m.action as string}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={m.priority as string} />
                        {isActive ? (
                          <Select
                            value={m.status as string}
                            onValueChange={(v) => v && handleMitigationStatusChange(m.id as string, v)}
                          >
                            <SelectTrigger className="w-32 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MITIGATION_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <StatusBadge status={m.status as string} />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {(m as Record<string, unknown>).responsible_person_name ? (
                        <span>Assigned: {String((m as Record<string, unknown>).responsible_person_name)}</span>
                      ) : null}
                      {m.target_date ? <span>Due: {formatDate(m.target_date as string)}</span> : null}
                      {m.completion_date ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Completed: {formatDate(m.completion_date as string)}
                        </span>
                      ) : null}
                    </div>
                    {m.completion_notes ? (
                      <p className="text-xs text-muted-foreground">{String(m.completion_notes)}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Assessment History</CardTitle>
            {isActive && (
              <Button variant="outline" size="sm" onClick={() => setAssessmentOpen(true)}>
                <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                New Assessment
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!assessments?.length ? (
              <p className="text-sm text-muted-foreground">No assessments recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {assessments.map((a: Record<string, unknown>) => (
                  <div key={a.id as string} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={a.calculated_level as string} />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(a.assessment_date as string)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {(a.likelihood as string)?.replace(/_/g, ' ')} x {a.consequence as string}
                      </span>
                    </div>
                    {a.overall_score ? (
                      <p className="text-xs text-muted-foreground">
                        Scores: Env {String(a.environmental_score ?? '-')} | Health {String(a.health_score ?? '-')} | Behav {String(a.behavioral_score ?? '-')} = {String(a.overall_score)}/30
                      </p>
                    ) : null}
                    <p className="text-sm whitespace-pre-wrap">{String(a.findings)}</p>
                    {a.recommendations ? (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Recommendations:</span> {String(a.recommendations)}
                      </p>
                    ) : null}
                    {(a as Record<string, unknown>).assessed_by_name ? (
                      <p className="text-xs text-muted-foreground">
                        Assessed by: {String((a as Record<string, unknown>).assessed_by_name)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Review History</CardTitle>
            {isActive && (
              <Button variant="outline" size="sm" onClick={() => setReviewOpen(true)}>
                <Eye className="h-3.5 w-3.5 mr-1" />
                New Review
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!reviews?.length ? (
              <p className="text-sm text-muted-foreground">No reviews recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev: Record<string, unknown>) => (
                  <div key={rev.id as string} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {rev.previous_level && rev.previous_level !== rev.new_level ? (
                          <>
                            <StatusBadge status={rev.previous_level as string} />
                            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                            <StatusBadge status={rev.new_level as string} />
                          </>
                        ) : (
                          <StatusBadge status={rev.new_level as string} />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(rev.review_date as string)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{String(rev.findings)}</p>
                    {rev.actions_taken ? (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Actions Taken:</span> {String(rev.actions_taken)}
                      </p>
                    ) : null}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {(rev as Record<string, unknown>).reviewed_by_name ? (
                        <span>Reviewed by: {String((rev as Record<string, unknown>).reviewed_by_name)}</span>
                      ) : null}
                      {rev.next_review_date ? (
                        <span>Next review: {formatDate(rev.next_review_date as string)}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <RiskAssessmentDialog
        open={assessmentOpen}
        onOpenChange={setAssessmentOpen}
        riskId={risk.id}
      />
      <RiskMitigationDialog
        open={mitigationOpen}
        onOpenChange={setMitigationOpen}
        riskId={risk.id}
      />
      <RiskReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        riskId={risk.id}
        currentLevel={risk.risk_level}
      />
    </div>
  )
}
