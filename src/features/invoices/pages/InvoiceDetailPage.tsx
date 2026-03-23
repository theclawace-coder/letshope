import { useParams, useNavigate } from 'react-router-dom'
import { useInvoice } from '../hooks/useInvoices'
import { useCreditNotes } from '../hooks/useCreditNotes'
import { InvoiceStatusActions } from '../components/InvoiceStatusActions'
import { BudgetSummaryCard } from '../components/BudgetSummaryCard'
import { useParticipantBudget } from '../hooks/useInvoices'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Lock, FileText } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/formatters'

export function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: invoice, isLoading } = useInvoice(id)
  const { data: budget } = useParticipantBudget(invoice?.participant_id)
  const { data: creditNotes } = useCreditNotes(id)

  if (isLoading) return <LoadingState />
  if (!invoice) return <div>Invoice not found</div>

  const participants = (invoice as unknown as Record<string, unknown>).participants as Record<string, unknown> | null
  const isLocked = !!(invoice as unknown as Record<string, unknown>).locked_at

  return (
    <div>
      <PageHeader
        title={`Invoice ${invoice.invoice_number}`}
        description={invoice.participant_name || ''}
        action={
          <div className="flex gap-2">
            {isLocked && ['approved', 'submitted', 'paid'].includes(invoice.status) && (
              <Button onClick={() => navigate(`/invoices/${invoice.id}/credit-notes/new`)}>
                <FileText className="h-4 w-4 mr-2" />
                Issue Credit Note
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/invoices')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Invoice Details</span>
              <InvoiceStatusActions invoiceId={invoice.id} currentStatus={invoice.status} isLocked={isLocked} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={invoice.status} />
              {invoice.funding_type && (
                <Badge variant="outline" className="capitalize">
                  {invoice.funding_type.replace(/_/g, ' ')}
                </Badge>
              )}
              {isLocked && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Badge>
              )}
              {invoice.credit_note_total > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Credits: -{formatCurrency(invoice.credit_note_total)}
                </Badge>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number</span>
                <span className="font-mono font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participant</span>
                <span className="font-medium">{invoice.participant_name || '-'}</span>
              </div>
              {participants?.ndis_number != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NDIS Number</span>
                  <span className="font-medium">{String(participants.ndis_number)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Date</span>
                <span className="font-medium">{formatDate(invoice.invoice_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Period</span>
                <span className="font-medium">
                  {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                </span>
              </div>
              {invoice.due_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-medium">{formatDate(invoice.due_date)}</span>
                </div>
              )}
              {invoice.claim_reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Claim Reference</span>
                  <span className="font-mono font-medium">{invoice.claim_reference}</span>
                </div>
              )}
              {invoice.submitted_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-medium">{formatDate(invoice.submitted_at)}</span>
                </div>
              )}
              {invoice.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium">{formatDate(invoice.paid_at)}</span>
                </div>
              )}
            </div>

            {invoice.rejection_reason && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                <p className="text-sm mt-1">{invoice.rejection_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.line_items && invoice.line_items.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Item #</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">NDIS Max</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.line_items.map((li) => {
                      const exceedsMax = li.ndis_max_price != null && li.unit_price > li.ndis_max_price
                      return (
                        <TableRow key={li.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(li.date_of_service)}</TableCell>
                          <TableCell>
                            <div>{li.support_item_name}</div>
                            {li.claim_type !== 'standard' && (
                              <span className="text-xs text-muted-foreground capitalize">
                                {li.claim_type.replace(/_/g, ' ')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{li.support_item_number || '-'}</TableCell>
                          <TableCell className="text-right">
                            {li.quantity} {li.unit}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(li.unit_price)}</TableCell>
                          <TableCell className="text-right">
                            {li.ndis_max_price != null ? (
                              <span className={exceedsMax ? 'text-destructive font-medium' : ''}>
                                {formatCurrency(li.ndis_max_price)}
                                {exceedsMax && ' !'}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(li.total)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                <div className="border-t mt-4 pt-4 space-y-1 text-right text-sm">
                  <div>Subtotal: <span className="font-medium">{formatCurrency(invoice.subtotal)}</span></div>
                  <div>GST: <span className="font-medium">{formatCurrency(invoice.gst)}</span></div>
                  <div className="text-base font-bold pt-1">
                    Total: {formatCurrency(invoice.total)}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No line items</p>
            )}
          </CardContent>
        </Card>

        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {creditNotes && creditNotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Credit Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Credit Note #</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditNotes.map((cn) => (
                    <TableRow
                      key={cn.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/invoices/${invoice.id}/credit-notes/${cn.id}`)}
                    >
                      <TableCell className="font-mono text-sm">{cn.credit_note_number}</TableCell>
                      <TableCell className="capitalize">{cn.reason.replace(/_/g, ' ')}</TableCell>
                      <TableCell><StatusBadge status={cn.status} /></TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        -{formatCurrency(cn.total)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(cn.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {invoice.credit_note_total > 0 && (
                <div className="border-t mt-3 pt-3 text-right text-sm">
                  <span className="text-muted-foreground mr-2">Net Amount:</span>
                  <span className="font-bold">
                    {formatCurrency(invoice.total - invoice.credit_note_total)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {budget && (
          <BudgetSummaryCard budget={budget} />
        )}
      </div>
    </div>
  )
}
