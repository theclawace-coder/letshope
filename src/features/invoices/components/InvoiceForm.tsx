import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { invoiceFormSchema, type InvoiceFormData } from '../schemas'
import { InvoiceLineItems } from './InvoiceLineItems'
import { BudgetSummaryCard } from './BudgetSummaryCard'
import { useParticipants } from '@/features/participants/hooks/useParticipants'
import { useNdisPriceGuide, useParticipantBudget } from '../hooks/useInvoices'
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
import { FUNDING_TYPES } from '@/lib/constants'

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<InvoiceFormData>
}

export function InvoiceForm({ onSubmit, isSubmitting, defaultValues }: InvoiceFormProps) {
  const { data: participants } = useParticipants('active')
  const { data: priceGuide } = useNdisPriceGuide()

  const methods = useForm({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoice_date: new Date().toISOString().split('T')[0],
      line_items: [] as InvoiceFormData['line_items'],
      ...defaultValues,
    } as InvoiceFormData,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = methods

  const participantId = watch('participant_id')
  const { data: budget } = useParticipantBudget(participantId || undefined)

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit((data) => onSubmit(data as InvoiceFormData))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Details</CardTitle>
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
                        {p.ndis_number ? ` (${p.ndis_number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.participant_id && (
                  <p className="text-sm text-destructive">{errors.participant_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Funding Type *</Label>
                <Select
                  value={watch('funding_type') || ''}
                  onValueChange={(v) => v && setValue('funding_type', v as InvoiceFormData['funding_type'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select funding type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNDING_TYPES.filter((f) => f.value !== 'combination').map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.funding_type && (
                  <p className="text-sm text-destructive">{errors.funding_type.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Invoice Date *</Label>
                <Input type="date" {...register('invoice_date')} />
                {errors.invoice_date && (
                  <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Period Start *</Label>
                <Input type="date" {...register('period_start')} />
                {errors.period_start && (
                  <p className="text-sm text-destructive">{errors.period_start.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Period End *</Label>
                <Input type="date" {...register('period_end')} />
                {errors.period_end && (
                  <p className="text-sm text-destructive">{errors.period_end.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" {...register('due_date')} />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes for this invoice..."
                {...register('notes')}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {participantId && budget && (
          <BudgetSummaryCard budget={budget} />
        )}

        <InvoiceLineItems priceGuide={priceGuide} />

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Invoice
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
