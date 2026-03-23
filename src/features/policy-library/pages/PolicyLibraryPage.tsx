import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePolicyMasters } from '../hooks/usePolicyLibrary'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
import { Search, FileText, GitBranch, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'

const CATEGORY_OPTIONS = [
  { value: 'practice_standards', label: 'Practice Standards' },
  { value: 'code_of_conduct', label: 'Code of Conduct' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'quality_indicators', label: 'Quality Indicators' },
  { value: 'worker_screening', label: 'Worker Screening' },
  { value: 'complaints_management', label: 'Complaints Management' },
  { value: 'incident_management', label: 'Incident Management' },
  { value: 'restrictive_practices', label: 'Restrictive Practices' },
  { value: 'plan_management', label: 'Plan Management' },
  { value: 'sil', label: 'SIL' },
  { value: 'community_participation', label: 'Community Participation' },
  { value: 'internal_policy', label: 'Internal Policy' },
  { value: 'governance', label: 'Governance' },
  { value: 'risk_management', label: 'Risk Management' },
  { value: 'participant_documentation', label: 'Participant Documentation' },
  { value: 'audit', label: 'Audit' },
  { value: 'high_intensity', label: 'High Intensity' },
  { value: 'behaviour_support', label: 'Behaviour Support' },
  { value: 'emergency_management', label: 'Emergency Management' },
  { value: 'human_resources', label: 'Human Resources' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
]

export function PolicyLibraryPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data: masters, isLoading } = usePolicyMasters()

  const filtered = masters?.filter((m) => {
    if (categoryFilter && m.category !== categoryFilter) return false
    if (!search) return true
    const s = `${m.title} ${m.source} ${m.description ?? ''}`.toLowerCase()
    return s.includes(search.toLowerCase())
  })

  const reviewDue = filtered?.filter((m) => {
    const rd = m.current_version?.review_date
    if (!rd) return false
    return new Date(rd) <= new Date()
  })

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Policy Library"
        description={`${masters?.length ?? 0} documents — ${reviewDue?.length ?? 0} due for review`}
      />

      {reviewDue && reviewDue.length > 0 && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-3 flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">
              {reviewDue.length} policy {reviewDue.length === 1 ? 'document' : 'documents'} due for review
            </span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : (v ?? ''))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!filtered?.length ? (
            <EmptyState
              icon={FileText}
              title="No policies found"
              description="No policy documents match your filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead>Review Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const cv = m.current_version
                  const isOverdue = cv?.review_date && new Date(cv.review_date) <= new Date()

                  return (
                    <TableRow
                      key={m.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/policies/${m.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <div className="font-medium">{m.title}</div>
                            {m.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {m.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {m.category.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">v{cv?.version_number ?? 1}</span>
                          {m.version_count > 1 && (
                            <span className="text-xs text-muted-foreground">
                              ({m.version_count} total)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={cv?.status ?? 'current'} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {cv?.effective_date ? formatDate(cv.effective_date) : '—'}
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-sm', isOverdue && 'text-amber-600 font-medium')}>
                          {cv?.review_date ? formatDate(cv.review_date) : '—'}
                          {isOverdue && ' (overdue)'}
                        </span>
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
