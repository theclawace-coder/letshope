import { useTodaysBookings } from '../hooks/useShiftCheckInOut'
import { ShiftCheckInOutCard } from './ShiftCheckInOutCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Calendar } from 'lucide-react'

interface ShiftTimelineProps {
  workerId: string
}

export function ShiftTimeline({ workerId }: ShiftTimelineProps) {
  const { data: bookings, isLoading } = useTodaysBookings(workerId)

  if (isLoading) return <LoadingState />

  if (!bookings?.length) {
    return (
      <EmptyState
        icon={Calendar}
        title="No shifts today"
        description="There are no bookings scheduled for today."
      />
    )
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <ShiftCheckInOutCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}
