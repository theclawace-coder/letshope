import { useState } from 'react'
import { useResolveConcern } from '../hooks/useConcerns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ConcernResolutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  concernId: string
  userId: string
}

export function ConcernResolutionDialog({ open, onOpenChange, concernId, userId }: ConcernResolutionDialogProps) {
  const [notes, setNotes] = useState('')
  const resolveConcern = useResolveConcern()

  const handleAction = async (status: 'resolved' | 'dismissed') => {
    if (!notes.trim()) {
      toast.error('Please provide resolution notes')
      return
    }

    try {
      await resolveConcern.mutateAsync({
        id: concernId,
        status,
        resolution_notes: notes.trim(),
        resolved_by: userId,
      })
      toast.success(`Concern ${status} successfully`)
      onOpenChange(false)
      setNotes('')
    } catch {
      toast.error(`Failed to ${status === 'resolved' ? 'resolve' : 'dismiss'} concern`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Concern</DialogTitle>
          <DialogDescription>
            Provide notes explaining the resolution or reason for dismissal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label>Resolution Notes *</Label>
          <Textarea
            placeholder="Describe the actions taken or reason for dismissal..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleAction('dismissed')}
            disabled={resolveConcern.isPending}
          >
            {resolveConcern.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Dismiss
          </Button>
          <Button
            onClick={() => handleAction('resolved')}
            disabled={resolveConcern.isPending}
          >
            {resolveConcern.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Resolve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
