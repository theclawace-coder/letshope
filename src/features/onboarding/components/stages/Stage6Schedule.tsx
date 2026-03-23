import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'
import { CalendarDays } from 'lucide-react'
import type { Stage4Data } from '../../schemas'

type Stage5Data = Stage4Data
type Stage6Data = Stage4Data

interface Booking {
  worker_id: string
  registration_group: string
  booking_date: string
  start_time: string
  end_time: string
  recurrence: 'one_off' | 'weekly' | 'fortnightly'
  notes: string
}

interface Stage6Props {
  defaultValues?: Partial<Stage6Data>
  assignments: Stage5Data['assignments']
  onSubmit: (data: Stage6Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage6Schedule({ defaultValues, assignments, onSubmit, onBack, isLoading }: Stage6Props) {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    if (defaultValues?.bookings && defaultValues.bookings.length > 0) {
      return defaultValues.bookings as Booking[]
    }
    // Initialize one booking per assignment with first-visit note on the first one
    return assignments.map((assignment, index) => ({
      worker_id: assignment.worker_id,
      registration_group: assignment.registration_group,
      booking_date: '',
      start_time: '09:00',
      end_time: '11:00',
      recurrence: 'weekly' as const,
      notes: index === 0 ? 'First visit - bring Risk Assessment to complete' : '',
    }))
  })

  function updateBooking(index: number, field: keyof Booking, value: string) {
    setBookings((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    )
  }

  function handleSubmit() {
    const data: Stage6Data = {
      assignments: [],
      bookings,
    }
    onSubmit(data)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Initial Booking Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Set up the initial booking schedule for each assigned service. The first booking should include a note to bring the Risk Assessment.
          </p>
        </CardContent>
      </Card>

      {bookings.map((booking, index) => {
        const assignment = assignments.find(
          (a) => a.worker_id === booking.worker_id && a.registration_group === booking.registration_group
        )
        const groupName = ALL_REGISTRATION_GROUPS[booking.registration_group as keyof typeof ALL_REGISTRATION_GROUPS] || booking.registration_group

        return (
          <Card key={`${booking.worker_id}-${booking.registration_group}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{booking.registration_group}</Badge>
                  {groupName}
                </CardTitle>
                {assignment && (
                  <span className="text-xs text-muted-foreground">
                    Worker: {assignment.worker_name}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Booking Date *</Label>
                  <Input
                    type="date"
                    value={booking.booking_date}
                    onChange={(e) => updateBooking(index, 'booking_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Input
                    type="time"
                    value={booking.start_time}
                    onChange={(e) => updateBooking(index, 'start_time', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time *</Label>
                  <Input
                    type="time"
                    value={booking.end_time}
                    onChange={(e) => updateBooking(index, 'end_time', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recurrence</Label>
                <Select
                  value={booking.recurrence}
                  onValueChange={(v) => v && updateBooking(index, 'recurrence', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_off">One-off</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={booking.notes}
                  onChange={(e) => updateBooking(index, 'notes', e.target.value)}
                  placeholder="Any notes for this booking..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )
      })}

      {bookings.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              No worker assignments found. Go back to Stage 5 to assign workers first.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
}
