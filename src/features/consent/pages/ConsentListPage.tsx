import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConsents, useConsentsRequiringAttention } from '../hooks/useConsents'
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
import { Plus, ShieldCheck, Search, AlertTriangle, Clock, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { CONSENT_TYPES, CONSENT_STATUSES } from '@/lib/constants'

export function ConsentListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: consents, isLoading } = useConsents({
    consentType: typeFilter || undefined,
    status: statusFilter || undefined,
  })

  const { data: attentionItems } = useConsentsRequiringAttention()

  const filtered = consents?.filter((c) => {
    if (!search) return true
    const searchable = `${c.participant_name || ''} ${c.title} ${c.given_by_name} ${c.scope || ''}`.toLowerCase()
    return searchable.includes(search.toLowerCase())
  })

  const activeCount = consents?.filter((c) => c.consent_status === 'active').length ?? 0
  const expiringSoonCount = attentionItems?.filter((a) => a.attention_reason === 'expiring_soon' || a.attention_reason === 'expired').length ?? 0
  const reviewDueCount = attentionItems?.filter((a) => a.attention_reason === 'review_due_soon' || a.attention_reason === 'review_overdue').length ?? 0
  const withdrawnCount = consents?.filter((c) => c.consent_status === 'withdrawn').length ?? 0

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Consent & Rights"
        description={`${consents?.length ?? 0} consent records`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/consent/rights/new')}>
              Record Rights Acknowledgment
            </Button>
            <Button onClick={() => navigate('/consent/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Record Consent
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{expiringSoonCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Review Due</p>
                <p className="text-2xl font-bold">{reviewDueCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Withdrawn</p>
                <p className="text-2xl font-bold">{withdrawnCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attention items banner */}
      {attentionItems && attentionItems.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-orange-800">Consents requiring attention</p>
                <ul className="mt-2 space-y-1">
                  {attentionItems.slice(0, 5).map((item) => (
                    <li key={item.id} className="text-sm text-orange-700 cursor-pointer hover:underline" onClick={() => navigate(`/consent/${item.id}`)}>
                      {item.participant_name} - {item.title} ({item.attention_reason?.replace(/_/g, ' ')}, {item.days_remaining} days)
                    </li>
                  ))}
                  {attentionItems.length > 5 && (
                    <li className="text-sm text-orange-600">+ {attentionItems.length - 5} more</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search consents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || '')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {CONSENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || '')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {CONSENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!filtered?.length ? (
            <EmptyState
              icon={ShieldCheck}
              title="No consent records"
              description="No consent records have been created yet."
              action={
                <Button onClick={() => navigate('/consent/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Consent
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Given</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/consent/${c.id}`)}
                  >
                    <TableCell className="font-medium">{c.participant_name || '-'}</TableCell>
                    <TableCell>{c.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {(c.consent_type ?? '').replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(c.given_date)}</TableCell>
                    <TableCell className="whitespace-nowrap">{c.expiry_date ? formatDate(c.expiry_date) : 'No expiry'}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.consent_status} />
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
