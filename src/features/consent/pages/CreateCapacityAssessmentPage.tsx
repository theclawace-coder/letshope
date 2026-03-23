import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateCapacityAssessment } from '../hooks/useCapacityAssessments'
import { CapacityAssessmentForm } from '../components/CapacityAssessmentForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { CapacityAssessmentFormData } from '../schemas'

export function CreateCapacityAssessmentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createAssessment = useCreateCapacityAssessment()

  const defaultValues: Partial<CapacityAssessmentFormData> = {
    participant_id: searchParams.get('participantId') || undefined,
  }

  const handleSubmit = async (data: CapacityAssessmentFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      await createAssessment.mutateAsync({
        ...data,
        next_review_date: data.next_review_date || null,
        is_current: true,
        recorded_by: user?.id || null,
      } as Record<string, unknown>)

      toast.success('Capacity assessment recorded successfully')
      navigate('/consent')
    } catch {
      toast.error('Failed to record capacity assessment')
    }
  }

  return (
    <div>
      <PageHeader
        title="Record Capacity Assessment"
        description="Document a participant's decision-making capacity"
        action={
          <Button variant="outline" onClick={() => navigate('/consent')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <CapacityAssessmentForm
        onSubmit={handleSubmit}
        isSubmitting={createAssessment.isPending}
        defaultValues={defaultValues}
      />
    </div>
  )
}
