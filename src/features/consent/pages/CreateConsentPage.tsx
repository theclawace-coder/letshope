import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateConsent } from '../hooks/useConsents'
import { ConsentForm } from '../components/ConsentForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { ConsentFormData } from '../schemas'

export function CreateConsentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createConsent = useCreateConsent()

  const defaultValues: Partial<ConsentFormData> = {
    participant_id: searchParams.get('participantId') || undefined,
  }

  const handleSubmit = async (data: ConsentFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      await createConsent.mutateAsync({
        ...data,
        expiry_date: data.expiry_date || null,
        review_date: data.review_date || null,
        recorded_by: user?.id || null,
      } as Record<string, unknown>)

      toast.success('Consent recorded successfully')
      navigate('/consent')
    } catch {
      toast.error('Failed to record consent')
    }
  }

  return (
    <div>
      <PageHeader
        title="Record Consent"
        description="Record a new consent from or on behalf of a participant"
        action={
          <Button variant="outline" onClick={() => navigate('/consent')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <ConsentForm
        onSubmit={handleSubmit}
        isSubmitting={createConsent.isPending}
        defaultValues={defaultValues}
      />
    </div>
  )
}
