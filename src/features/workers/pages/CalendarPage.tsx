import { useState, useMemo, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core'
import { useBookings, type BookingWithNames } from '../hooks/useBookings'
import { useWorkers } from '../hooks/useWorkers'
import { BookingDialog } from '../components/BookingDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { BOOKING_STATUS_COLORS } from '../constants'

const STATUS_EVENT_COLORS: Record<string, { backgroundColor: string; borderColor: string }> = {
  scheduled: { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
  completed: { backgroundColor: '#22c55e', borderColor: '#16a34a' },
  cancelled: { backgroundColor: '#9ca3af', borderColor: '#6b7280' },
  no_show: { backgroundColor: '#ef4444', borderColor: '#dc2626' },
}

export function CalendarPage() {
  const [workerFilter, setWorkerFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date().toISOString().split('T')[0],
    to: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithNames | null>(null)
  const [clickedDate, setClickedDate] = useState<string>('')

  const { data: workers } = useWorkers('active')
  const { data: bookings } = useBookings({
    workerId: workerFilter !== 'all' ? workerFilter : undefined,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  })

  const events = useMemo(() => {
    if (!bookings) return []
    const result: Array<Record<string, unknown>> = []
    for (const b of bookings) {
      // Add travel time block before the booking if travel_time_minutes is set
      if (b.travel_time_minutes && b.travel_time_minutes > 0) {
        const [h, m] = b.start_time.split(':').map(Number)
        const startMinutes = h * 60 + m - b.travel_time_minutes
        const travelStartH = Math.floor(Math.max(0, startMinutes) / 60)
        const travelStartM = Math.max(0, startMinutes) % 60
        const travelStart = `${String(travelStartH).padStart(2, '0')}:${String(travelStartM).padStart(2, '0')}`
        const distLabel = b.travel_distance_km ? ` · ${b.travel_distance_km} km` : ''
        result.push({
          id: `travel-${b.id}`,
          title: `🚗 Travel ${b.travel_time_minutes} min${distLabel}`,
          start: `${b.booking_date}T${travelStart}`,
          end: `${b.booking_date}T${b.start_time}`,
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
          textColor: '#fff',
          editable: false,
          extendedProps: { isTravel: true, booking: b },
        })
      }

      const isRecurring = b.recurrence_parent_id || (b.recurrence && b.recurrence !== 'one_off')
      let title: string
      if (b.is_group_booking && b.group_participants && b.group_participants.length > 0) {
        const names = b.group_participants.map((gp) => gp.participant_name.split(' ')[0])
        title = `${isRecurring ? '🔁 ' : ''}[Group ${b.group_ratio || ''}] ${names.join(', ')} — ${b.worker_name || 'Worker'}`
      } else {
        title = `${isRecurring ? '🔁 ' : ''}${b.participant_name || 'Participant'} — ${b.worker_name || 'Worker'}`
      }
      result.push({
        id: b.id,
        title,
        start: `${b.booking_date}T${b.start_time}`,
        end: `${b.booking_date}T${b.end_time}`,
        extendedProps: { booking: b },
        ...(STATUS_EVENT_COLORS[b.status] || STATUS_EVENT_COLORS.scheduled),
        ...(b.is_group_booking ? { backgroundColor: '#8b5cf6', borderColor: '#7c3aed' } : {}),
      })
    }
    return result
  }, [bookings])

  const handleDateClick = useCallback((arg: DateClickArg) => {
    setSelectedBooking(null)
    setClickedDate(arg.dateStr.split('T')[0])
    setDialogOpen(true)
  }, [])

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const booking = arg.event.extendedProps.booking as BookingWithNames
    if (booking) {
      setSelectedBooking(booking)
      setClickedDate('')
      setDialogOpen(true)
    }
  }, [])

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setDateRange({
      from: arg.startStr.split('T')[0],
      to: arg.endStr.split('T')[0],
    })
  }, [])

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Manage worker schedules and bookings"
        action={
          <Button onClick={() => { setSelectedBooking(null); setClickedDate(''); setDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        }
      />

      <div className="flex gap-3 mb-4">
        <Select value={workerFilter} onValueChange={(v) => setWorkerFilter(v || 'all')}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All Workers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workers</SelectItem>
            {workers?.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.first_name} {w.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 text-xs items-center ml-auto flex-wrap">
          {Object.entries(BOOKING_STATUS_COLORS).map(([status, colorClass]) => (
            <span key={status} className={`px-2 py-1 rounded capitalize ${colorClass}`}>
              {status.replace(/_/g, ' ')}
            </span>
          ))}
          <span className="px-2 py-1 rounded bg-amber-500 text-white">Travel</span>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            editable={false}
            selectable
            slotMinTime="06:00:00"
            slotMaxTime="21:00:00"
            allDaySlot={false}
            height="auto"
            aspectRatio={1.8}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
            }}
          />
        </CardContent>
      </Card>

      <BookingDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedBooking(null) }}
        booking={selectedBooking}
        defaultDate={clickedDate}
      />
    </div>
  )
}
