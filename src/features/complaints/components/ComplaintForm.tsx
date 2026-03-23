import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { complaintFormSchema, type ComplaintFormData } from '../schemas'
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
import { COMPLAINT_CATEGORIES } from '@/lib/constants'

interface ComplaintFormProps {
  onSubmit: (data: ComplaintFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<ComplaintFormData>
}

export function ComplaintForm({ onSubmit, isSubmitting, defaultValues }: ComplaintFormProps) {
  const { data: participants } = useParticipants('active')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintFormSchema),
    defaultValues: {
      complaint_date: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complaint Details</CardTitle>
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
              <Label>Complainant Name *</Label>
              <Input placeholder="Who made the complaint?" {...register('complainant_name')} />
              {errors.complainant_name && (
                <p className="text-sm text-destructive">{errors.complainant_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Relationship to Participant</Label>
              <Input placeholder="e.g. Parent, Carer, Self..." {...register('complainant_relationship')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Complaint Date *</Label>
              <Input type="date" {...register('complaint_date')} />
              {errors.complaint_date && (
                <p className="text-sm text-destructive">{errors.complaint_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={watch('category') || ''}
                onValueChange={(v) => v && setValue('category', v as ComplaintFormData['category'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {COMPLAINT_CATEGORIES.map((c) => (
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
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Provide a detailed description of the complaint, including specific issues raised, relevant dates, and any supporting context..."
              {...register('description')}
              rows={5}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit Complaint
        </Button>
      </div>
    </form>
  )
}
