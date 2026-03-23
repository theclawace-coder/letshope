import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConcerns } from '../hooks/useConcerns'
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
import { Plus, Flag, Search } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { CONCERN_TYPES, CONCERN_STATUSES, CONCERN_SEVERITIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function ConcernsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data: concerns, isLoading } = useConcerns({
    severity: severityFilter || undefined,
    status: statusFilter || undefined,
    concernType: typeFilter || undefined,
  })

  const filtered = concerns?.filter((c) => {
    if (!search) return true
    const searchable = `${c.participant_name || ''} ${c.title} ${c.description}`.toLowerCase()
    return searchable.includes(search.toLowerCase())
  })

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Concerns"
        description={`${concerns?.length ?? 0} concerns total`}
        action={
          <Button onClick={() => navigate('/concerns/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Flag Concern
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search concerns..."
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
                {CONCERN_SEVERITIES.map((s) => (
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
                {CONCERN_STATUSES.map((s) => (
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
                {CONCERN_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!filtered?.length ? (
            <EmptyState
              icon={Flag}
              title="No concerns flagged"
              description="No concerns have been recorded yet."
              action={
                <Button onClick={() => navigate('/concerns/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Flag a Concern
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Raised</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className={cn(
                      'cursor-pointer',
                      c.severity === 'critical' && c.status === 'open' && 'border-l-4 border-l-red-500'
                    )}
                    onClick={() => navigate(`/concerns/${c.id}`)}
                  >
                    <TableCell>
                      <StatusBadge status={c.severity} />
                    </TableCell>
                    <TableCell className="capitalize">{c.concern_type}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{c.title}</TableCell>
                    <TableCell>{c.participant_name || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(c.created_at)}</TableCell>
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
