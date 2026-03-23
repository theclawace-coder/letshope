import { useParams, useNavigate } from 'react-router-dom'
import { useCreditNote, useUpdateCreditNoteStatus } from '../hooks/useCreditNotes'
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
import { ArrowLeft, CheckCircle, Send, Ban, Loader2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { toast } from 'sonner'

export function CreditNoteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: creditNote, isLoading } = useCreditNote(id)
  const updateStatus = useUpdateCreditNoteStatus()

  if (isLoading) return <LoadingState />
  if (!creditNote) return <div>Credit note not found</div>

  const handleStatusChange = async (status: 'approved' | 'applied' | 'void') => {
    try {
      await updateStatus.mutateAsync({ id: creditNote.id, status })
      toast.success(`Credit note ${status}`)
    } catch {
      toast.error('Failed to update credit note status')
    }
  }

  const isUpdating = updateStatus.isPending

  return (
    <div>
      <PageHeader
        title={`Credit Note ${creditNote.credit_note_number}`}
        description={creditNote.participant_name || ''}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/invoices/${creditNote.invoice_id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoice
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Credit Note Details</span>
              <div className="flex gap-2 flex-wrap">
                {creditNote.status === 'draft' && (
                  <Button size="sm" onClick={() => handleStatusChange('approved')} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                    Approve
                  </Button>
                )}
                {creditNote.status === 'approved' && (
                  <Button size="sm" onClick={() => handleStatusChange('applied')} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                    Apply to Invoice
                  </Button>
                )}
                {(creditNote.status === 'draft' || creditNote.status === 'approved') && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange('void')} disabled={isUpdating}>
                    <Ban className="h-4 w-4 mr-1" />
                    Void
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={creditNote.status} />
              <Badge variant="outline" className="font-mono">
                Against: {creditNote.invoice_number}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credit Note #</span>
                <span className="font-mono font-medium">{creditNote.credit_note_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participant</span>
                <span className="font-medium">{creditNote.participant_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reason</span>
                <span className="font-medium capitalize">{creditNote.reason.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDate(creditNote.created_at)}</span>
              </div>
              {creditNote.approved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved</span>
                  <span className="font-medium">{formatDate(creditNote.approved_at)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credit Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            {creditNote.line_items && creditNote.line_items.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Item #</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditNote.line_items.map((li) => (
                      <TableRow key={li.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(li.date_of_service)}</TableCell>
                        <TableCell>{li.support_item_name}</TableCell>
                        <TableCell className="font-mono text-xs">{li.support_item_number || '-'}</TableCell>
                        <TableCell className="text-right">{li.quantity} {li.unit}</TableCell>
                        <TableCell className="text-right">{formatCurrency(li.unit_price)}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">-{formatCurrency(li.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="border-t mt-4 pt-4 space-y-1 text-right text-sm">
                  <div>Subtotal: <span className="font-medium text-destructive">-{formatCurrency(creditNote.subtotal)}</span></div>
                  <div>GST: <span className="font-medium text-destructive">-{formatCurrency(creditNote.gst)}</span></div>
                  <div className="text-base font-bold pt-1 text-destructive">
                    Credit Total: -{formatCurrency(creditNote.total)}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No line items</p>
            )}
          </CardContent>
        </Card>

        {creditNote.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{creditNote.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
