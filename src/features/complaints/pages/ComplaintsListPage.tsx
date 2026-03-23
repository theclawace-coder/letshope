import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useComplaints } from '../hooks/useComplaints'
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
import { Plus, MessageSquareWarning, Search, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { COMPLAINT_STATUSES, COMPLAINT_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function ComplaintsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data: complaints, isLoading } = useComplaints({
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
  })

  const filtered = complaints?.filter((c) => {
    if (!search) return true
    const searchable = `${c.participant_name || ''} ${c.complainant_name || ''} ${c.description} ${c.category || ''}`.toLowerCase()
    return searchable.includes(search.toLowerCase())
  })

  const openCount = complaints?.filter((c) => c.status === 'received' || c.status === 'acknowledged').length ?? 0
  const investigatingCount = complaints?.filter((c) => c.status === 'investigating').length ?? 0
  const overdueAckCount = complaints?.filter((c) =>
    !c.acknowledged && c.acknowledge_deadline && new Date(c.acknowledge_deadline) < new Date()
  ).length ?? 0

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Complaints"
        description={`${complaints?.length ?? 0} complaints total`}
        action={
          <Button onClick={() => navigate('/complaints/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Log Complaint
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{openCount}</p>
              </div>
              <MessageSquareWarning className="h-8 w-8 text-red-400" />
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
                <p className="text-sm text-muted-foreground">Overdue Acknowledgment</p>
                <p className="text-2xl font-bold">{overdueAckCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
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
                placeholder="Search complaints..."
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
                {COMPLAINT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || '')}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {COMPLAINT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!filtered?.length ? (
            <EmptyState
              icon={MessageSquareWarning}
              title="No complaints logged"
              description="No complaints have been recorded yet."
              action={
                <Button onClick={() => navigate('/complaints/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log a Complaint
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Complainant</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acknowledged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const ackOverdue = !c.acknowledged && c.acknowledge_deadline && new Date(c.acknowledge_deadline) < new Date()
                  return (
                    <TableRow
                      key={c.id}
                      className={cn('cursor-pointer', ackOverdue && 'border-l-4 border-l-orange-500')}
                      onClick={() => navigate(`/complaints/${c.id}`)}
                    >
                      <TableCell className="whitespace-nowrap">{formatDate(c.complaint_date)}</TableCell>
                      <TableCell className="capitalize">{(c.category ?? '-').replace(/_/g, ' ')}</TableCell>
                      <TableCell>{c.complainant_name || '-'}</TableCell>
                      <TableCell>{c.participant_name || '-'}</TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell>
                        {c.acknowledged ? (
                          <Badge variant="outline" className="text-xs">Yes</Badge>
                        ) : ackOverdue ? (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Pending</span>
                        )}
                      </TableCell>
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
