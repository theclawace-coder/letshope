import { useState } from 'react'
import { useUpdateInvoiceStatus } from '../hooks/useInvoices'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Send, Ban, XCircle, Loader2, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types'

type InvoiceStatus = Tables<'invoices'>['status']

interface InvoiceStatusActionsProps {
  invoiceId: string
  currentStatus: InvoiceStatus
  isLocked?: boolean
}

export function InvoiceStatusActions({ invoiceId, currentStatus, isLocked }: InvoiceStatusActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const updateStatus = useUpdateInvoiceStatus()

  const handleStatusChange = async (status: InvoiceStatus) => {
    try {
      await updateStatus.mutateAsync({ id: invoiceId, status })
      toast.success(`Invoice ${status}`)
    } catch {
      toast.error(`Failed to update invoice status`)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    try {
      await updateStatus.mutateAsync({
        id: invoiceId,
        status: 'rejected',
        rejection_reason: rejectReason.trim(),
      })
      toast.success('Invoice rejected')
      setRejectOpen(false)
      setRejectReason('')
    } catch {
      toast.error('Failed to reject invoice')
    }
  }

  const isLoading = updateStatus.isPending

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {currentStatus === 'draft' && (
          <Button size="sm" onClick={() => handleStatusChange('approved')} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
            Approve
          </Button>
        )}

        {currentStatus === 'approved' && (
          <Button size="sm" onClick={() => handleStatusChange('submitted')} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Submit to NDIS
          </Button>
        )}

        {currentStatus === 'submitted' && (
          <>
            <Button size="sm" onClick={() => handleStatusChange('paid')} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Mark Paid
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)} disabled={isLoading}>
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </>
        )}

        {(currentStatus === 'draft' || currentStatus === 'approved') && (
          <Button size="sm" variant="outline" onClick={() => handleStatusChange('cancelled')} disabled={isLoading}>
            <Ban className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        )}

        {isLocked && (currentStatus === 'approved' || currentStatus === 'submitted' || currentStatus === 'paid') && (
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleStatusChange('void')} disabled={isLoading}>
            <ShieldOff className="h-4 w-4 mr-1" />
            Void
          </Button>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Invoice</DialogTitle>
            <DialogDescription>
              Provide the reason this invoice was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Rejection Reason *</Label>
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Reject Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
