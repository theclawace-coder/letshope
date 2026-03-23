import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { incidentFormSchema, type IncidentFormData } from '../schemas'
import { useParticipants } from '@/features/participants/hooks/useParticipants'
import { useWorkers } from '@/features/workers/hooks/useWorkers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertTriangle } from 'lucide-react'
import { INCIDENT_TYPES, INCIDENT_SEVERITIES } from '@/lib/constants'

interface IncidentFormProps {
  onSubmit: (data: IncidentFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<IncidentFormData>
}

export function IncidentForm({ onSubmit, isSubmitting, defaultValues }: IncidentFormProps) {
  const { data: participants } = useParticipants('active')
  const { data: workers } = useWorkers()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      incident_date: new Date().toISOString().split('T')[0],
      is_reportable: false,
      ...defaultValues,
    },
  })

  const severity = watch('severity')
  const incidentType = watch('incident_type')
  const isReportable = watch('is_reportable')

  // Auto-flag reportable for certain types/severities
  const shouldAutoReport =
    severity === 'critical' || severity === 'major' ||
    incidentType === 'death' || incidentType === 'abuse_neglect' ||
    incidentType === 'sexual_misconduct'

  if (shouldAutoReport && !isReportable) {
    setValue('is_reportable', true)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incident Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Participant *</Label>
              <Select
                value={watch('participant_id') || ''}
                onValueChange={(v) => setValue('participant_id', v ?? '')}
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
              {errors.participant_id && (
                <p className="text-sm text-destructive">{errors.participant_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Worker Involved</Label>
              <Select
                value={watch('worker_id') || ''}
                onValueChange={(v) => setValue('worker_id', v === 'none' ? '' : v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select worker (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {workers?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.first_name} {w.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Incident Date *</Label>
              <Input type="date" {...register('incident_date')} />
              {errors.incident_date && (
                <p className="text-sm text-destructive">{errors.incident_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Incident Time</Label>
              <Input type="time" {...register('incident_time')} />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="Where did it occur?" {...register('location')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Incident Type *</Label>
              <Select
                value={watch('incident_type') || ''}
                onValueChange={(v) => v && setValue('incident_type', v as IncidentFormData['incident_type'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.incident_type && (
                <p className="text-sm text-destructive">{errors.incident_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Severity *</Label>
              <Select
                value={watch('severity') || ''}
                onValueChange={(v) => v && setValue('severity', v as IncidentFormData['severity'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_SEVERITIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${s.color.split(' ')[0]}`} />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.severity && (
                <p className="text-sm text-destructive">{errors.severity.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Provide a detailed description of what happened, including the sequence of events, people involved, and any immediate actions taken..."
              {...register('description')}
              rows={5}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_reportable"
              {...register('is_reportable')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_reportable" className="font-normal">
              Reportable incident (NDIS Quality & Safeguards Commission)
            </Label>
          </div>

          {isReportable && (
            <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">NDIS Reportable Incident</p>
                <p className="mt-1">
                  This incident must be reported to the NDIS Quality & Safeguards Commission
                  within 24 hours for immediate notification, and a full report within 5 business days.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Log Incident
        </Button>
      </div>
    </form>
  )
}
