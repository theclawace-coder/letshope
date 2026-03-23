import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIncidents } from '../hooks/useIncidents'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Plus, AlertTriangle, Search, ShieldAlert } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { INCIDENT_TYPES, INCIDENT_STATUSES, INCIDENT_SEVERITIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function IncidentsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data: incidents, isLoading } = useIncidents({
    severity: severityFilter || undefined,
    status: statusFilter || undefined,
    incidentType: typeFilter || undefined,
  })

  const filtered = incidents?.filter((i) => {
    if (!search) return true
    const searchable = `${i.participant_name || ''} ${i.worker_name || ''} ${i.description} ${i.location || ''}`.toLowerCase()
    return searchable.includes(search.toLowerCase())
  })

  const openCount = incidents?.filter((i) => i.status === 'open').length ?? 0
  const investigatingCount = incidents?.filter((i) => i.status === 'investigating').length ?? 0
  const reportableCount = incidents?.filter((i) => i.is_reportable && !i.reported_to_commission && i.status !== 'closed').length ?? 0
  const criticalCount = incidents?.filter((i) => (i.severity === 'critical' || i.severity === 'major') && i.status !== 'closed').length ?? 0

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Incidents"
        description={`${incidents?.length ?? 0} incidents total`}
        action={
          <Button onClick={() => navigate('/incidents/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Log Incident
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{openCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investigating</p>
                <p className="text-2xl font-bold">{investigatingCount}</p>
              </div>
              <Search className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Report</p>
                <p className="text-2xl font-bold">{reportableCount}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Major / Critical</p>
                <p className="text-2xl font-bold">{criticalCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v || '')}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                {INCIDENT_SEVERITIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || '')}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {INCIDENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || '')}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {INCIDENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!filtered?.length ? (
            <EmptyState
              icon={AlertTriangle}
              title="No incidents logged"
              description="No incidents have been recorded yet."
              action={
                <Button onClick={() => navigate('/incidents/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log an Incident
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reportable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => (
                  <TableRow
                    key={i.id}
                    className={cn(
                      'cursor-pointer',
                      (i.severity === 'critical' || i.severity === 'major') && i.status === 'open' && 'border-l-4 border-l-red-500'
                    )}
                    onClick={() => navigate(`/incidents/${i.id}`)}
                  >
                    <TableCell>
                      <StatusBadge status={i.severity ?? 'minor'} />
                    </TableCell>
                    <TableCell className="capitalize">{(i.incident_type ?? 'other').replace(/_/g, ' ')}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(i.incident_date)}</TableCell>
                    <TableCell>{i.participant_name || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={i.status} />
                    </TableCell>
                    <TableCell>
                      {i.is_reportable ? (
                        <Badge variant={i.reported_to_commission ? 'outline' : 'destructive'} className="text-xs">
                          {i.reported_to_commission ? 'Reported' : 'Pending'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
