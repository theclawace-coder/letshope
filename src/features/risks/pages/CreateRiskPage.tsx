import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateRisk } from '../hooks/useRisks'
import { RiskForm } from '../components/RiskForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { calculateRiskLevel } from '@/lib/constants'
import type { RiskFormData } from '../schemas'

export function CreateRiskPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createRisk = useCreateRisk()

  const defaultValues: Partial<RiskFormData> = {
    participant_id: searchParams.get('participantId') || undefined,
  }

  const handleSubmit = async (data: RiskFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const riskLevel = calculateRiskLevel(data.likelihood, data.consequence)

      await createRisk.mutateAsync({
        ...data,
        risk_level: riskLevel,
        identified_by: user?.id || null,
      } as Record<string, unknown>)

      toast.success('Risk registered successfully')
      navigate('/risks')
    } catch {
      toast.error('Failed to register risk')
    }
  }

  return (
    <div>
      <PageHeader
        title="Register a Risk"
        description="Identify and document a risk for a participant"
        action={
          <Button variant="outline" onClick={() => navigate('/risks')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <RiskForm
        onSubmit={handleSubmit}
        isSubmitting={createRisk.isPending}
        defaultValues={defaultValues}
      />
    </div>
  )
}
