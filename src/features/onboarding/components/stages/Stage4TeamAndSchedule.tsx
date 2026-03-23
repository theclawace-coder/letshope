import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'
import { UserCheck, AlertTriangle, ShieldAlert, CalendarDays } from 'lucide-react'
import type { Stage4Data } from '../../schemas'

interface Worker {
  id: string
  full_name: string
  qualified_registration_groups: string[]
  ndis_screening_valid: boolean
  police_check_valid: boolean
  code_of_conduct_signed: boolean
  orientation_completed: boolean
}

interface Booking {
  worker_id: string
  registration_group: string
  booking_date: string
  start_time: string
  end_time: string
  recurrence: 'one_off' | 'weekly' | 'fortnightly'
  notes: string
}

interface Stage4Props {
  defaultValues?: Partial<Stage4Data>
  servicesRequested: string[]
  onSubmit: (data: Stage4Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage4TeamAndSchedule({ defaultValues, servicesRequested, onSubmit, onBack, isLoading }: Stage4Props) {
  // ── Worker assignments ──
  const [assignments, setAssignments] = useState<Record<string, { worker_id: string; worker_name: string }>>(() => {
    const initial: Record<string, { worker_id: string; worker_name: string }> = {}
    if (defaultValues?.assignments) {
      for (const a of defaultValues.assignments) {
        initial[a.registration_group] = { worker_id: a.worker_id, worker_name: a.worker_name }
      }
    }
    return initial
  })

  // ── Bookings (one per assignment) ──
  const [bookings, setBookings] = useState<Record<string, Booking>>(() => {
    const initial: Record<string, Booking> = {}
    if (defaultValues?.bookings) {
      for (const b of defaultValues.bookings) {
        initial[b.registration_group] = b as Booking
      }
    }
    return initial
  })

  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('workers')
        .select('id, full_name, qualified_registration_groups, ndis_screening_valid, police_check_valid, code_of_conduct_signed, orientation_completed')
        .eq('status', 'active')
      return (data || []) as Worker[]
    },
  })

  function getWorkersForGroup(groupCode: string) {
    return workers.filter((w) => w.qualified_registration_groups?.includes(groupCode))
  }
  function hasScreeningIssues(worker: Worker) {
    return !worker.ndis_screening_valid || !worker.police_check_valid || !worker.code_of_conduct_signed || !worker.orientation_completed
  }
  function getMissingScreening(worker: Worker) {
    const missing: string[] = []
    if (!worker.ndis_screening_valid) missing.push('NDIS Screening')
    if (!worker.police_check_valid) missing.push('Police Check')
    if (!worker.code_of_conduct_signed) missing.push('Code of Conduct')
    if (!worker.orientation_completed) missing.push('Orientation Module')
    return missing
  }

  function assignWorker(groupCode: string, workerId: string) {
    const worker = workers.find((w) => w.id === workerId)
    if (!worker) return
    setAssignments((prev) => ({
      ...prev,
      [groupCode]: { worker_id: workerId, worker_name: worker.full_name },
    }))
    // Auto-create booking stub if none exists
    if (!bookings[groupCode]) {
      const isFirst = Object.keys(bookings).length === 0
      setBookings((prev) => ({
        ...prev,
        [groupCode]: {
          worker_id: workerId,
          registration_group: groupCode,
          booking_date: '',
          start_time: '09:00',
          end_time: '11:00',
          recurrence: 'weekly',
          notes: isFirst ? 'First visit - bring Risk Assessment to complete' : '',
        },
      }))
    } else {
      // Update worker_id on existing booking
      setBookings((prev) => ({
        ...prev,
        [groupCode]: { ...prev[groupCode], worker_id: workerId },
      }))
    }
  }

  function updateBooking(groupCode: string, field: keyof Booking, value: string) {
    setBookings((prev) => ({
      ...prev,
      [groupCode]: { ...prev[groupCode], [field]: value },
    }))
  }

  function handleSubmit() {
    const data: Stage4Data = {
      assignments: Object.entries(assignments).map(([registration_group, { worker_id, worker_name }]) => ({
        worker_id,
        worker_name,
        registration_group,
      })),
      bookings: Object.values(bookings),
    }
    onSubmit(data)
  }

  const allAssigned = servicesRequested.every((code) => assignments[code])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Assign Workers & Schedule First Visits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            For each service, pick a qualified worker then schedule their first visit — all in one step.
          </p>
        </CardContent>
      </Card>

      {workersLoading ? (
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Loading workers...</p></CardContent></Card>
      ) : (
        servicesRequested.map((groupCode, idx) => {
          const availableWorkers = getWorkersForGroup(groupCode)
          const groupName = ALL_REGISTRATION_GROUPS[groupCode as keyof typeof ALL_REGISTRATION_GROUPS] || groupCode
          const currentAssignment = assignments[groupCode]
          const booking = bookings[groupCode]

          return (
            <Card key={groupCode} className={currentAssignment ? 'border-green-200' : 'border-border'}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{groupCode}</Badge>
                    {groupName}
                  </CardTitle>
                  {currentAssignment && (
                    <Badge variant="default" className="bg-green-600">
                      <UserCheck className="h-3 w-3 mr-1" /> Assigned
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Worker Selection */}
                {availableWorkers.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>No qualified workers available for this service.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm">Assign Worker</Label>
                    <Select value={currentAssignment?.worker_id || ''} onValueChange={(v) => v && assignWorker(groupCode, v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a worker..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableWorkers.map((worker) => {
                          const blocked = hasScreeningIssues(worker)
                          const missing = getMissingScreening(worker)
                          return (
                            <SelectItem key={worker.id} value={worker.id} disabled={blocked}>
                              <div className="flex items-center gap-2">
                                {blocked && <ShieldAlert className="h-3 w-3 text-destructive shrink-0" />}
                                <span>{worker.full_name}</span>
                                {blocked && <span className="text-xs text-destructive">(Missing: {missing.join(', ')})</span>}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Booking fields — shown once worker is assigned */}
                {currentAssignment && booking && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Schedule first visit for {currentAssignment.worker_name}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Booking Date *</Label>
                        <Input type="date" value={booking.booking_date} onChange={(e) => updateBooking(groupCode, 'booking_date', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Time *</Label>
                        <Input type="time" value={booking.start_time} onChange={(e) => updateBooking(groupCode, 'start_time', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time *</Label>
                        <Input type="time" value={booking.end_time} onChange={(e) => updateBooking(groupCode, 'end_time', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Recurrence</Label>
                      <Select value={booking.recurrence} onValueChange={(v) => v && updateBooking(groupCode, 'recurrence', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one_off">One-off</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="fortnightly">Fortnightly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={booking.notes} onChange={(e) => updateBooking(groupCode, 'notes', e.target.value)} placeholder="Any notes for this booking..." rows={2} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })
      )}

      {!allAssigned && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Not all services have a worker assigned. You can still save and assign workers later.</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleSubmit} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save & Continue'}</Button>
      </div>
    </div>
  )
}
