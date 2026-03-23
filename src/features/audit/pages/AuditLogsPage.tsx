import { useState } from 'react'
import { useAuditLogs } from '../hooks/useAuditLogs'
import { AuditTimeline } from '../components/AuditTimeline'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClipboardList } from 'lucide-react'

const ENTITY_TYPES = [
  { value: 'all', label: 'All Entities' },
  { value: 'participants', label: 'Participants' },
  { value: 'workers', label: 'Workers' },
  { value: 'incidents', label: 'Incidents' },
  { value: 'complaints', label: 'Complaints' },
  { value: 'concerns', label: 'Concerns' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'bookings', label: 'Bookings' },
  { value: 'service_agreements', label: 'Service Agreements' },
  { value: 'progress_notes', label: 'Progress Notes' },
]

const ACTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'insert', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
]

export function AuditLogsPage() {
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: logs, isLoading } = useAuditLogs({
    entityType: entityFilter || undefined,
    action: actionFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="Complete history of all changes across the system."
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3 flex-wrap">
            <Select value={entityFilter} onValueChange={(v) => setEntityFilter(v || '')}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v || '')}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36"
                placeholder="From"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36"
                placeholder="To"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!logs?.length ? (
        <EmptyState
          icon={ClipboardList}
          title="No audit logs"
          description="Audit logs will appear here as changes are made across the system."
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Showing {logs.length} entries (most recent first)
            </p>
            <AuditTimeline logs={logs} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
