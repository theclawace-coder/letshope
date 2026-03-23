import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { progressNoteFormSchema, type ProgressNoteFormData } from '../schemas'
import { VoiceRecorderButton } from './VoiceRecorderButton'
import { useWorkers } from '@/features/workers/hooks/useWorkers'
import { useParticipants } from '@/features/participants/hooks/useParticipants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { REGISTRATION_GROUPS, CONCERN_TYPES, CONCERN_SEVERITIES } from '@/lib/constants'
import { format } from 'date-fns'
import { useState } from 'react'

interface ProgressNoteFormProps {
  onSubmit: (data: ProgressNoteFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<ProgressNoteFormData>
}

export function ProgressNoteForm({ onSubmit, isSubmitting, defaultValues }: ProgressNoteFormProps) {
  const { data: workers } = useWorkers('active')
  const { data: participants } = useParticipants('active')
  const [goalInput, setGoalInput] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProgressNoteFormData>({
    resolver: zodResolver(progressNoteFormSchema),
    defaultValues: {
      note_date: format(new Date(), 'yyyy-MM-dd'),
      goals_addressed: [],
      concern_flagged: false,
      ...defaultValues,
    },
  })

  const concernFlagged = watch('concern_flagged')
  const goalsAddressed = watch('goals_addressed') || []

  const addGoal = () => {
    const trimmed = goalInput.trim()
    if (trimmed && !goalsAddressed.includes(trimmed)) {
      setValue('goals_addressed', [...goalsAddressed, trimmed])
      setGoalInput('')
    }
  }

  const removeGoal = (goal: string) => {
    setValue('goals_addressed', goalsAddressed.filter((g) => g !== goal))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Note Details</CardTitle>
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
              <Label>Worker *</Label>
              <Select
                value={watch('worker_id') || ''}
                onValueChange={(v) => setValue('worker_id', v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.first_name} {w.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.worker_id && (
                <p className="text-sm text-destructive">{errors.worker_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" {...register('note_date')} />
              {errors.note_date && (
                <p className="text-sm text-destructive">{errors.note_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select
                value={watch('service_type') || ''}
                onValueChange={(v) => setValue('service_type', v ?? undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REGISTRATION_GROUPS).map(([code, group]) => (
                    <SelectItem key={code} value={code}>
                      {code} - {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Goals Addressed</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type a goal and press Enter..."
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addGoal()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addGoal}>
                Add
              </Button>
            </div>
            {goalsAddressed.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {goalsAddressed.map((goal) => (
                  <Badge key={goal} variant="secondary" className="gap-1">
                    {goal}
                    <button type="button" onClick={() => removeGoal(goal)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observations & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Presentation / Observations</Label>
            <Textarea
              placeholder="Participant's presentation, mood, physical state..."
              {...register('presentation')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Actions Taken</Label>
            <Textarea
              placeholder="Activities completed, support provided..."
              {...register('actions_taken')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Note Content *</Label>
              <VoiceRecorderButton
                onTranscript={(text) => {
                  const current = watch('content') || ''
                  setValue('content', current ? `${current}\n\n${text}` : text)
                }}
              />
            </div>
            <Textarea
              placeholder="Main progress note content..."
              {...register('content')}
              rows={6}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="concern_flagged"
              checked={concernFlagged}
              onCheckedChange={(checked) => setValue('concern_flagged', !!checked)}
            />
            <Label htmlFor="concern_flagged" className="text-sm font-medium cursor-pointer">
              Flag a concern about this participant
            </Label>
          </div>

          {concernFlagged && (
            <div className="mt-4 space-y-4 pl-6 border-l-2 border-orange-300">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Concern Type *</Label>
                  <Select
                    value={watch('concern_type') || ''}
                    onValueChange={(v) => setValue('concern_type', v ?? undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONCERN_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Severity *</Label>
                  <Select
                    value={watch('concern_severity') || ''}
                    onValueChange={(v) => setValue('concern_severity', v ?? undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONCERN_SEVERITIES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="flex items-center gap-2">
                            <span className={`inline-block h-2 w-2 rounded-full ${s.color.split(' ')[0]}`} />
                            {s.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Concern Title *</Label>
                <Input placeholder="Brief title..." {...register('concern_title')} />
              </div>

              <div className="space-y-2">
                <Label>Concern Description *</Label>
                <Textarea
                  placeholder="Detailed description of the concern..."
                  {...register('concern_description')}
                  rows={3}
                />
              </div>
              {errors.concern_type && (
                <p className="text-sm text-destructive">{errors.concern_type.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Progress Note
        </Button>
      </div>
    </form>
  )
}
