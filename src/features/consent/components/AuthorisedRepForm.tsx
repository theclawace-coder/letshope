import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authorisedRepSchema, type AuthorisedRepFormData } from '../schemas'
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
import { AUTHORITY_TYPES } from '@/lib/constants'

interface AuthorisedRepFormProps {
  onSubmit: (data: AuthorisedRepFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<AuthorisedRepFormData>
  hideParticipant?: boolean
}

export function AuthorisedRepForm({ onSubmit, isSubmitting, defaultValues, hideParticipant }: AuthorisedRepFormProps) {
  const { data: participants } = useParticipants('active')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AuthorisedRepFormData>({
    resolver: zodResolver(authorisedRepSchema),
    defaultValues: {
      authority_start_date: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Representative Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hideParticipant && (
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
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input placeholder="Representative's full name" {...register('full_name')} />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Relationship *</Label>
              <Input placeholder="e.g. Parent, Spouse, Sibling" {...register('relationship')} />
              {errors.relationship && (
                <p className="text-sm text-destructive">{errors.relationship.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Authority Type *</Label>
            <Select
              value={watch('authority_type') || ''}
              onValueChange={(v) => v && setValue('authority_type', v as AuthorisedRepFormData['authority_type'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select authority type" />
              </SelectTrigger>
              <SelectContent>
                {AUTHORITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.authority_type && (
              <p className="text-sm text-destructive">{errors.authority_type.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="Phone number" {...register('phone')} />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="Email address" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Address" {...register('address')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Authority Period & Legal Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Authority Start Date *</Label>
              <Input type="date" {...register('authority_start_date')} />
              {errors.authority_start_date && (
                <p className="text-sm text-destructive">{errors.authority_start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Authority End Date</Label>
              <Input type="date" {...register('authority_end_date')} />
              <p className="text-xs text-muted-foreground">Leave blank for ongoing authority</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Legal Order Reference</Label>
              <Input placeholder="e.g. Guardianship order number" {...register('legal_order_reference')} />
            </div>

            <div className="space-y-2">
              <Label>Issuing Body</Label>
              <Input placeholder="e.g. VCAT, NCAT, SAT" {...register('issuing_body')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Legal Order Date</Label>
              <Input type="date" {...register('legal_order_date')} />
            </div>

            <div className="space-y-2">
              <Label>Legal Order Expiry</Label>
              <Input type="date" {...register('legal_order_expiry')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any additional notes about this representative's authority"
              {...register('notes')}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Representative
        </Button>
      </div>
    </form>
  )
}
