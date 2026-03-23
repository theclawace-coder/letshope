import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateIncident } from '../hooks/useIncidents'
import { IncidentForm } from '../components/IncidentForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { IncidentFormData } from '../schemas'

export function CreateIncidentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createIncident = useCreateIncident()

  const defaultValues: Partial<IncidentFormData> = {
    participant_id: searchParams.get('participantId') || undefined,
  }

  const handleSubmit = async (data: IncidentFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const reportDeadline = data.is_reportable
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : undefined

      await createIncident.mutateAsync({
        ...data,
        worker_id: data.worker_id || null,
        incident_time: data.incident_time || null,
        location: data.location || null,
        logged_by: user?.id || null,
        report_deadline: reportDeadline || null,
      } as Record<string, unknown>)

      toast.success('Incident logged successfully')
      navigate('/incidents')
    } catch {
      toast.error('Failed to log incident')
    }
  }

  return (
    <div>
      <PageHeader
        title="Log an Incident"
        description="Record a reportable or non-reportable incident"
        action={
          <Button variant="outline" onClick={() => navigate('/incidents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <IncidentForm
        onSubmit={handleSubmit}
        isSubmitting={createIncident.isPending}
        defaultValues={defaultValues}
      />
    </div>
  )
}
