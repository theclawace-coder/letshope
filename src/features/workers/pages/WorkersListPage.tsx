import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkers } from '../hooks/useWorkers'
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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { UserPlus, Users, Search, ShieldCheck, ShieldAlert, ShieldX, Archive } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { WORKER_STATUSES } from '@/lib/constants'
import { EMPLOYMENT_TYPES } from '../constants'

function ScreeningIcon({ status }: { status: string | null }) {
  if (status === 'cleared') return <ShieldCheck className="h-4 w-4 text-green-600" />
  if (status === 'barred') return <ShieldX className="h-4 w-4 text-red-600" />
  return <ShieldAlert className="h-4 w-4 text-amber-600" />
}

export function WorkersListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const { data: workers, isLoading } = useWorkers(statusFilter || undefined, showArchived)

  const filtered = workers?.filter((w) => {
    if (typeFilter && typeFilter !== 'all' && w.employment_type !== typeFilter) return false
    if (!search) return true
    const name = `${w.first_name} ${w.last_name} ${w.email || ''}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Workers"
        description={`${workers?.length ?? 0} workers${showArchived ? ' (archived)' : ' total'}`}
        action={
          <Button onClick={() => navigate('/workers/onboarding/new')}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Worker
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
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
                {WORKER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || '')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 ml-2">
              <Switch
                id="show-archived-workers"
                checked={showArchived}
                onCheckedChange={setShowArchived}
                size="sm"
              />
              <Label htmlFor="show-archived-workers" className="text-sm text-muted-foreground whitespace-nowrap cursor-pointer">
                <Archive className="h-3.5 w-3.5 inline mr-1" />
                Archived
              </Label>
            </div>
          </div>

          {!filtered?.length ? (
            <EmptyState
              icon={showArchived ? Archive : Users}
              title={showArchived ? 'No archived workers' : 'No workers yet'}
              description={
                showArchived
                  ? 'No workers have been archived.'
                  : 'Get started by onboarding your first worker.'
              }
              action={
                !showArchived ? (
                  <Button onClick={() => navigate('/workers/onboarding/new')}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Start Worker Onboarding
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>NDIS Screening</TableHead>
                  <TableHead>Police Check Expiry</TableHead>
                  <TableHead>{showArchived ? 'Archived' : 'Created'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => (
                  <TableRow
                    key={w.id}
                    className={`cursor-pointer ${showArchived ? 'opacity-70' : ''}`}
                    onClick={() => navigate(`/workers/${w.id}`)}
                  >
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {w.first_name} {w.last_name}
                        {showArchived && (
                          <Badge variant="secondary" className="text-xs">
                            <Archive className="h-3 w-3 mr-1" />
                            Archived
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{w.role_title || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={w.status} />
                    </TableCell>
                    <TableCell className="capitalize">
                      {w.employment_type || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <ScreeningIcon status={w.ndis_screening_status} />
                        <span className="text-sm capitalize">
                          {w.ndis_screening_status?.replace(/_/g, ' ') || 'Not started'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(w.police_check_expiry)}</TableCell>
                    <TableCell>
                      {showArchived
                        ? formatDate((w as Record<string, unknown>).archived_at as string)
                        : formatDate(w.created_at)}
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
