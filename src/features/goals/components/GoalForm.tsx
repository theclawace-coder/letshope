import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { goalFormSchema, type GoalFormData } from '../schemas'
import { useParticipants } from '@/features/participants/hooks/useParticipants'
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
import { Loader2 } from 'lucide-react'
import { GOAL_DOMAINS, GOAL_TIMEFRAMES, GOAL_PRIORITIES } from '@/lib/constants'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'

interface GoalFormProps {
  onSubmit: (data: GoalFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<GoalFormData>
}

export function GoalForm({ onSubmit, isSubmitting, defaultValues }: GoalFormProps) {
  const { data: participants } = useParticipants('active')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      timeframe: 'short_term',
      priority: 'medium',
      linked_registration_groups: [],
      ...defaultValues,
    },
  })

  const selectedGroups = watch('linked_registration_groups') || []

  const toggleGroup = (code: string) => {
    const current = selectedGroups
    if (current.includes(code)) {
      setValue('linked_registration_groups', current.filter((c) => c !== code))
    } else {
      setValue('linked_registration_groups', [...current, code])
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Goal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Label>Goal Title *</Label>
            <Input placeholder="e.g. Improve independent meal preparation" {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe what the participant wants to achieve and why it matters to them..."
              {...register('description')}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>NDIS Outcome Domain *</Label>
              <Select
                value={watch('domain') || ''}
                onValueChange={(v) => v && setValue('domain', v as GoalFormData['domain'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_DOMAINS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.domain && (
                <p className="text-sm text-destructive">{errors.domain.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select
                value={watch('timeframe') || 'short_term'}
                onValueChange={(v) => v && setValue('timeframe', v as GoalFormData['timeframe'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TIMEFRAMES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={watch('priority') || 'medium'}
                onValueChange={(v) => v && setValue('priority', v as GoalFormData['priority'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${p.color.split(' ')[0]}`} />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Measurement & Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" {...register('start_date')} />
            </div>
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input type="date" {...register('target_date')} />
            </div>
            <div className="space-y-2">
              <Label>Review Date</Label>
              <Input type="date" {...register('review_date')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Baseline Measure</Label>
              <Textarea
                placeholder="Where is the participant starting from? e.g. Currently requires full support with meal prep"
                {...register('baseline_measure')}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Measure</Label>
              <Textarea
                placeholder="What does success look like? e.g. Can independently prepare 3 simple meals per week"
                {...register('target_measure')}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked Registration Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Select the NDIS registration groups that support this goal (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ALL_REGISTRATION_GROUPS).map(([code, name]) => (
              <button
                key={code}
                type="button"
                onClick={() => toggleGroup(code)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedGroups.includes(code)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted hover:bg-muted/80 border-transparent'
                }`}
              >
                {code} - {name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Goal
        </Button>
      </div>
    </form>
  )
}
