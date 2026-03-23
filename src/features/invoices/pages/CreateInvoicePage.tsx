import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateInvoice } from '../hooks/useInvoices'
import { InvoiceForm } from '../components/InvoiceForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { InvoiceFormData } from '../schemas'

export function CreateInvoicePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createInvoice = useCreateInvoice()

  const defaultValues: Partial<InvoiceFormData> = {
    participant_id: searchParams.get('participantId') || undefined,
  }

  const handleSubmit = async (data: InvoiceFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const lineItems = data.line_items.map((li) => ({
        support_item_number: li.support_item_number || null,
        support_item_name: li.support_item_name,
        registration_group: li.registration_group || null,
        date_of_service: li.date_of_service,
        start_time: li.start_time || null,
        end_time: li.end_time || null,
        quantity: li.quantity,
        unit: li.unit,
        unit_price: li.unit_price,
        ndis_max_price: li.ndis_max_price || null,
        gst_applicable: li.gst_applicable,
        total: Math.round(li.quantity * li.unit_price * 100) / 100,
        claim_type: li.claim_type,
        worker_id: li.worker_id || null,
        booking_id: li.booking_id || null,
        notes: li.notes || null,
      }))

      await createInvoice.mutateAsync({
        invoice: {
          participant_id: data.participant_id,
          invoice_date: data.invoice_date,
          due_date: data.due_date || null,
          period_start: data.period_start,
          period_end: data.period_end,
          funding_type: data.funding_type,
          notes: data.notes || null,
          created_by: user?.id || null,
        },
        lineItems,
      })

      toast.success('Invoice created successfully')
      navigate('/invoices')
    } catch {
      toast.error('Failed to create invoice')
    }
  }

  return (
    <div>
      <PageHeader
        title="Create Invoice"
        description="Create a new NDIS service invoice"
        action={
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <InvoiceForm
        onSubmit={handleSubmit}
        isSubmitting={createInvoice.isPending}
        defaultValues={defaultValues}
      />
    </div>
  )
}
