import { useState } from 'react'
import { useSupersedePolicy } from '../hooks/usePolicyLibrary'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, GitMerge } from 'lucide-react'

interface SupersedeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  masterId: string
  currentVersionNumber: number
}

export function SupersedeDialog({
  open,
  onOpenChange,
  masterId,
  currentVersionNumber,
}: SupersedeDialogProps) {
  const supersede = useSupersedePolicy()
  const [changeSummary, setChangeSummary] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [reviewDate, setReviewDate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!changeSummary.trim()) return

    await supersede.mutateAsync({
      masterId,
      changeSummary: changeSummary.trim(),
      effectiveDate: effectiveDate || undefined,
      reviewDate: reviewDate || undefined,
    })

    setChangeSummary('')
    setReviewDate('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Create New Version
          </DialogTitle>
          <DialogDescription>
            This will supersede v{currentVersionNumber} and create v{currentVersionNumber + 1}.
            The previous version's content will be deactivated from AI Buddy search.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>What changed? *</Label>
            <Textarea
              placeholder="Describe what changed in this version (e.g. 'Updated medication management procedures to align with new NDIS guidelines')"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Effective Date *</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Next Review Date</Label>
              <Input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={supersede.isPending || !changeSummary.trim()}>
              {supersede.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supersede & Create v{currentVersionNumber + 1}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
