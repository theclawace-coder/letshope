import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useInvoice } from '../hooks/useInvoices'
import { useCreateCreditNote } from '../hooks/useCreditNotes'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { CREDIT_NOTE_REASONS } from '@/lib/constants'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types'

type LineItem = Tables<'invoice_line_items'>

interface CreditLineItem {
  originalId: string
  selected: boolean
  support_item_number: string | null
  support_item_name: string
  date_of_service: string
  quantity: number
  unit: string
  unit_price: number
  gst_applicable: boolean
  total: number
}

export function CreateCreditNotePage() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const { data: invoice, isLoading } = useInvoice(invoiceId)
  const createCreditNote = useCreateCreditNote()

  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [creditItems, setCreditItems] = useState<CreditLineItem[]>([])
  const [initialized, setInitialized] = useState(false)

  // Initialize credit items from invoice line items once loaded
  if (invoice?.line_items && !initialized) {
    setCreditItems(
      invoice.line_items.map((li: LineItem) => ({
        originalId: li.id,
        selected: false,
        support_item_number: li.support_item_number,
        support_item_name: li.support_item_name,
        date_of_service: li.date_of_service,
        quantity: li.quantity,
        unit: li.unit,
        unit_price: li.unit_price,
        gst_applicable: li.gst_applicable,
        total: li.total,
      }))
    )
    setInitialized(true)
  }

  if (isLoading) return <LoadingState />
  if (!invoice) return <div>Invoice not found</div>

  const selectedItems = creditItems.filter((i) => i.selected)
  const creditSubtotal = selectedItems.reduce((sum, i) => sum + i.total, 0)
  const creditGst = selectedItems.reduce((sum, i) => sum + (i.gst_applicable ? i.total * 0.1 : 0), 0)
  const creditTotal = creditSubtotal + creditGst

  const toggleItem = (index: number) => {
    setCreditItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    )
  }

  const updateItemQuantity = (index: number, newQty: number) => {
    setCreditItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const qty = Math.min(Math.max(0, newQty), invoice.line_items![index].quantity)
        return { ...item, quantity: qty, total: Math.round(qty * item.unit_price * 100) / 100 }
      })
    )
  }

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason')
      return
    }
    if (selectedItems.length === 0) {
      toast.error('Please select at least one line item to credit')
      return
    }

    try {
      const cn = await createCreditNote.mutateAsync({
        creditNote: {
          invoice_id: invoice.id,
          participant_id: invoice.participant_id,
          reason,
          notes: notes || null,
        },
        lineItems: selectedItems.map((item) => ({
          original_line_item_id: item.originalId,
          support_item_number: item.support_item_number,
          support_item_name: item.support_item_name,
          date_of_service: item.date_of_service,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          gst_applicable: item.gst_applicable,
          total: item.total,
        })),
      })
      toast.success('Credit note created')
      navigate(`/invoices/${invoice.id}/credit-notes/${cn.id}`)
    } catch {
      toast.error('Failed to create credit note')
    }
  }

  return (
    <div>
      <PageHeader
        title="Issue Credit Note"
        description={`Against invoice ${invoice.invoice_number}`}
        action={
          <Button variant="outline" onClick={() => navigate(`/invoices/${invoice.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoice
          </Button>
        }
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credit Note Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Select value={reason} onValueChange={(v) => setReason(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CREDIT_NOTE_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Participant</Label>
                <Input value={invoice.participant_name || ''} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes about this credit note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Line Items to Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Credit</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Orig Qty</TableHead>
                  <TableHead className="text-right w-24">Credit Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Credit Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditItems.map((item, index) => (
                  <TableRow key={item.originalId} className={item.selected ? 'bg-destructive/5' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItem(index)}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(item.date_of_service)}</TableCell>
                    <TableCell>
                      <div>{item.support_item_name}</div>
                      {item.support_item_number && (
                        <span className="text-xs font-mono text-muted-foreground">{item.support_item_number}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.line_items![index].quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        max={invoice.line_items![index].quantity}
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 0)}
                        disabled={!item.selected}
                        className="w-20 text-right ml-auto"
                      />
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {item.selected ? (
                        <span className="text-destructive">-{formatCurrency(item.total)}</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {selectedItems.length > 0 && (
              <div className="border-t mt-4 pt-4 space-y-1 text-right text-sm">
                <div>Subtotal: <span className="font-medium text-destructive">-{formatCurrency(creditSubtotal)}</span></div>
                <div>GST: <span className="font-medium text-destructive">-{formatCurrency(Math.round(creditGst * 100) / 100)}</span></div>
                <div className="text-base font-bold pt-1 text-destructive">
                  Credit Total: -{formatCurrency(Math.round(creditTotal * 100) / 100)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(`/invoices/${invoice.id}`)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createCreditNote.isPending}>
            {createCreditNote.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Create Credit Note
          </Button>
        </div>
      </div>
    </div>
  )
}
