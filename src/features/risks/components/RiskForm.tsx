import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { riskFormSchema, type RiskFormData } from '../schemas'
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
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import {
  RISK_CATEGORIES,
  RISK_LIKELIHOODS,
  RISK_CONSEQUENCES,
  RISK_LEVELS,
  RISK_SOURCES,
  calculateRiskLevel,
} from '@/lib/constants'

interface RiskFormProps {
  onSubmit: (data: RiskFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<RiskFormData>
}

export function RiskForm({ onSubmit, isSubmitting, defaultValues }: RiskFormProps) {
  const { data: participants } = useParticipants('active')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RiskFormData>({
    resolver: zodResolver(riskFormSchema),
    defaultValues: {
      identified_date: new Date().toISOString().split('T')[0],
      likelihood: 'possible',
      consequence: 'moderate',
      ...defaultValues,
    },
  })

  const likelihood = watch('likelihood')
  const consequence = watch('consequence')
  const calculatedLevel = likelihood && consequence ? calculateRiskLevel(likelihood, consequence) : null
  const levelInfo = RISK_LEVELS.find((l) => l.value === calculatedLevel)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Details</CardTitle>
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={watch('category') || ''}
                onValueChange={(v) => v && setValue('category', v as RiskFormData['category'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={watch('source') || ''}
                onValueChange={(v) => setValue('source', v ?? undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How was this identified?" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input placeholder="Brief title for this risk..." {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Describe the risk in detail: what could happen, who is affected, and what circumstances may trigger it..."
              {...register('description')}
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date Identified *</Label>
            <Input type="date" {...register('identified_date')} />
            {errors.identified_date && (
              <p className="text-sm text-destructive">{errors.identified_date.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Rating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Likelihood *</Label>
              <Select
                value={watch('likelihood') || ''}
                onValueChange={(v) => v && setValue('likelihood', v as RiskFormData['likelihood'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select likelihood" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_LIKELIHOODS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.likelihood && (
                <p className="text-sm text-destructive">{errors.likelihood.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Consequence *</Label>
              <Select
                value={watch('consequence') || ''}
                onValueChange={(v) => v && setValue('consequence', v as RiskFormData['consequence'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select consequence" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_CONSEQUENCES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.consequence && (
                <p className="text-sm text-destructive">{errors.consequence.message}</p>
              )}
            </div>
          </div>

          {calculatedLevel && levelInfo && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
              <span className="text-sm font-medium">Calculated Risk Level:</span>
              <Badge variant="secondary" className={levelInfo.color}>
                {levelInfo.label}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Context & Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Environment Notes</Label>
            <Textarea
              placeholder="Describe relevant environmental factors (e.g. home setup, accessibility, hazards)..."
              {...register('environment_notes')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Triggers</Label>
            <Textarea
              placeholder="What triggers or exacerbates this risk? (e.g. specific activities, times of day, situations)..."
              {...register('triggers')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Existing Controls</Label>
            <Textarea
              placeholder="What controls or safeguards are already in place?"
              {...register('existing_controls')}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Register Risk
        </Button>
      </div>
    </form>
  )
}
