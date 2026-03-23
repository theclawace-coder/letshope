import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { riskReviewSchema, type RiskReviewFormData } from '../schemas'
import { useCreateReview } from '../hooks/useRisks'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { RISK_LEVELS } from '@/lib/constants'

interface RiskReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  riskId: string
  currentLevel: string
}

export function RiskReviewDialog({ open, onOpenChange, riskId, currentLevel }: RiskReviewDialogProps) {
  const createReview = useCreateReview()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RiskReviewFormData>({
    resolver: zodResolver(riskReviewSchema),
    defaultValues: {
      new_level: currentLevel as RiskReviewFormData['new_level'],
    },
  })

  const onSubmit = async (data: RiskReviewFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await createReview.mutateAsync({
        risk_id: riskId,
        reviewed_by: user?.id || null,
        previous_level: currentLevel,
        new_level: data.new_level,
        findings: data.findings,
        actions_taken: data.actions_taken || null,
        next_review_date: data.next_review_date || null,
      })
      onOpenChange(false)
      reset()
    } catch {
      toast.error('Failed to record review')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Periodic Risk Review</DialogTitle>
          <DialogDescription>
            Review this risk and update the risk level if needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Updated Risk Level *</Label>
            <Select
              value={watch('new_level') || ''}
              onValueChange={(v) => v && setValue('new_level', v as RiskReviewFormData['new_level'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RISK_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.new_level && <p className="text-sm text-destructive">{errors.new_level.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Findings *</Label>
            <Textarea
              placeholder="Describe what was reviewed and current state of the risk..."
              {...register('findings')}
              rows={3}
            />
            {errors.findings && <p className="text-sm text-destructive">{errors.findings.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Actions Taken</Label>
            <Textarea
              placeholder="What actions have been taken since last review?"
              {...register('actions_taken')}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Next Review Date</Label>
            <Input type="date" {...register('next_review_date')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createReview.isPending}>
              {createReview.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
