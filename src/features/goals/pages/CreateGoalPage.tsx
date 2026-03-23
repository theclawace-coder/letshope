import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateGoal } from '../hooks/useGoals'
import { GoalForm } from '../components/GoalForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { GoalFormData } from '../schemas'

export function CreateGoalPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createGoal = useCreateGoal()

  const defaultValues: Partial<GoalFormData> = {
    participant_id: searchParams.get('participantId') || undefined,
  }

  const handleSubmit = async (data: GoalFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await createGoal.mutateAsync({
        ...data,
        start_date: data.start_date || null,
        target_date: data.target_date || null,
        review_date: data.review_date || null,
        created_by: user?.id || null,
      } as Record<string, unknown>)

      toast.success('Goal created successfully')
      navigate('/goals')
    } catch {
      toast.error('Failed to create goal')
    }
  }

  return (
    <div>
      <PageHeader
        title="Create Goal"
        description="Set a new goal for a participant aligned with their NDIS plan"
        action={
          <Button variant="outline" onClick={() => navigate('/goals')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <GoalForm
        onSubmit={handleSubmit}
        isSubmitting={createGoal.isPending}
        defaultValues={defaultValues}
      />
    </div>
  )
}
