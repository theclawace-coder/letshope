import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { concernFormSchema, type ConcernFormData } from '../schemas'
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
import { CONCERN_TYPES, CONCERN_SEVERITIES } from '@/lib/constants'

interface ConcernFormProps {
  onSubmit: (data: ConcernFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<ConcernFormData>
}

export function ConcernForm({ onSubmit, isSubmitting, defaultValues }: ConcernFormProps) {
  const { data: participants } = useParticipants('active')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ConcernFormData>({
    resolver: zodResolver(concernFormSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Concern Details</CardTitle>
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
              <Label>Concern Type *</Label>
              <Select
                value={watch('concern_type') || ''}
                onValueChange={(v) => v && setValue('concern_type', v as ConcernFormData['concern_type'])}
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
              {errors.concern_type && (
                <p className="text-sm text-destructive">{errors.concern_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Severity *</Label>
              <Select
                value={watch('severity') || ''}
                onValueChange={(v) => v && setValue('severity', v as ConcernFormData['severity'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {CONCERN_SEVERITIES.map((s) => (
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
            <Label>Title *</Label>
            <Input placeholder="Brief title for this concern..." {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Provide a detailed description of the concern, including what was observed, when it occurred, and any relevant context..."
              {...register('description')}
              rows={5}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Actions Requested</Label>
            <Textarea
              placeholder="What actions do you recommend or request? (optional)"
              {...register('actions_requested')}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit Concern
        </Button>
      </div>
    </form>
  )
}
