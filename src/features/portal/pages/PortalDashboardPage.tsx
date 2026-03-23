import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  usePortalAuth,
  usePortalBudget,
  usePortalNotes,
  usePortalBookings,
  usePortalServices,
  usePortalGoals,
} from '../hooks/usePortal'
import { BudgetBar } from '../components/BudgetBar'
import { LoadingState } from '@/components/shared/LoadingState'
import { formatDate } from '@/lib/formatters'
import {
  Users,
  Calendar,
  FileText,
  Target,
  ChevronRight,
  Wallet,
  MessageSquareWarning,
} from 'lucide-react'

export function PortalDashboardPage() {
  const { session } = usePortalAuth()
  const navigate = useNavigate()
  const participantId = session?.participantId
  const displayName = session?.participantPreferredName ?? session?.participantFirstName ?? 'there'

  const budget = usePortalBudget(participantId)
  const notes = usePortalNotes(participantId)
  const bookings = usePortalBookings(participantId)
  const services = usePortalServices(participantId)
  const goals = usePortalGoals(participantId)

  if (!session) return null

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your services and supports with Hope Disability Support.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStatCard
          icon={Users}
          label="Active Services"
          value={services.data?.length ?? 0}
          onClick={() => navigate('/portal/bookings')}
        />
        <QuickStatCard
          icon={Target}
          label="Active Goals"
          value={goals.data?.filter((g) => g.status === 'in_progress').length ?? 0}
          onClick={() => navigate('/portal/goals')}
        />
        <QuickStatCard
          icon={Calendar}
          label="Upcoming Bookings"
          value={bookings.data?.length ?? 0}
          onClick={() => navigate('/portal/bookings')}
        />
        <QuickStatCard
          icon={FileText}
          label="Progress Notes"
          value={notes.data?.length ?? 0}
          onClick={() => navigate('/portal/notes')}
        />
      </div>

      {/* Budget Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            My Budget
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/portal/budget')}>
            View details <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {budget.isLoading ? (
            <LoadingState />
          ) : budget.data ? (
            <div className="space-y-4">
              <BudgetBar label="Core Supports" allocated={budget.data.core.allocated} used={budget.data.core.used} colorClass="bg-blue-500" />
              <BudgetBar label="Capacity Building" allocated={budget.data.capacityBuilding.allocated} used={budget.data.capacityBuilding.used} colorClass="bg-emerald-500" />
              <BudgetBar label="Capital" allocated={budget.data.capital.allocated} used={budget.data.capital.used} colorClass="bg-violet-500" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Budget information not available.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            {services.isLoading ? (
              <LoadingState />
            ) : services.data && services.data.length > 0 ? (
              <div className="space-y-3">
                {services.data.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-sm">{s.registration_group}</p>
                      <p className="text-xs text-muted-foreground">{s.worker_name}</p>
                    </div>
                    {s.worker_role && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">{s.worker_role}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active services.</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Bookings
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/portal/bookings')}>
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {bookings.isLoading ? (
              <LoadingState />
            ) : bookings.data && bookings.data.length > 0 ? (
              <div className="space-y-3">
                {bookings.data.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-sm">
                        {formatDate(b.booking_date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.worker_name}
                        {b.service_description ? ` — ${b.service_description}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(b.start_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
            )}
          </CardContent>
        </Card>

        {/* My Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              My Goals
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/portal/goals')}>
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {goals.isLoading ? (
              <LoadingState />
            ) : goals.data && goals.data.length > 0 ? (
              <div className="space-y-3">
                {goals.data.slice(0, 4).map((g) => (
                  <div key={g.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{g.title}</p>
                      <span className="text-xs text-muted-foreground">{g.current_progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${g.current_progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No goals set yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Latest Notes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Latest Progress Notes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/portal/notes')}>
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {notes.isLoading ? (
              <LoadingState />
            ) : notes.data && notes.data.length > 0 ? (
              <div className="space-y-3">
                {notes.data.slice(0, 4).map((n) => (
                  <div key={n.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        {formatDate(n.note_date)}
                      </p>
                      <span className="text-xs text-muted-foreground">{n.worker_name}</span>
                    </div>
                    {n.service_type && (
                      <p className="text-xs text-muted-foreground mt-1">{n.service_type}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No progress notes yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complaint / Feedback CTA */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-3">
            <MessageSquareWarning className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Have feedback or a complaint?</p>
              <p className="text-sm text-muted-foreground">
                We take all feedback seriously. You can also contact the NDIS Commission on 1800 035 544.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/portal/complaint')}>
            Lodge Feedback
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickStatCard({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  onClick: () => void
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
