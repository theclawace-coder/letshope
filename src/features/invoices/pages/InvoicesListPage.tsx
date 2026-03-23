import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInvoices, useInvoiceStats } from '../hooks/useInvoices'
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
import { Plus, Receipt, Search, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { INVOICE_STATUSES, FUNDING_TYPES } from '@/lib/constants'

export function InvoicesListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [fundingFilter, setFundingFilter] = useState('')

  const { data: invoices, isLoading } = useInvoices({
    status: statusFilter || undefined,
    fundingType: fundingFilter || undefined,
  })
  const { data: stats } = useInvoiceStats()

  const filtered = invoices?.filter((inv) => {
    if (!search) return true
    const searchable = `${inv.participant_name || ''} ${inv.invoice_number} ${inv.notes || ''}`.toLowerCase()
    return searchable.includes(search.toLowerCase())
  })

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Invoices"
        description={`${invoices?.length ?? 0} invoices total`}
        action={
          <Button onClick={() => navigate('/invoices/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        }
      />

      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Drafts</p>
                  <p className="text-xl font-bold">{stats.draft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.total_outstanding)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.total_paid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                  <p className="text-xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || '')}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {INVOICE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fundingFilter} onValueChange={(v) => setFundingFilter(v || '')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Funding" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funding</SelectItem>
                {FUNDING_TYPES.filter((f) => f.value !== 'combination').map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!filtered?.length ? (
            <EmptyState
              icon={Receipt}
              title="No invoices"
              description="No invoices have been created yet."
              action={
                <Button onClick={() => navigate('/invoices/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Funding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                    <TableCell className="font-medium">{inv.participant_name || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(inv.period_start)} - {formatDate(inv.period_end)}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(inv.total)}</TableCell>
                    <TableCell className="capitalize text-sm">
                      {inv.funding_type?.replace(/_/g, ' ') || '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(inv.invoice_date)}</TableCell>
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
