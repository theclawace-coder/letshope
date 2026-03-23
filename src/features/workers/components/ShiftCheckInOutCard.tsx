import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCheckIn, useCheckOut, captureLocation } from '../hooks/useShiftCheckInOut'
import type { BookingWithNames } from '../hooks/useShiftCheckInOut'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LogIn, LogOut, FileText, MapPin, Clock, Loader2 } from 'lucide-react'
import { formatDuration } from '@/lib/formatters'
import { toast } from 'sonner'

interface ShiftCheckInOutCardProps {
  booking: BookingWithNames
}

export function ShiftCheckInOutCard({ booking }: ShiftCheckInOutCardProps) {
  const navigate = useNavigate()
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()
  const [elapsed, setElapsed] = useState('')

  // Live elapsed timer when checked in
  useEffect(() => {
    if (booking.status !== 'checked_in' || !booking.actual_start_time) return

    const update = () => {
      const start = new Date(booking.actual_start_time!).getTime()
      const diff = Math.floor((Date.now() - start) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = diff % 60
      setElapsed(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [booking.status, booking.actual_start_time])

  const handleCheckIn = async () => {
    try {
      const location = await captureLocation()
      await checkIn.mutateAsync({ bookingId: booking.id, location })
      toast.success('Checked in successfully')
    } catch {
      toast.error('Failed to check in')
    }
  }

  const handleCheckOut = async () => {
    try {
      const location = await captureLocation()
      await checkOut.mutateAsync({ bookingId: booking.id, location })
      toast.success('Checked out successfully')
    } catch {
      toast.error('Failed to check out')
    }
  }

  const hasLocation = booking.check_in_location || booking.check_out_location

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {booking.participant_name || 'Unknown participant'}
              </span>
              <StatusBadge status={booking.status} />
            </div>

            {booking.service_description && (
              <p className="text-sm text-muted-foreground">{booking.service_description}</p>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
              </div>
              {hasLocation && <MapPin className="h-3.5 w-3.5 text-green-600" />}
            </div>

            {booking.status === 'checked_in' && booking.actual_start_time && (
              <div className="text-sm">
                <span className="text-muted-foreground">Checked in at </span>
                <span className="font-medium">
                  {new Date(booking.actual_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-muted-foreground"> | Elapsed: </span>
                <span className="font-mono font-medium text-emerald-600">{elapsed}</span>
              </div>
            )}

            {(booking.status === 'checked_out' || booking.status === 'completed') && booking.actual_start_time && booking.actual_end_time && (
              <div className="text-sm space-y-0.5">
                <div>
                  <span className="text-muted-foreground">Actual: </span>
                  <span className="font-medium">
                    {new Date(booking.actual_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {new Date(booking.actual_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-muted-foreground"> ({formatDuration(booking.actual_start_time, booking.actual_end_time)})</span>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0">
            {booking.status === 'scheduled' && (
              <Button size="sm" onClick={handleCheckIn} disabled={checkIn.isPending}>
                {checkIn.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4 mr-1" />
                )}
                Check In
              </Button>
            )}

            {booking.status === 'checked_in' && (
              <Button size="sm" variant="secondary" onClick={handleCheckOut} disabled={checkOut.isPending}>
                {checkOut.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-1" />
                )}
                Check Out
              </Button>
            )}

            {booking.status === 'checked_out' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate(`/progress-notes/new?bookingId=${booking.id}&participantId=${booking.participant_id}&workerId=${booking.worker_id}`)
                }
              >
                <FileText className="h-4 w-4 mr-1" />
                Write Note
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
