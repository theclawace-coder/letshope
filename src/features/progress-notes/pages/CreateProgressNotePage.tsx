import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateProgressNote } from '../hooks/useProgressNotes'
import { useCreateConcern } from '@/features/concerns/hooks/useConcerns'
import { ProgressNoteForm } from '../components/ProgressNoteForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { ProgressNoteFormData } from '../schemas'

export function CreateProgressNotePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createNote = useCreateProgressNote()
  const createConcern = useCreateConcern()

  const defaultValues: Partial<ProgressNoteFormData> = {
    participant_id: searchParams.get('participantId') || undefined,
    worker_id: searchParams.get('workerId') || undefined,
    booking_id: searchParams.get('bookingId') || undefined,
  }

  const handleSubmit = async (data: ProgressNoteFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { concern_flagged, concern_type, concern_severity, concern_title, concern_description, ...noteData } = data

      const note = await createNote.mutateAsync({
        ...noteData,
        booking_id: (noteData as Record<string, unknown>).booking_id || null,
        service_type: (noteData as Record<string, unknown>).service_type || null,
        presentation: noteData.presentation || null,
        actions_taken: noteData.actions_taken || null,
      } as Record<string, unknown>)

      // Create linked concern if flagged
      if (concern_flagged && concern_type && concern_severity && concern_title && concern_description) {
        await createConcern.mutateAsync({
          participant_id: data.participant_id,
          progress_note_id: note.id,
          raised_by: user?.id || note.created_by || null,
          concern_type,
          severity: concern_severity,
          title: concern_title,
          description: concern_description,
        } as Record<string, unknown>)
      }

      toast.success('Progress note saved successfully')
      navigate('/progress-notes')
    } catch {
      toast.error('Failed to save progress note')
    }
  }

  return (
    <div>
      <PageHeader
        title="New Progress Note"
        description="Record observations and actions from a participant visit"
        action={
          <Button variant="outline" onClick={() => navigate('/progress-notes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <ProgressNoteForm
        onSubmit={handleSubmit}
        isSubmitting={createNote.isPending || createConcern.isPending}
        defaultValues={defaultValues}
      />
    </div>
  )
}
