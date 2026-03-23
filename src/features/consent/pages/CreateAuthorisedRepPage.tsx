import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateAuthorisedRep } from '../hooks/useAuthorisedReps'
import { AuthorisedRepForm } from '../components/AuthorisedRepForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { AuthorisedRepFormData } from '../schemas'

export function CreateAuthorisedRepPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createRep = useCreateAuthorisedRep()

  const defaultValues: Partial<AuthorisedRepFormData> = {
    participant_id: searchParams.get('participantId') || undefined,
  }

  const handleSubmit = async (data: AuthorisedRepFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      await createRep.mutateAsync({
        ...data,
        authority_end_date: data.authority_end_date || null,
        legal_order_date: data.legal_order_date || null,
        legal_order_expiry: data.legal_order_expiry || null,
        email: data.email || null,
        recorded_by: user?.id || null,
      } as Record<string, unknown>)

      toast.success('Authorised representative added successfully')
      navigate('/consent')
    } catch {
      toast.error('Failed to add authorised representative')
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Authorised Representative"
        description="Record a guardian, nominee, or other authorised representative"
        action={
          <Button variant="outline" onClick={() => navigate('/consent')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <AuthorisedRepForm
        onSubmit={handleSubmit}
        isSubmitting={createRep.isPending}
        defaultValues={defaultValues}
      />
    </div>
  )
}
