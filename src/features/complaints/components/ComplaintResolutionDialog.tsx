import { useState } from 'react'
import { useUpdateComplaint } from '../hooks/useComplaints'
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

interface ComplaintResolutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complaintId: string
}

export function ComplaintResolutionDialog({ open, onOpenChange, complaintId }: ComplaintResolutionDialogProps) {
  const [resolution, setResolution] = useState('')
  const updateComplaint = useUpdateComplaint()

  const handleAction = async (status: 'resolved' | 'closed') => {
    if (!resolution.trim()) {
      toast.error('Please provide resolution notes')
      return
    }

    try {
      await updateComplaint.mutateAsync({
        id: complaintId,
        status,
        resolution: resolution.trim(),
        resolution_date: new Date().toISOString().split('T')[0],
      })
      toast.success(`Complaint ${status} successfully`)
      onOpenChange(false)
      setResolution('')
    } catch {
      toast.error(`Failed to ${status === 'resolved' ? 'resolve' : 'close'} complaint`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Complaint</DialogTitle>
          <DialogDescription>
            Provide a summary of how this complaint was resolved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label>Resolution Notes *</Label>
          <Textarea
            placeholder="Describe the resolution, actions taken, and outcome..."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleAction('closed')}
            disabled={updateComplaint.isPending}
          >
            {updateComplaint.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            Close
          </Button>
          <Button
            onClick={() => handleAction('resolved')}
            disabled={updateComplaint.isPending}
          >
            {updateComplaint.isPending ? (
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
