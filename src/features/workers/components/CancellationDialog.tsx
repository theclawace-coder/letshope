import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, DollarSign, Clock, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { useCancelBooking } from '../hooks/useBookings'
import type { BookingWithNames } from '../hooks/useBookings'
import {
  determineCancellationType,
  calculateCancellationCharge,
  getCancellationTypeLabel,
  isChargeableCancel,
  CANCELLATION_REASONS,
  type CancellationType,
  type CancelledBy,
} from '../utils/cancellationRules'
import { CANCELLED_BY_OPTIONS } from '@/lib/constants'

interface CancellationDialogProps {
  open: boolean
  onClose: () => void
  booking: BookingWithNames
}

export function CancellationDialog({ open, onClose, booking }: CancellationDialogProps) {
  const cancelBooking = useCancelBooking()
  const [cancelledBy, setCancelledBy] = useState<CancelledBy>('participant')
  const [reason, setReason] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isNoShow, setIsNoShow] = useState(false)

  const now = new Date()
  const bookingDate = new Date(booking.booking_date)

  // Auto-determine cancellation type
  const cancellationType: CancellationType = useMemo(() => {
    if (isNoShow) return 'no_show'
    return determineCancellationType(now, bookingDate)
  }, [isNoShow, bookingDate])

  // Calculate charge preview
  const chargePreview = useMemo(() => {
    const chargeable = isChargeableCancel(cancelledBy)
    if (!chargeable) return { charge: 0, rate: 0 }
    return calculateCancellationCharge(cancellationType, booking.estimated_cost)
  }, [cancellationType, cancelledBy, booking.estimated_cost])

  const isShortNotice = cancellationType === 'short_notice'
  const isNoShowType = cancellationType === 'no_show'
  const hasCharge = chargePreview.charge > 0

  async function handleCancel() {
    if (!reason) {
      toast.error('Please select a cancellation reason')
      return
    }

    try {
      const result = await cancelBooking.mutateAsync({
        bookingId: booking.id,
        bookingDate: booking.booking_date,
        estimatedCost: booking.estimated_cost,
        cancelledBy,
        cancellationReason: additionalNotes ? `${reason}: ${additionalNotes}` : reason,
        cancellationTypeOverride: isNoShow ? 'no_show' : undefined,
      })

      if (result.charge > 0) {
        toast.success(
          `Booking cancelled — ${getCancellationTypeLabel(result.cancellationType)}. Charge: $${result.charge.toFixed(2)}`,
        )
      } else {
        toast.success('Booking cancelled successfully')
      }
      onClose()
    } catch {
      toast.error('Failed to cancel booking')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Cancel Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking summary */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Participant</span>
              <span className="font-medium">{booking.participant_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Worker</span>
              <span className="font-medium">{booking.worker_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {format(bookingDate, 'EEE d MMM yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">
                {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
              </span>
            </div>
            {booking.estimated_cost != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking value</span>
                <span className="font-medium">${booking.estimated_cost.toFixed(2)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Cancellation type indicator */}
          {(isShortNotice || isNoShowType) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isNoShowType ? (
                  <>
                    <strong>No-show</strong> — participant did not attend.
                    Per NDIS rules, 100% of the agreed rate may be charged.
                  </>
                ) : (
                  <>
                    <strong>Short notice cancellation</strong> — less than 2 clear business
                    days before the booking. Per NDIS rules, up to 90% of the agreed rate
                    may be charged.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {!isShortNotice && !isNoShowType && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Sufficient notice given — no cancellation charge applies.
              </AlertDescription>
            </Alert>
          )}

          {/* Mark as No Show */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="noShow"
              checked={isNoShow}
              onChange={(e) => setIsNoShow(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="noShow" className="text-sm font-normal cursor-pointer">
              Mark as <strong>No Show</strong> (participant did not attend)
            </Label>
          </div>

          <Separator />

          {/* Cancelled by */}
          <div className="space-y-2">
            <Label>Cancelled by</Label>
            <Select value={cancelledBy} onValueChange={(v) => v && setCancelledBy(v as CancelledBy)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANCELLED_BY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Select value={reason} onValueChange={(v) => setReason(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional notes */}
          <div className="space-y-2">
            <Label htmlFor="cancelNotes">Additional notes</Label>
            <Textarea
              id="cancelNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={2}
              placeholder="Optional details..."
            />
          </div>

          {/* Charge summary */}
          {hasCharge && (
            <>
              <Separator />
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
                  <DollarSign className="h-4 w-4" />
                  Cancellation Charge
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="block text-xs text-orange-600">Type</span>
                    <span className="font-medium text-orange-900">
                      {getCancellationTypeLabel(cancellationType)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-orange-600">Charge</span>
                    <span className="font-semibold text-orange-900">
                      ${chargePreview.charge.toFixed(2)}{' '}
                      <span className="text-xs font-normal">
                        ({(chargePreview.rate * 100).toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  This charge will be recorded and can be added to the next invoice.
                </p>
              </div>
            </>
          )}

          {cancelledBy !== 'participant' && (isShortNotice || isNoShowType) && (
            <p className="text-xs text-muted-foreground">
              No charge applies — cancellation was initiated by {cancelledBy}, not the participant.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Keep Booking
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelBooking.isPending}
          >
            {cancelBooking.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
