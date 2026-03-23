import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { capacityAssessmentSchema, type CapacityAssessmentFormData } from '../schemas'
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
import { CAPACITY_LEVELS } from '@/lib/constants'

interface CapacityAssessmentFormProps {
  onSubmit: (data: CapacityAssessmentFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<CapacityAssessmentFormData>
}

export function CapacityAssessmentForm({ onSubmit, isSubmitting, defaultValues }: CapacityAssessmentFormProps) {
  const { data: participants } = useParticipants('active')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CapacityAssessmentFormData>({
    resolver: zodResolver(capacityAssessmentSchema),
    defaultValues: {
      assessment_date: new Date().toISOString().split('T')[0],
      capacity_level: 'full',
      ...defaultValues,
    },
  })

  const capacityLevel = watch('capacity_level')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment Details</CardTitle>
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
              <Label>Decision-Making Capacity *</Label>
              <Select
                value={watch('capacity_level') || ''}
                onValueChange={(v) => v && setValue('capacity_level', v as CapacityAssessmentFormData['capacity_level'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {CAPACITY_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.capacity_level && (
                <p className="text-sm text-destructive">{errors.capacity_level.message}</p>
              )}
            </div>
          </div>

          {capacityLevel !== 'full' && (
            <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-800">
              {capacityLevel === 'supported' && (
                <p>Supported decision-making means the participant can make decisions with appropriate support. Document the areas where support is needed in the assessment summary.</p>
              )}
              {capacityLevel === 'substitute' && (
                <p>Substitute decision-making means a formal decision-maker (e.g. guardian) makes decisions on the participant's behalf for specific areas. Ensure an Authorised Representative is recorded.</p>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Assessment Date *</Label>
              <Input type="date" {...register('assessment_date')} />
              {errors.assessment_date && (
                <p className="text-sm text-destructive">{errors.assessment_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Next Review Date</Label>
              <Input type="date" {...register('next_review_date')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Assessed By (Name) *</Label>
              <Input placeholder="Name of assessor" {...register('assessed_by_name')} />
              {errors.assessed_by_name && (
                <p className="text-sm text-destructive">{errors.assessed_by_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Assessor Role</Label>
              <Input placeholder="e.g. Psychologist, Social Worker" {...register('assessed_by_role')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment Summary & Communication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Assessment Summary *</Label>
            <Textarea
              placeholder="Provide a summary of the capacity assessment, including domains assessed and any specific findings..."
              {...register('assessment_summary')}
              rows={5}
            />
            {errors.assessment_summary && (
              <p className="text-sm text-destructive">{errors.assessment_summary.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Communication Needs</Label>
            <Textarea
              placeholder="Describe any specific communication needs or considerations"
              {...register('communication_needs')}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Communication Method</Label>
            <Input placeholder="e.g. Visual aids, Plain language, Auslan, Key Word Sign" {...register('preferred_communication')} />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any additional notes"
              {...register('notes')}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Assessment
        </Button>
      </div>
    </form>
  )
}
