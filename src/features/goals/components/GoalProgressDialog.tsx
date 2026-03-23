import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { goalProgressSchema, type GoalProgressFormData } from '../schemas'
import { useAddGoalProgress } from '../hooks/useGoals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface GoalProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goalId: string
  userId: string
  currentProgress: number
}

export function GoalProgressDialog({
  open,
  onOpenChange,
  goalId,
  userId,
  currentProgress,
}: GoalProgressDialogProps) {
  const addProgress = useAddGoalProgress()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<GoalProgressFormData>({
    resolver: zodResolver(goalProgressSchema),
    defaultValues: {
      progress_percentage: currentProgress,
      progress_date: new Date().toISOString().split('T')[0],
    },
  })

  const progressValue = watch('progress_percentage')

  const onSubmit = async (data: GoalProgressFormData) => {
    try {
      await addProgress.mutateAsync({
        goal_id: goalId,
        progress_percentage: data.progress_percentage,
        notes: data.notes || null,
        evidence: data.evidence || null,
        progress_date: data.progress_date || new Date().toISOString().split('T')[0],
        recorded_by: userId,
      })
      reset()
      onOpenChange(false)
    } catch {
      // error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Progress</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Progress ({progressValue ?? currentProgress}%)</Label>
            <Input
              type="range"
              min={0}
              max={100}
              step={5}
              {...register('progress_percentage', { valueAsNumber: true })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            {errors.progress_percentage && (
              <p className="text-sm text-destructive">{errors.progress_percentage.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" {...register('progress_date')} />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="What progress was observed? What happened during the session?"
              {...register('notes')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Evidence</Label>
            <Textarea
              placeholder="Any evidence of progress? e.g. participant completed task independently"
              {...register('evidence')}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addProgress.isPending}>
              {addProgress.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Progress
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
