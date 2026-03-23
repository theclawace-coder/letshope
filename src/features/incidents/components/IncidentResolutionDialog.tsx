import { useState } from 'react'
import { useUpdateIncident } from '../hooks/useIncidents'
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
import { Loader2, CheckCircle, Archive } from 'lucide-react'
import { toast } from 'sonner'

interface IncidentResolutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incidentId: string
}

export function IncidentResolutionDialog({ open, onOpenChange, incidentId }: IncidentResolutionDialogProps) {
  const [investigationNotes, setInvestigationNotes] = useState('')
  const [correctiveActions, setCorrectiveActions] = useState('')
  const updateIncident = useUpdateIncident()

  const handleAction = async (status: 'resolved' | 'closed') => {
    if (!investigationNotes.trim()) {
      toast.error('Please provide investigation notes')
      return
    }

    try {
      const actions = correctiveActions.trim()
        ? correctiveActions.trim().split('\n').filter(Boolean).map((a) => ({ action: a, completed: false }))
        : []

      await updateIncident.mutateAsync({
        id: incidentId,
        status,
        investigation_notes: investigationNotes.trim(),
        corrective_actions: actions,
      })
      toast.success(`Incident ${status} successfully`)
      onOpenChange(false)
      setInvestigationNotes('')
      setCorrectiveActions('')
    } catch {
      toast.error(`Failed to ${status === 'resolved' ? 'resolve' : 'close'} incident`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Resolve Incident</DialogTitle>
          <DialogDescription>
            Provide investigation findings and corrective actions taken.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Investigation Notes *</Label>
            <Textarea
              placeholder="Describe findings from the investigation, root cause analysis, and actions taken..."
              value={investigationNotes}
              onChange={(e) => setInvestigationNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Corrective Actions (one per line)</Label>
            <Textarea
              placeholder="List corrective actions, one per line...&#10;e.g. Staff retraining completed&#10;Risk assessment updated&#10;Procedure amended"
              value={correctiveActions}
              onChange={(e) => setCorrectiveActions(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleAction('closed')}
            disabled={updateIncident.isPending}
          >
            {updateIncident.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            Close
          </Button>
          <Button
            onClick={() => handleAction('resolved')}
            disabled={updateIncident.isPending}
          >
            {updateIncident.isPending ? (
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
