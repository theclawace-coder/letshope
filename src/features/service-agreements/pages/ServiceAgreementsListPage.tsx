import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServiceAgreements } from '../hooks/useServiceAgreements'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Plus, FileText, Search, Link2 } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { SERVICE_AGREEMENT_STATUSES } from '@/lib/constants'

export function ServiceAgreementsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: agreements, isLoading } = useServiceAgreements({
    status: statusFilter || undefined,
  })

  const filtered = agreements?.filter((sa) => {
    if (!search) return true
    const searchable = `${sa.participant_name || ''} ${sa.plan_number || ''} ${sa.notes || ''}`.toLowerCase()
    return searchable.includes(search.toLowerCase())
  })

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Service Agreements"
        description={`${agreements?.length ?? 0} agreements total`}
        action={
          <Button onClick={() => navigate('/service-agreements/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Agreement
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by participant, plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {SERVICE_AGREEMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!filtered?.length ? (
        <EmptyState
          icon={FileText}
          title="No service agreements"
          description="No service agreements found. Create one to link a participant to their NDIS plan."
          action={
            <Button onClick={() => navigate('/service-agreements/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Agreement
            </Button>
          }
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Linked Plan</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signed</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sa) => (
                <TableRow
                  key={sa.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/service-agreements/${sa.id}`)}
                >
                  <TableCell className="font-medium">{sa.participant_name || '-'}</TableCell>
                  <TableCell>
                    {sa.plan_id ? (
                      <div className="flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">
                          {sa.plan_number || 'Plan'}
                          {sa.plan_start && sa.plan_end && (
                            <span className="text-muted-foreground ml-1">
                              ({formatDate(sa.plan_start)} – {formatDate(sa.plan_end)})
                            </span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">Unlinked</Badge>
                    )}
                  </TableCell>
                  <TableCell>v{sa.version}</TableCell>
                  <TableCell>
                    {sa.start_date
                      ? `${formatDate(sa.start_date)} – ${formatDate(sa.end_date)}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sa.status} />
                  </TableCell>
                  <TableCell>
                    {sa.participant_signed && sa.provider_signed ? (
                      <Badge className="bg-green-100 text-green-800">Both</Badge>
                    ) : sa.participant_signed ? (
                      <Badge variant="outline">Participant</Badge>
                    ) : sa.provider_signed ? (
                      <Badge variant="outline">Provider</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not yet</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(sa.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
