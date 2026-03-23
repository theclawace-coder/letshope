import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { usePortalAuth, usePortalBookings } from '../hooks/usePortal'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Calendar, Clock, AlertTriangle, CheckCircle, Users } from 'lucide-react'
import { countBusinessDaysBetween } from '@/features/workers/utils/cancellationRules'

export function PortalBookingsPage() {
  const { session } = usePortalAuth()
  const bookings = usePortalBookings(session?.participantId)

  if (bookings.isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Upcoming Bookings
        </h1>
        <p className="text-muted-foreground mt-1">
          Your scheduled support sessions with Hope Disability Support.
        </p>
      </div>

      {!bookings.data || bookings.data.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming bookings"
          description="When bookings are scheduled for you, they'll appear here."
        />
      ) : (
        <div className="space-y-4">
          {bookings.data.map((booking) => {
            const startTime = new Date(booking.start_time)
            const endTime = new Date(booking.end_time)
            const isToday = new Date().toDateString() === startTime.toDateString()

            return (
              <PortalBookingCard
                key={booking.id}
                booking={booking}
                startTime={startTime}
                endTime={endTime}
                isToday={isToday}
              />
            )
          })}
        </div>
      )}

      {/* NDIS cancellation policy info */}
      <Card className="border-dashed">
        <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Cancellation Policy (NDIS)</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>
              <strong>2+ business days notice</strong> — no cancellation charge
            </li>
            <li>
              <strong>Less than 2 business days notice</strong> — up to 90% of the agreed rate may be charged
            </li>
            <li>
              <strong>No show</strong> — up to 100% of the agreed rate may be charged
            </li>
          </ul>
          <p>
            Need to change or cancel a booking? Contact us as early as possible at{' '}
            <strong>0405 092 779</strong> or{' '}
            <strong>erfan@hopedisability.com.au</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

interface PortalBookingCardProps {
  booking: {
    id: string
    booking_date: string
    start_time: string
    end_time: string
    service_description: string | null
    status: string
    worker_name: string
    is_group_booking?: boolean
    group_size?: number | null
  }
  startTime: Date
  endTime: Date
  isToday: boolean
}

function PortalBookingCard({ booking, startTime, endTime, isToday }: PortalBookingCardProps) {
  const cancellationNotice = useMemo(() => {
    const now = new Date()
    const bookingDate = new Date(booking.booking_date)
    const businessDays = countBusinessDaysBetween(now, bookingDate)
    return {
      businessDays,
      isShortNotice: businessDays < 2,
    }
  }, [booking.booking_date])

  return (
    <Card className={isToday ? 'border-primary' : ''}>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-4">
            {/* Date block */}
            <div className="flex flex-col items-center rounded-lg bg-muted p-3 min-w-[4rem]">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {startTime.toLocaleDateString('en-AU', { weekday: 'short' })}
              </span>
              <span className="text-2xl font-bold">{startTime.getDate()}</span>
              <span className="text-xs text-muted-foreground">
                {startTime.toLocaleDateString('en-AU', { month: 'short' })}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {booking.worker_name}
                </h3>
                {isToday && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
                {booking.is_group_booking && (
                  <span className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 px-2 py-0.5 rounded-full">
                    <Users className="h-3 w-3" />
                    Group{booking.group_size ? ` (${booking.group_size})` : ''}
                  </span>
                )}
              </div>
              {booking.service_description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {booking.service_description}
                </p>
              )}
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Cancellation notice indicator */}
              <div className="mt-2">
                {cancellationNotice.isShortNotice ? (
                  <div className="flex items-center gap-1.5 text-xs text-orange-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>
                      {isToday
                        ? 'Today — cancelling now would be short notice'
                        : `Short notice — cancelling now may incur a charge`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>
                      {cancellationNotice.businessDays} business day{cancellationNotice.businessDays !== 1 ? 's' : ''} notice — no charge if cancelled now
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
