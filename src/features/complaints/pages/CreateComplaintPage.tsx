import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateComplaint } from '../hooks/useComplaints'
import { ComplaintForm } from '../components/ComplaintForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { ComplaintFormData } from '../schemas'

export function CreateComplaintPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createComplaint = useCreateComplaint()

  const defaultValues: Partial<ComplaintFormData> = {
    participant_id: searchParams.get('participantId') || undefined,
  }

  const handleSubmit = async (data: ComplaintFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // NDIS requires acknowledgment within 2 business days
      const ackDeadline = new Date()
      ackDeadline.setDate(ackDeadline.getDate() + 2)

      // Resolution target: 21 days
      const resDeadline = new Date()
      resDeadline.setDate(resDeadline.getDate() + 21)

      await createComplaint.mutateAsync({
        ...data,
        complainant_relationship: data.complainant_relationship || null,
        logged_by: user?.id || null,
        acknowledge_deadline: ackDeadline.toISOString(),
        resolution_deadline: resDeadline.toISOString(),
      } as Record<string, unknown>)

      toast.success('Complaint logged successfully')
      navigate('/complaints')
    } catch {
      toast.error('Failed to log complaint')
    }
  }

  return (
    <div>
      <PageHeader
        title="Log a Complaint"
        description="Record a formal complaint from a participant, carer, or other party"
        action={
          <Button variant="outline" onClick={() => navigate('/complaints')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <ComplaintForm
        onSubmit={handleSubmit}
        isSubmitting={createComplaint.isPending}
        defaultValues={defaultValues}
      />
    </div>
  )
}
