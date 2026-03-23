import { Card, CardContent } from '@/components/ui/card'
import { usePortalAuth, usePortalGoals } from '../hooks/usePortal'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Target } from 'lucide-react'

const DOMAIN_LABELS: Record<string, string> = {
  daily_living: 'Daily Living',
  community_participation: 'Community Participation',
  employment: 'Employment',
  health_wellbeing: 'Health & Wellbeing',
  relationships: 'Relationships',
  lifelong_learning: 'Lifelong Learning',
  choice_control: 'Choice & Control',
  home: 'Home',
}

export function PortalGoalsPage() {
  const { session } = usePortalAuth()
  const goals = usePortalGoals(session?.participantId)

  if (goals.isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6" />
          My Goals
        </h1>
        <p className="text-muted-foreground mt-1">Track your goals and progress across NDIS outcome domains.</p>
      </div>

      {!goals.data || goals.data.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Your support team will set up goals with you as part of your support plan."
        />
      ) : (
        <div className="space-y-4">
          {goals.data.map((goal) => (
            <Card key={goal.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold">{goal.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {DOMAIN_LABELS[goal.domain] ?? goal.domain}
                      </span>
                      <StatusBadge status={goal.status} />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-primary">{goal.current_progress}%</span>
                </div>

                {goal.description && (
                  <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                )}

                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      goal.status === 'achieved' ? 'bg-emerald-500' : 'bg-primary'
                    }`}
                    style={{ width: `${goal.current_progress}%` }}
                  />
                </div>

                {goal.target_date && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Target date: {new Date(goal.target_date).toLocaleDateString('en-AU')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
