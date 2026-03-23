import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoals } from '../hooks/useGoals'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Target, Search } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { GOAL_DOMAINS, GOAL_STATUSES, GOAL_TIMEFRAMES } from '@/lib/constants'

export function GoalsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [timeframeFilter, setTimeframeFilter] = useState('')

  const { data: goals, isLoading } = useGoals({
    status: statusFilter || undefined,
    domain: domainFilter || undefined,
    timeframe: timeframeFilter || undefined,
  })

  const filtered = goals?.filter((g) => {
    if (!search) return true
    const searchable = `${g.participant_name || ''} ${g.title} ${g.description || ''}`.toLowerCase()
    return searchable.includes(search.toLowerCase())
  })

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Goals"
        description={`${goals?.length ?? 0} goals tracked across all participants`}
        action={
          <Button onClick={() => navigate('/goals/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search goals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || '')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {GOAL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={domainFilter} onValueChange={(v) => setDomainFilter(v || '')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {GOAL_DOMAINS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeframeFilter} onValueChange={(v) => setTimeframeFilter(v || '')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Timeframes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timeframes</SelectItem>
                {GOAL_TIMEFRAMES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!filtered?.length ? (
            <EmptyState
              icon={Target}
              title="No goals yet"
              description="Start tracking participant goals and outcomes."
              action={
                <Button onClick={() => navigate('/goals/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create a Goal
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g) => {
                  const domainLabel = GOAL_DOMAINS.find((d) => d.value === g.domain)?.label ?? g.domain
                  return (
                    <TableRow
                      key={g.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/goals/${g.id}`)}
                    >
                      <TableCell className="font-medium max-w-xs truncate">{g.title}</TableCell>
                      <TableCell>{g.participant_name || '-'}</TableCell>
                      <TableCell className="text-sm">{domainLabel}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={g.current_progress} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{g.current_progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={g.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(g.target_date)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
