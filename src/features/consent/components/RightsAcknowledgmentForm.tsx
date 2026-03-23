import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { rightsAcknowledgmentSchema, type RightsAcknowledgmentFormData } from '../schemas'
import { useNdisParticipantRights } from '../hooks/useRightsAcknowledgments'
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
import { Loader2, CheckCircle2, BookOpen } from 'lucide-react'
import { CONSENT_METHODS } from '@/lib/constants'

interface RightsAcknowledgmentFormProps {
  onSubmit: (data: RightsAcknowledgmentFormData & { rights_covered: unknown[] }) => void
  isSubmitting?: boolean
  defaultValues?: Partial<RightsAcknowledgmentFormData>
}

export function RightsAcknowledgmentForm({ onSubmit, isSubmitting, defaultValues }: RightsAcknowledgmentFormProps) {
  const { data: participants } = useParticipants('active')
  const { data: ndisRights } = useNdisParticipantRights()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RightsAcknowledgmentFormData>({
    resolver: zodResolver(rightsAcknowledgmentSchema),
    defaultValues: {
      acknowledged_date: new Date().toISOString().split('T')[0],
      acknowledged_method: 'written',
      rights_explained: false,
      rights_understood: false,
      easy_read_provided: false,
      interpreter_used: false,
      ...defaultValues,
    },
  })

  const interpreterUsed = watch('interpreter_used')

  const handleFormSubmit = (data: RightsAcknowledgmentFormData) => {
    // Include all NDIS rights as covered by default
    const rightsCovered = ndisRights?.map((r) => ({
      code: r.code,
      title: r.title,
    })) ?? []
    onSubmit({ ...data, rights_covered: rightsCovered })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participant & Date</CardTitle>
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
              <Label>Date Acknowledged *</Label>
              <Input type="date" {...register('acknowledged_date')} />
              {errors.acknowledged_date && (
                <p className="text-sm text-destructive">{errors.acknowledged_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Next Review Date</Label>
              <Input type="date" {...register('next_review_date')} />
            </div>

            <div className="space-y-2">
              <Label>Method *</Label>
              <Select
                value={watch('acknowledged_method') || ''}
                onValueChange={(v) => v && setValue('acknowledged_method', v as RightsAcknowledgmentFormData['acknowledged_method'])}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NDIS Participant Rights Reference */}
      {ndisRights && ndisRights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              NDIS Participant Rights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ndisRights.map((right) => (
                <div key={right.id} className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{right.title}</p>
                    <p className="text-xs text-muted-foreground">{right.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accessibility & Communication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="rights_explained"
                {...register('rights_explained')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="rights_explained" className="font-normal">
                Rights were explained in an accessible format
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="rights_understood"
                {...register('rights_understood')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="rights_understood" className="font-normal">
                Participant confirmed understanding of their rights
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="easy_read_provided"
                {...register('easy_read_provided')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="easy_read_provided" className="font-normal">
                Easy-read version was provided
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="interpreter_used"
                {...register('interpreter_used')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="interpreter_used" className="font-normal">
                Interpreter or communication support was used
              </Label>
            </div>
          </div>

          {interpreterUsed && (
            <div className="space-y-2">
              <Label>Interpreter / Communication Support Details</Label>
              <Input
                placeholder="e.g. Auslan interpreter - Jane Smith"
                {...register('interpreter_details')}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acknowledgment By</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="Name of person acknowledging" {...register('acknowledged_by_name')} />
              {errors.acknowledged_by_name && (
                <p className="text-sm text-destructive">{errors.acknowledged_by_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Relationship to Participant</Label>
              <Input placeholder="e.g. Self, Parent, Guardian" {...register('acknowledged_by_relationship')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Witnessed By (Name)</Label>
            <Input placeholder="Name of witness (if applicable)" {...register('witnessed_by_name')} />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any additional notes about how rights were communicated"
              {...register('notes')}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Record Acknowledgment
        </Button>
      </div>
    </form>
  )
}
