import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateRightsAcknowledgment } from '../hooks/useRightsAcknowledgments'
import { RightsAcknowledgmentForm } from '../components/RightsAcknowledgmentForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { RightsAcknowledgmentFormData } from '../schemas'

export function CreateRightsAcknowledgmentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createAcknowledgment = useCreateRightsAcknowledgment()

  const defaultValues: Partial<RightsAcknowledgmentFormData> = {
    participant_id: searchParams.get('participantId') || undefined,
  }

  const handleSubmit = async (data: RightsAcknowledgmentFormData & { rights_covered: unknown[] }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      await createAcknowledgment.mutateAsync({
        ...data,
        next_review_date: data.next_review_date || null,
        interpreter_details: data.interpreter_details || null,
        witnessed_by_name: data.witnessed_by_name || null,
        recorded_by: user?.id || null,
      } as Record<string, unknown>)

      toast.success('Rights acknowledgment recorded successfully')
      navigate('/consent')
    } catch {
      toast.error('Failed to record rights acknowledgment')
    }
  }

  return (
    <div>
      <PageHeader
        title="Record Rights Acknowledgment"
        description="Document that a participant has been informed of their NDIS rights"
        action={
          <Button variant="outline" onClick={() => navigate('/consent')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <RightsAcknowledgmentForm
        onSubmit={handleSubmit}
        isSubmitting={createAcknowledgment.isPending}
        defaultValues={defaultValues}
      />
    </div>
  )
}
