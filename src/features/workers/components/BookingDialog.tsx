import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingFormSchema, type BookingFormData } from '../schemas'
import {
  useCreateBooking,
  useUpdateBooking,
  useBookingConflicts,
  useCreateRecurringSeries,
  useUpdateBookingSeries,
  useCancelBookingSeries,
  type SeriesEditScope,
} from '../hooks/useBookings'
import { useWorkers } from '../hooks/useWorkers'
import { useParticipants } from '@/features/participants/hooks/useParticipants'
import { useNdisPriceGuide } from '@/features/invoices/hooks/useInvoices'
import { calculateBookingCost } from '../utils/calculateBookingRate'
import { expandRecurrenceDates } from '../utils/expandRecurrence'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AlertTriangle, LogIn, LogOut, FileText, Loader2, DollarSign, ShieldAlert, Ban, Users, Repeat, CalendarDays, Car } from 'lucide-react'
import { useCheckIn, useCheckOut, captureLocation } from '../hooks/useShiftCheckInOut'
import { formatDuration } from '@/lib/formatters'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { format, addWeeks } from 'date-fns'
import type { BookingWithNames } from '../hooks/useBookings'
import { useBudgetGuardrail } from '../hooks/useBudgetGuardrail'
import { CancellationDialog } from './CancellationDialog'
import { isBookingCancellable } from '../utils/cancellationRules'

const GROUP_RATIOS = ['1:2', '1:3', '1:4', '1:5'] as const

function isPartOfSeries(booking: BookingWithNames | null | undefined): boolean {
  if (!booking) return false
  return !!(booking.recurrence_parent_id) || (booking.recurrence !== 'one_off' && booking.recurrence !== null)
}

/** Inline dialog for choosing series scope */
function SeriesScopeDialog({
  open,
  onClose,
  title,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  title: string
  onSelect: (scope: SeriesEditScope) => void
}) {
  if (!open) return null
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">This booking is part of a recurring series.</p>
        <div className="flex flex-col gap-2 mt-2">
          <Button variant="outline" onClick={() => onSelect('this')}>
            This booking only
          </Button>
          <Button variant="outline" onClick={() => onSelect('this_and_future')}>
            This and future bookings
          </Button>
          <Button variant="outline" onClick={() => onSelect('all')}>
            All bookings in series
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface BookingDialogProps {
  open: boolean
  onClose: () => void
  booking?: BookingWithNames | null
  defaultDate?: string
}

export function BookingDialog({ open, onClose, booking, defaultDate }: BookingDialogProps) {
  const navigate = useNavigate()
  const createBooking = useCreateBooking()
  const updateBooking = useUpdateBooking()
  const createRecurringSeries = useCreateRecurringSeries()
  const updateBookingSeries = useUpdateBookingSeries()
  const cancelBookingSeries = useCancelBookingSeries()
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()
  const { data: workers } = useWorkers('active')
  const { data: participants } = useParticipants()
  const { data: priceGuideItems } = useNdisPriceGuide()

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false)
  const [scopeAction, setScopeAction] = useState<'update' | 'cancel'>('update')
  const [pendingFormData, setPendingFormData] = useState<BookingFormData | null>(null)

  const isToday = booking?.booking_date === format(new Date(), 'yyyy-MM-dd')
  const canCancel = booking && isBookingCancellable(booking.status)
  const isSeries = isPartOfSeries(booking)

  const handleCheckIn = async () => {
    if (!booking) return
    try {
      const location = await captureLocation()
      await checkIn.mutateAsync({ bookingId: booking.id, location })
      toast.success('Checked in successfully')
      onClose()
    } catch {
      toast.error('Failed to check in')
    }
  }

  const handleCheckOut = async () => {
    if (!booking) return
    try {
      const location = await captureLocation()
      await checkOut.mutateAsync({ bookingId: booking.id, location })
      toast.success('Checked out successfully')
      onClose()
    } catch {
      toast.error('Failed to check out')
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: booking
      ? {
          participant_id: booking.participant_id,
          worker_id: booking.worker_id || '',
          registration_group: booking.registration_group || '',
          service_description: booking.service_description || '',
          support_item_number: booking.support_item_number || '',
          booking_date: booking.booking_date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          recurrence: (booking.recurrence as BookingFormData['recurrence']) || 'one_off',
          recurrence_end_date: booking.recurrence_end_date || '',
          notes: booking.notes || '',
          is_group_booking: booking.is_group_booking ?? false,
          group_participant_ids: booking.group_participants?.map((gp) => gp.participant_id) ?? [],
          group_ratio: (booking.group_ratio as BookingFormData['group_ratio']) || undefined,
          travel_time_minutes: booking.travel_time_minutes ?? null,
          travel_distance_km: booking.travel_distance_km ?? null,
        }
      : {
          booking_date: defaultDate || '',
          recurrence: 'one_off',
          recurrence_end_date: '',
          start_time: '09:00',
          end_time: '10:00',
          is_group_booking: false,
          group_participant_ids: [],
          travel_time_minutes: null,
          travel_distance_km: null,
        },
  })

  const workerId = watch('worker_id')
  const bookingDate = watch('booking_date')
  const startTime = watch('start_time')
  const endTime = watch('end_time')
  const supportItemNumber = watch('support_item_number')
  const recurrence = watch('recurrence')
  const recurrenceEndDate = watch('recurrence_end_date')
  const isGroupBooking = watch('is_group_booking')
  const groupParticipantIds = watch('group_participant_ids') ?? []
  const groupRatio = watch('group_ratio')

  const isRecurring = recurrence !== 'one_off'

  // Preview how many bookings will be created for a recurring series
  const previewCount = useMemo(() => {
    if (!isRecurring || !bookingDate || !recurrenceEndDate) return 0
    return expandRecurrenceDates({
      startDate: bookingDate,
      endDate: recurrenceEndDate,
      recurrence: recurrence as 'weekly' | 'fortnightly',
    }).length
  }, [isRecurring, bookingDate, recurrenceEndDate, recurrence])

  const selectedPriceItem = useMemo(
    () => priceGuideItems?.find((item) => item.support_item_number === supportItemNumber),
    [priceGuideItems, supportItemNumber],
  )

  const rateEstimate = useMemo(() => {
    if (!selectedPriceItem || !startTime || !endTime) return null
    return calculateBookingCost(selectedPriceItem, startTime, endTime)
  }, [selectedPriceItem, startTime, endTime])

  // Per-participant cost for group bookings (total cost / number of participants)
  const groupCostPerParticipant = useMemo(() => {
    if (!isGroupBooking || !rateEstimate || groupParticipantIds.length === 0) return null
    return Math.round((rateEstimate.estimatedCost / groupParticipantIds.length) * 100) / 100
  }, [isGroupBooking, rateEstimate, groupParticipantIds.length])

  const participantId = watch('participant_id')

  const { data: conflicts } = useBookingConflicts(
    workerId,
    bookingDate,
    startTime,
    endTime,
    booking?.id,
  )

  const { data: budgetGuardrail } = useBudgetGuardrail(
    participantId,
    rateEstimate?.estimatedCost ?? 0,
    selectedPriceItem?.category ?? null,
    booking?.id,
  )

  function buildAllFields(data: BookingFormData) {
    const isGroup = data.is_group_booking && (data.group_participant_ids?.length ?? 0) >= 2
    const groupIds = isGroup ? data.group_participant_ids! : undefined
    return {
      fields: {
        participant_id: data.participant_id, worker_id: data.worker_id,
        registration_group: data.registration_group || null,
        service_description: data.service_description || null,
        booking_date: data.booking_date, start_time: data.start_time, end_time: data.end_time,
        recurrence: data.recurrence, recurrence_end_date: data.recurrence_end_date || null,
        notes: data.notes || null,
        support_item_number: data.support_item_number || null,
        unit_price: rateEstimate?.unitPrice ?? null,
        estimated_cost: rateEstimate?.estimatedCost ?? null,
        is_group_booking: isGroup,
        group_ratio: isGroup ? (data.group_ratio || null) : null,
        group_size: isGroup ? groupIds!.length : null,
        travel_time_minutes: data.travel_time_minutes || null,
        travel_distance_km: data.travel_distance_km || null,
      },
      isGroup, groupIds,
    }
  }

  async function onSubmit(data: BookingFormData) {
    try {
      const { fields, isGroup, groupIds } = buildAllFields(data)
      if (booking) {
        if (isSeries) { setPendingFormData(data); setScopeAction('update'); setScopeDialogOpen(true); return }
        await updateBooking.mutateAsync({ id: booking.id, data: { ...fields, updated_at: new Date().toISOString() }, groupParticipantIds: isGroup ? groupIds : [] })
        toast.success('Booking updated')
      } else {
        if (isRecurring && recurrenceEndDate) {
          const dates = expandRecurrenceDates({ startDate: data.booking_date, endDate: recurrenceEndDate, recurrence: data.recurrence as 'weekly' | 'fortnightly' })
          const result = await createRecurringSeries.mutateAsync({ baseBooking: { ...fields, status: 'scheduled' }, dates, groupParticipantIds: isGroup ? groupIds : undefined })
          toast.success('Created ' + result.count + ' recurring bookings')
        } else {
          await createBooking.mutateAsync({ bookingData: { ...fields, status: 'scheduled' }, groupParticipantIds: groupIds })
          toast.success('Booking created')
        }
      }
      onClose()
    } catch { toast.error('Failed to save booking') }
  }

  async function handleSeriesScope(scope: SeriesEditScope) {
    setScopeDialogOpen(false)
    if (!booking || !pendingFormData) return
    try {
      if (scopeAction === 'update') {
        const { fields } = buildAllFields(pendingFormData)
        const upd: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() }
        if (scope !== 'this') delete upd.booking_date
        await updateBookingSeries.mutateAsync({ booking, data: upd, scope })
        toast.success(scope === 'this' ? 'Booking updated' : scope === 'all' ? 'All bookings in series updated' : 'This and future bookings updated')
      } else {
        await cancelBookingSeries.mutateAsync({ booking, scope, cancelledBy: 'provider', cancellationReason: 'Series cancellation' })
        toast.success(scope === 'this' ? 'Booking cancelled' : scope === 'all' ? 'All bookings in series cancelled' : 'This and future bookings cancelled')
      }
      onClose()
    } catch { toast.error('Failed to update series') }
  }

  function handleCancelClick() {
    if (!booking) return
    if (isSeries) { setScopeAction('cancel'); setScopeDialogOpen(true) }
    else setShowCancelDialog(true)
  }

  const isSubmitting = createBooking.isPending || updateBooking.isPending || createRecurringSeries.isPending || updateBookingSeries.isPending || cancelBookingSeries.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{booking ? 'Edit Booking' : 'New Booking'}{isSeries && (<span className="inline-flex items-center gap-1 text-xs font-normal bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"><Repeat className="h-3 w-3" />Series</span>)}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Group Booking Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="group-toggle" className="cursor-pointer">Group Booking</Label>
            </div>
            <Switch
              id="group-toggle"
              checked={isGroupBooking ?? false}
              onCheckedChange={(checked) => {
                setValue('is_group_booking', checked)
                if (!checked) {
                  setValue('group_participant_ids', [])
                  setValue('group_ratio', undefined)
                }
              }}
            />
          </div>

          {/* Single participant select (non-group mode) */}
          {!isGroupBooking && (
            <div className="space-y-2">
              <Label>Participant *</Label>
              <Select
                value={watch('participant_id') || ''}
                onValueChange={(v) => setValue('participant_id', v || '', { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  {participants?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.participant_id && <p className="text-xs text-destructive">{errors.participant_id.message}</p>}
            </div>
          )}

          {/* Group booking: multi-participant selector + ratio */}
          {isGroupBooking && (
            <>
              <div className="space-y-2">
                <Label>Primary Participant *</Label>
                <Select
                  value={watch('participant_id') || ''}
                  onValueChange={(v) => setValue('participant_id', v || '', { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">The primary participant for this booking record.</p>
                {errors.participant_id && <p className="text-xs text-destructive">{errors.participant_id.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Group Participants *</Label>
                  <Badge variant="secondary">{groupParticipantIds.length} selected</Badge>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1">
                  {participants?.map((p) => {
                    const isSelected = groupParticipantIds.includes(p.id)
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const current = groupParticipantIds
                            const next = checked
                              ? [...current, p.id]
                              : current.filter((id) => id !== p.id)
                            setValue('group_participant_ids', next, { shouldValidate: true })
                          }}
                        />
                        {p.first_name} {p.last_name}
                      </label>
                    )
                  })}
                </div>
                {errors.group_participant_ids && (
                  <p className="text-xs text-destructive">{(errors.group_participant_ids as { message?: string }).message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Worker : Participant Ratio</Label>
                <Select
                  value={groupRatio || ''}
                  onValueChange={(v) => setValue('group_ratio', (v || undefined) as BookingFormData['group_ratio'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_RATIOS.map((ratio) => (
                      <SelectItem key={ratio} value={ratio}>
                        {ratio} (1 worker to {ratio.split(':')[1]} participants)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Group cost summary */}
              {rateEstimate && groupParticipantIds.length > 0 && (
                <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-blue-600" />
                    Group Cost Summary
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="block text-xs">Total Cost</span>
                      <span className="font-medium text-foreground">${rateEstimate.estimatedCost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="block text-xs">Participants</span>
                      <span className="font-medium text-foreground">{groupParticipantIds.length}</span>
                    </div>
                    <div>
                      <span className="block text-xs">Per Person</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-400">${groupCostPerParticipant?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Worker *</Label>
            <Select
              value={watch('worker_id') || ''}
              onValueChange={(v) => setValue('worker_id', v || '', { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                {workers?.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.first_name} {w.last_name} — {w.role_title || 'No role'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.worker_id && <p className="text-xs text-destructive">{errors.worker_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking_date">Date *</Label>
            <Input id="booking_date" type="date" {...register('booking_date')} />
            {errors.booking_date && <p className="text-xs text-destructive">{errors.booking_date.message}</p>}
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input id="start_time" type="time" {...register('start_time')} />
              {errors.start_time && <p className="text-xs text-destructive">{errors.start_time.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input id="end_time" type="time" {...register('end_time')} />
              {errors.end_time && <p className="text-xs text-destructive">{errors.end_time.message}</p>}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>NDIS Support Item</Label>
            <Select
              value={watch('support_item_number') || ''}
              onValueChange={(v) => {
                setValue('support_item_number', v || '', { shouldValidate: true })
                const item = priceGuideItems?.find((i) => i.support_item_number === v)
                if (item) {
                  setValue('registration_group', item.registration_group)
                  setValue('service_description', item.support_item_name)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select support item (optional)" />
              </SelectTrigger>
              <SelectContent>
                {priceGuideItems?.map((item) => (
                  <SelectItem key={item.id} value={item.support_item_number}>
                    {item.support_item_number} — {item.support_item_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {rateEstimate && selectedPriceItem && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-green-600" />
                Rate Estimate
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                <div>
                  <span className="block text-xs">Rate</span>
                  <span className="font-medium text-foreground">${rateEstimate.unitPrice.toFixed(2)}/{selectedPriceItem.unit}</span>
                </div>
                <div>
                  <span className="block text-xs">Duration</span>
                  <span className="font-medium text-foreground">{rateEstimate.quantity.toFixed(2)} {selectedPriceItem.unit}(s)</span>
                </div>
                <div>
                  <span className="block text-xs">Est. Cost</span>
                  <span className="font-semibold text-green-700">${rateEstimate.estimatedCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {budgetGuardrail && budgetGuardrail.level !== 'none' && (
            <Alert variant={budgetGuardrail.level === 'exceeded' ? 'destructive' : 'default'} className={budgetGuardrail.level === 'approaching' ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : ''}>
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                {budgetGuardrail.level === 'exceeded' ? (
                  <p className="font-medium">
                    This booking would exceed the participant&apos;s plan budget.
                  </p>
                ) : (
                  <p className="font-medium">
                    This booking will bring the participant above 80% budget utilisation.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>Plan budget:</div>
                  <div className="font-medium">${budgetGuardrail.totalBudget.toFixed(2)}</div>
                  <div>Invoiced:</div>
                  <div className="font-medium">${budgetGuardrail.invoicedTotal.toFixed(2)}</div>
                  <div>Scheduled bookings:</div>
                  <div className="font-medium">${budgetGuardrail.scheduledTotal.toFixed(2)}</div>
                  <div>Remaining before this:</div>
                  <div className={`font-medium ${budgetGuardrail.remaining < 0 ? 'text-destructive' : ''}`}>
                    ${budgetGuardrail.remaining.toFixed(2)}
                  </div>
                  {rateEstimate && (
                    <>
                      <div>After this booking:</div>
                      <div className={`font-semibold ${budgetGuardrail.wouldExceedTotal ? 'text-destructive' : ''}`}>
                        ${(budgetGuardrail.remaining - rateEstimate.estimatedCost).toFixed(2)}
                      </div>
                    </>
                  )}
                </div>
                {budgetGuardrail.wouldExceedCategory && budgetGuardrail.categoryBudget !== null && selectedPriceItem && (
                  <p className="text-xs mt-1 pt-1 border-t">
                    {selectedPriceItem.category === 'core' ? 'Core' : selectedPriceItem.category === 'capacity_building' ? 'Capacity Building' : 'Capital'} budget: ${budgetGuardrail.categoryBudget.toFixed(2)} — remaining: ${budgetGuardrail.categoryRemaining?.toFixed(2)}
                  </p>
                )}
                {budgetGuardrail.level === 'exceeded' && (
                  <p className="text-xs italic">You can still save this booking, but it may not be covered by the plan.</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Recurrence</Label>
            <Select
              value={watch('recurrence')}
              onValueChange={(v) => { const val = (v || 'one_off') as BookingFormData['recurrence']; setValue('recurrence', val, { shouldValidate: true }); if (val !== 'one_off' && bookingDate && !recurrenceEndDate) { const weeks = val === 'weekly' ? 12 : 24; const defaultEnd = format(addWeeks(new Date(bookingDate), weeks), 'yyyy-MM-dd'); setValue('recurrence_end_date', defaultEnd, { shouldValidate: true }); } }}
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

          {isRecurring && (
            <>
              <div className="space-y-2">
                <Label htmlFor="recurrence_end_date">Series End Date *</Label>
                <Input id="recurrence_end_date" type="date" {...register('recurrence_end_date')} min={bookingDate} />
                {errors.recurrence_end_date && (<p className="text-xs text-destructive">{errors.recurrence_end_date.message}</p>)}
              </div>
              {previewCount > 0 && !booking && (
                <div className="rounded-lg border bg-blue-50 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                    <CalendarDays className="h-4 w-4" />
                    {previewCount} booking{previewCount !== 1 ? 's' : ''} will be created
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Every {recurrence === 'weekly' ? 'week' : '2 weeks'} from {bookingDate} to {recurrenceEndDate}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={2} placeholder="Optional notes..." />
          </div>

          {/* Travel Time */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Car className="h-4 w-4 text-muted-foreground" />
              Travel Time
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="travel_time_minutes">Minutes</Label>
                <Input
                  id="travel_time_minutes"
                  type="number"
                  min={0}
                  max={480}
                  placeholder="e.g. 30"
                  {...register('travel_time_minutes')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="travel_distance_km">Distance (km)</Label>
                <Input
                  id="travel_distance_km"
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="e.g. 15.5"
                  {...register('travel_distance_km')}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Log travel time and distance for NDIS provider travel claims.
            </p>
          </div>

          {conflicts?.hasConflict && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This worker already has {conflicts.conflictingBookings.length} booking(s) at this time. You can still create this booking, but please verify there is no conflict.
              </AlertDescription>
            </Alert>
          )}

          {booking && isToday && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Shift Status</span>
                  <StatusBadge status={booking.status} />
                </div>

                {booking.status === 'scheduled' && (
                  <Button type="button" className="w-full" onClick={handleCheckIn} disabled={checkIn.isPending}>
                    {checkIn.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
                    Check In
                  </Button>
                )}

                {booking.status === 'checked_in' && (
                  <>
                    {booking.actual_start_time && (
                      <p className="text-sm text-muted-foreground">
                        Checked in at {new Date(booking.actual_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    <Button type="button" className="w-full" variant="secondary" onClick={handleCheckOut} disabled={checkOut.isPending}>
                      {checkOut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                      Check Out
                    </Button>
                  </>
                )}

                {booking.status === 'checked_out' && booking.actual_start_time && booking.actual_end_time && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Duration: {formatDuration(booking.actual_start_time, booking.actual_end_time)}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        onClose()
                        navigate(`/progress-notes/new?bookingId=${booking.id}&participantId=${booking.participant_id}&workerId=${booking.worker_id}`)
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Write Progress Note
                    </Button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Cancellation info for already-cancelled bookings */}
          {booking && (booking.status === 'cancelled' || booking.status === 'no_show') && booking.cancellation_type && (
            <>
              <Separator />
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1 text-sm">
                <div className="font-medium text-gray-700">Cancellation Details</div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{booking.cancellation_type.replace('_', ' ')}</span>
                </div>
                {booking.cancelled_by && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cancelled by</span>
                    <span className="font-medium capitalize">{booking.cancelled_by}</span>
                  </div>
                )}
                {booking.cancelled_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cancelled at</span>
                    <span className="font-medium">{format(new Date(booking.cancelled_at), 'd MMM yyyy h:mm a')}</span>
                  </div>
                )}
                {booking.cancellation_charge != null && booking.cancellation_charge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Charge</span>
                    <span className="font-semibold text-orange-700">${booking.cancellation_charge.toFixed(2)}</span>
                  </div>
                )}
                {booking.cancellation_reason && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason</span>
                    <span className="font-medium">{booking.cancellation_reason}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {canCancel && (
              <Button
                type="button"
                variant="destructive"
                className="sm:mr-auto"
                onClick={handleCancelClick}
              >
                <Ban className="h-4 w-4 mr-2" />
                Cancel Booking{isSeries ? '...' : ''}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              {booking && !canCancel ? 'Close' : 'Cancel'}
            </Button>
            {(!booking || canCancel) && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : booking ? (isSeries ? 'Update Booking...' : 'Update Booking') : isRecurring ? ('Create ' + previewCount + ' Bookings') : 'Create Booking'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>

      {booking && canCancel && (
        <CancellationDialog
          open={showCancelDialog}
          onClose={() => {
            setShowCancelDialog(false)
            onClose()
          }}
          booking={booking}
        />
      )}

      <SeriesScopeDialog
        open={scopeDialogOpen}
        onClose={() => setScopeDialogOpen(false)}
        title={scopeAction === 'update' ? 'Update Recurring Booking' : 'Cancel Recurring Booking'}
        onSelect={handleSeriesScope}
      />
    </Dialog>
  )
}
