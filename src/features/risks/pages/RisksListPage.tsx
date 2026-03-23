import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRisks } from '../hooks/useRisks'
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
import { Plus, ShieldAlert, Search } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { RISK_CATEGORIES, RISK_STATUSES, RISK_LEVELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function RisksListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')

  const { data: risks, isLoading } = useRisks({
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
    riskLevel: levelFilter || undefined,
  })

  const filtered = risks?.filter((r) => {
    if (!search) return true
    const searchable = `${r.participant_name || ''} ${r.title} ${r.description}`.toLowerCase()
    return searchable.includes(search.toLowerCase())
  })

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Risk Register"
        description={`${risks?.length ?? 0} risks total`}
        action={
          <Button onClick={() => navigate('/risks/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Register Risk
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search risks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? '')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {RISK_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v ?? '')}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {RISK_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? '')}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {RISK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!filtered?.length ? (
            <EmptyState
              icon={ShieldAlert}
              title="No risks registered"
              description="No risks have been recorded yet."
              action={
                <Button onClick={() => navigate('/risks/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Register a Risk
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Review Due</TableHead>
                  <TableHead>Identified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className={cn(
                      'cursor-pointer',
                      r.risk_level === 'critical' && r.status === 'active' && 'border-l-4 border-l-red-500',
                      r.status === 'escalated' && 'border-l-4 border-l-purple-500'
                    )}
                    onClick={() => navigate(`/risks/${r.id}`)}
                  >
                    <TableCell>
                      <StatusBadge status={r.risk_level} />
                    </TableCell>
                    <TableCell className="capitalize">{r.category}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{r.title}</TableCell>
                    <TableCell>{r.participant_name || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.next_review_date ? (
                        <span className={cn(
                          new Date(r.next_review_date) < new Date() && 'text-red-600 font-medium'
                        )}>
                          {formatDate(r.next_review_date)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(r.identified_date)}</TableCell>
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
