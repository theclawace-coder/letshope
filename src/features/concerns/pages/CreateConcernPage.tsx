import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateConcern } from '../hooks/useConcerns'
import { ConcernForm } from '../components/ConcernForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { ConcernFormData } from '../schemas'

export function CreateConcernPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createConcern = useCreateConcern()

  const defaultValues: Partial<ConcernFormData> = {
    participant_id: searchParams.get('participantId') || undefined,
  }

  const handleSubmit = async (data: ConcernFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await createConcern.mutateAsync({
        ...data,
        raised_by: user?.id || null,
      } as Record<string, unknown>)

      toast.success('Concern flagged successfully')
      navigate('/concerns')
    } catch {
      toast.error('Failed to flag concern')
    }
  }

  return (
    <div>
      <PageHeader
        title="Flag a Concern"
        description="Report a concern about a participant's safety, health, or wellbeing"
        action={
          <Button variant="outline" onClick={() => navigate('/concerns')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <ConcernForm
        onSubmit={handleSubmit}
        isSubmitting={createConcern.isPending}
        defaultValues={defaultValues}
      />
    </div>
  )
}
