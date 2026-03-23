import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParticipants } from '../hooks/useParticipants'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
import { UserPlus, Users, Search, Archive } from 'lucide-react'
import { formatDate, formatFullName } from '@/lib/formatters'
import { PARTICIPANT_STATUSES } from '@/lib/constants'

export function ParticipantsListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const { data: participants, isLoading } = useParticipants(statusFilter || undefined, showArchived)

  const filtered = participants?.filter((p) => {
    if (!search) return true
    const name = `${p.first_name} ${p.last_name} ${p.preferred_name || ''}`.toLowerCase()
    const ndis = p.ndis_number || ''
    return name.includes(search.toLowerCase()) || ndis.includes(search)
  })

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Participants"
        description={`${participants?.length ?? 0} participants${showArchived ? ' (archived)' : ''}`}
        action={
          <Button onClick={() => navigate('/onboarding/new')}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Participant
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or NDIS number..."
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
                {PARTICIPANT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 ml-2">
              <Switch
                id="show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
                size="sm"
              />
              <Label htmlFor="show-archived" className="text-sm text-muted-foreground whitespace-nowrap cursor-pointer">
                <Archive className="h-3.5 w-3.5 inline mr-1" />
                Archived
              </Label>
            </div>
          </div>

          {!filtered?.length ? (
            <EmptyState
              icon={showArchived ? Archive : Users}
              title={showArchived ? 'No archived participants' : 'No participants yet'}
              description={
                showArchived
                  ? 'No participants have been archived.'
                  : 'Get started by onboarding your first participant.'
              }
              action={
                !showArchived ? (
                  <Button onClick={() => navigate('/onboarding/new')}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Start Onboarding
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>NDIS Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Funding</TableHead>
                  <TableHead>Plan End</TableHead>
                  <TableHead>{showArchived ? 'Archived' : 'Referral Date'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow
                    key={p.id}
                    className={`cursor-pointer ${showArchived ? 'opacity-70' : ''}`}
                    onClick={() => navigate(`/participants/${p.id}`)}
                  >
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {formatFullName(p.first_name, p.last_name, p.preferred_name)}
                        {showArchived && (
                          <Badge variant="secondary" className="text-xs">
                            <Archive className="h-3 w-3 mr-1" />
                            Archived
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {p.ndis_number || '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="capitalize">
                      {p.funding_type?.replace(/_/g, ' ') || '-'}
                    </TableCell>
                    <TableCell>{formatDate(p.plan_end_date)}</TableCell>
                    <TableCell>
                      {showArchived
                        ? formatDate((p as Record<string, unknown>).archived_at as string)
                        : formatDate(p.referral_date)}
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
