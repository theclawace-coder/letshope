import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { consentFormSchema, type ConsentFormData } from '../schemas'
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
import { CONSENT_TYPES, CONSENT_METHODS } from '@/lib/constants'

interface ConsentFormProps {
  onSubmit: (data: ConsentFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<ConsentFormData>
}

export function ConsentForm({ onSubmit, isSubmitting, defaultValues }: ConsentFormProps) {
  const { data: participants } = useParticipants('active')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ConsentFormData>({
    resolver: zodResolver(consentFormSchema),
    defaultValues: {
      given_date: new Date().toISOString().split('T')[0],
      consent_method: 'written',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consent Details</CardTitle>
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
              <Label>Consent Type *</Label>
              <Select
                value={watch('consent_type') || ''}
                onValueChange={(v) => v && setValue('consent_type', v as ConsentFormData['consent_type'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONSENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.consent_type && (
                <p className="text-sm text-destructive">{errors.consent_type.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input placeholder="e.g. Consent for information sharing with support coordinator" {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Optional description of this consent record"
              {...register('description')}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Scope *</Label>
            <Textarea
              placeholder="What specifically is being consented to? e.g. Sharing progress notes and goal updates with the participant's support coordinator at Organisation XYZ..."
              {...register('scope')}
              rows={3}
            />
            {errors.scope && (
              <p className="text-sm text-destructive">{errors.scope.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Conditions / Limitations</Label>
            <Textarea
              placeholder="Any conditions or limitations on this consent"
              {...register('conditions')}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How Consent Was Given</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Method *</Label>
              <Select
                value={watch('consent_method') || ''}
                onValueChange={(v) => v && setValue('consent_method', v as ConsentFormData['consent_method'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {CONSENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.consent_method && (
                <p className="text-sm text-destructive">{errors.consent_method.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date Given *</Label>
              <Input type="date" {...register('given_date')} />
              {errors.given_date && (
                <p className="text-sm text-destructive">{errors.given_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" {...register('expiry_date')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Review Date</Label>
            <Input type="date" {...register('review_date')} className="max-w-xs" />
            <p className="text-xs text-muted-foreground">When should this consent be reviewed?</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Given By (Name) *</Label>
              <Input placeholder="Name of person providing consent" {...register('given_by_name')} />
              {errors.given_by_name && (
                <p className="text-sm text-destructive">{errors.given_by_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Relationship to Participant</Label>
              <Input placeholder="e.g. Self, Parent, Guardian" {...register('given_by_relationship')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Witnessed By (Name)</Label>
            <Input placeholder="Name of witness (if applicable)" {...register('witnessed_by_name')} />
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
          Record Consent
        </Button>
      </div>
    </form>
  )
}
