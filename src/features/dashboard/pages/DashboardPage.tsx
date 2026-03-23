import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, Calendar, AlertTriangle, Clock, TrendingUp, ShieldCheck, Flag, FileText, Bot, ClipboardList, Target } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

function useStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      const [participants, activeParticipants, workers, workflows, bookingsThisWeek, openConcerns, criticalConcerns, openIncidents, openComplaints, activeGoals, achievedGoals] = await Promise.all([
        supabase.from('participants').select('id', { count: 'exact', head: true }),
        supabase.from('participants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('workers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('workflows').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('booking_date', today).lte('booking_date', weekEnd).eq('status', 'scheduled'),
        supabase.from('concerns').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('concerns').select('id, title, severity, participants(first_name, last_name)').eq('severity', 'critical').eq('status', 'open').order('created_at', { ascending: false }).limit(5),
        supabase.from('incidents').select('id', { count: 'exact', head: true }).in('status', ['open', 'investigating']),
        supabase.from('complaints').select('id', { count: 'exact', head: true }).in('status', ['received', 'acknowledged', 'investigating']),
        supabase.from('goals').select('id', { count: 'exact', head: true }).in('status', ['not_started', 'in_progress']),
        supabase.from('goals').select('id', { count: 'exact', head: true }).eq('status', 'achieved'),
      ])
      return {
        totalParticipants: participants.count ?? 0,
        activeParticipants: activeParticipants.count ?? 0,
        activeWorkers: workers.count ?? 0,
        activeWorkflows: workflows.count ?? 0,
        bookingsThisWeek: bookingsThisWeek.count ?? 0,
        openConcerns: openConcerns.count ?? 0,
        criticalConcerns: (criticalConcerns.data ?? []) as Array<{ id: string; title: string; severity: string; participants: { first_name: string; last_name: string } | null }>,
        openIncidents: openIncidents.count ?? 0,
        openComplaints: openComplaints.count ?? 0,
        activeGoals: activeGoals.count ?? 0,
        achievedGoals: achievedGoals.count ?? 0,
      }
    },
  })
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: stats } = useStats()
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div>
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
        description="Here's what's happening with Hope Disability Support today."
        action={
          <Button onClick={() => navigate('/onboarding/new')}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Participant
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Participants
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalParticipants ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.activeParticipants ?? 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Workers
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeWorkers ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">contractors & staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeWorkflows ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">active workflows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bookingsThisWeek ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">bookings this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Concerns
            </CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openConcerns ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.criticalConcerns?.length ?? 0} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Incidents
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openIncidents ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Complaints
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openComplaints ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">pending resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Goals
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeGoals ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.achievedGoals ?? 0} achieved
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/onboarding/new')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Start New Participant Onboarding
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/participants')}>
              <Users className="h-4 w-4 mr-2" />
              View All Participants
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/workers/onboarding/new')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Start New Worker Onboarding
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/calendar')}>
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/compliance')}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Screening Compliance
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/progress-notes/new')}>
              <FileText className="h-4 w-4 mr-2" />
              Write Progress Note
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/goals/new')}>
              <Target className="h-4 w-4 mr-2" />
              Set a Goal
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/concerns/new')}>
              <Flag className="h-4 w-4 mr-2" />
              Flag a Concern
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/incidents/new')}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Log an Incident
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/complaints/new')}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Log a Complaint
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/ai-buddy')}>
              <Bot className="h-4 w-4 mr-2" />
              Ask AI Buddy
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/audit')}>
              <ClipboardList className="h-4 w-4 mr-2" />
              View Audit Trail
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alerts & Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.criticalConcerns && stats.criticalConcerns.length > 0 ? (
              <div className="space-y-3">
                {stats.criticalConcerns.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 p-2 rounded-md bg-red-50 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                    onClick={() => navigate(`/concerns/${c.id}`)}
                  >
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-red-900">{c.title}</p>
                      <p className="text-red-700 text-xs">
                        {c.participants ? `${c.participants.first_name} ${c.participants.last_name}` : 'Unknown'}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="link" className="w-full text-sm" onClick={() => navigate('/concerns')}>
                  View all concerns
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                No alerts at this time. You're all caught up!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
