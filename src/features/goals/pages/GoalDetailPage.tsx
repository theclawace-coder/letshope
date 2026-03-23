import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGoal, useGoalProgress, useUpdateGoal } from '../hooks/useGoals'
import { GoalProgressDialog } from '../components/GoalProgressDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Plus, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { useAuth } from '@/providers/AuthProvider'
import { GOAL_DOMAINS, GOAL_TIMEFRAMES, GOAL_STATUSES, GOAL_STATUS_COLORS } from '@/lib/constants'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function GoalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: goal, isLoading } = useGoal(id)
  const { data: progressEntries } = useGoalProgress(id)
  const updateGoal = useUpdateGoal()
  const { user } = useAuth()
  const [progressOpen, setProgressOpen] = useState(false)

  if (isLoading) return <LoadingState />
  if (!goal) return <div>Goal not found</div>

  const domainLabel = GOAL_DOMAINS.find((d) => d.value === goal.domain)?.label ?? goal.domain
  const timeframeLabel = GOAL_TIMEFRAMES.find((t) => t.value === goal.timeframe)?.label ?? goal.timeframe

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateGoal.mutateAsync({ id: goal.id, status: newStatus })
      toast.success(`Goal marked as ${newStatus.replace(/_/g, ' ')}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const chartData = progressEntries?.map((e) => ({
    date: formatDate(e.progress_date),
    progress: e.progress_percentage,
    notes: e.notes,
  })) ?? []

  return (
    <div>
      <PageHeader
        title={goal.title}
        description={`${goal.participant_name} — ${domainLabel}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/goals')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {user?.id && goal.status !== 'achieved' && goal.status !== 'discontinued' && (
              <Button onClick={() => setProgressOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Progress
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-4">
        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Progress value={goal.current_progress} className="h-4 flex-1" />
              <span className="text-2xl font-bold min-w-[60px] text-right">{goal.current_progress}%</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={goal.status} />
              <Badge variant="outline" className="capitalize">{goal.priority} priority</Badge>
              <Badge variant="outline">{timeframeLabel}</Badge>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Update status:</span>
              <Select value={goal.status} onValueChange={(v) => v && handleStatusChange(v)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      <span className="flex items-center gap-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${GOAL_STATUS_COLORS[s].split(' ')[0]}`} />
                        {s.replace(/_/g, ' ')}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Progress Chart */}
        {chartData.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progress Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis domain={[0, 100]} fontSize={12} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Progress']}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="progress"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goal.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{goal.description}</p>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participant</span>
                <span className="font-medium">{goal.participant_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Domain</span>
                <span className="font-medium">{domainLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium">{formatDate(goal.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Date</span>
                <span className="font-medium">{formatDate(goal.target_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Review Date</span>
                <span className="font-medium">{formatDate(goal.review_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created By</span>
                <span className="font-medium">{goal.created_by_name || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Measurement */}
        {(goal.baseline_measure || goal.target_measure) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outcome Measurement</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {goal.baseline_measure && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Baseline</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">{goal.baseline_measure}</p>
                </div>
              )}
              {goal.target_measure && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Target Outcome</p>
                  <p className="text-sm whitespace-pre-wrap bg-green-50 p-3 rounded-md border border-green-100">{goal.target_measure}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Linked Registration Groups */}
        {goal.linked_registration_groups?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Linked Registration Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {goal.linked_registration_groups.map((code) => (
                  <Badge key={code} variant="outline">
                    {code} - {ALL_REGISTRATION_GROUPS[code] || code}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress History</CardTitle>
          </CardHeader>
          <CardContent>
            {!progressEntries?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No progress entries recorded yet. Click "Record Progress" to add the first entry.
              </p>
            ) : (
              <div className="space-y-3">
                {[...progressEntries].reverse().map((entry) => (
                  <div key={entry.id} className="flex gap-3 p-3 rounded-md border">
                    <div className="flex flex-col items-center">
                      <div className="text-lg font-bold text-primary">{entry.progress_percentage}%</div>
                      <div className="text-xs text-muted-foreground">{formatDate(entry.progress_date)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      {entry.notes && <p className="text-sm">{entry.notes}</p>}
                      {entry.evidence && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Evidence: {entry.evidence}
                        </p>
                      )}
                      {entry.profiles?.full_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Recorded by {entry.profiles.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {user?.id && (
        <GoalProgressDialog
          open={progressOpen}
          onOpenChange={setProgressOpen}
          goalId={goal.id}
          userId={user.id}
          currentProgress={goal.current_progress}
        />
      )}
    </div>
  )
}
