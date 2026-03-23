import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { stage1Schema, type Stage1Data } from '../../schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { NdisNumberInput } from '@/components/forms/NdisNumberInput'
import { PhoneInput } from '@/components/forms/PhoneInput'
import { REGISTRATION_GROUPS, ALL_REGISTRATION_GROUPS } from '@/lib/constants'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

interface Stage1Props {
  defaultValues?: Partial<Stage1Data>
  onSubmit: (data: Stage1Data) => void
  isLoading: boolean
}

export function Stage1Referral({ defaultValues, onSubmit, isLoading }: Stage1Props) {
  const { data: org } = useQuery({
    queryKey: ['organisation'],
    queryFn: async () => {
      const { data } = await supabase.from('organisation').select('*').single()
      return data as Tables<'organisation'> | null
    },
  })

  const registeredGroups = org?.registration_groups || Object.keys(REGISTRATION_GROUPS)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Stage1Data>({
    resolver: zodResolver(stage1Schema),
    defaultValues: {
      urgency: 'routine',
      services_requested: [],
      ...defaultValues,
    },
  })

  const selectedServices = watch('services_requested')
  const ndisNumber = watch('ndis_number') || ''

  function toggleService(code: string) {
    if (!registeredGroups.includes(code)) return
    const current = selectedServices || []
    if (current.includes(code)) {
      setValue('services_requested', current.filter((c) => c !== code), { shouldValidate: true })
    } else {
      setValue('services_requested', [...current, code], { shouldValidate: true })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registration Check</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            What supports does the participant need? Only services you're registered for can be selected.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(ALL_REGISTRATION_GROUPS).map(([code, name]) => {
              const isRegistered = registeredGroups.includes(code)
              const isSelected = selectedServices?.includes(code)
              return (
                <button
                  type="button"
                  key={code}
                  onClick={() => toggleService(code)}
                  disabled={!isRegistered}
                  className={`flex items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : isRegistered
                        ? 'border-border hover:border-primary/50'
                        : 'border-border bg-muted/50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {isRegistered ? (
                    isSelected ? (
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive/50 shrink-0" />
                  )}
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">{code}</span>{' '}
                    <span>{name}</span>
                  </div>
                </button>
              )
            })}
          </div>
          {errors.services_requested && (
            <p className="text-sm text-destructive mt-2">{errors.services_requested.message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participant Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" {...register('first_name')} />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" {...register('last_name')} />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>NDIS Number *</Label>
            <NdisNumberInput
              value={ndisNumber}
              onChange={(v) => setValue('ndis_number', v, { shouldValidate: true })}
              error={errors.ndis_number?.message}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone</Label>
              <PhoneInput
                value={watch('phone') || ''}
                onChange={(v) => setValue('phone', v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referral Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referral_source">Referral Source *</Label>
            <Input id="referral_source" placeholder="e.g., Support Coordinator, LAC, self-referral" {...register('referral_source')} />
            {errors.referral_source && <p className="text-xs text-destructive">{errors.referral_source.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Urgency *</Label>
            <RadioGroup
              value={watch('urgency')}
              onValueChange={(v) => setValue('urgency', v as Stage1Data['urgency'], { shouldValidate: true })}
            >
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="routine" id="routine" />
                  <Label htmlFor="routine" className="font-normal">Routine</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent" className="font-normal text-orange-600">Urgent</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="crisis" id="crisis" />
                  <Label htmlFor="crisis" className="font-normal text-red-600">Crisis</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referral_notes">Notes</Label>
            <Textarea id="referral_notes" placeholder="Brief description of needs..." {...register('referral_notes')} rows={3} />
          </div>
        </CardContent>
      </Card>

      {watch('urgency') === 'crisis' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Crisis referral flagged. This participant will be prioritised for intake.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </form>
  )
}
