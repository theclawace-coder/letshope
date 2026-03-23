import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { riskMitigationSchema, type RiskMitigationFormData } from '../schemas'
import { useCreateMitigation } from '../hooks/useRisks'
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

interface RiskMitigationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  riskId: string
}

export function RiskMitigationDialog({ open, onOpenChange, riskId }: RiskMitigationDialogProps) {
  const createMitigation = useCreateMitigation()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RiskMitigationFormData>({
    resolver: zodResolver(riskMitigationSchema),
    defaultValues: {
      priority: 'medium',
    },
  })

  const onSubmit = async (data: RiskMitigationFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await createMitigation.mutateAsync({
        risk_id: riskId,
        action: data.action,
        target_date: data.target_date || null,
        priority: data.priority,
        responsible_person: user?.id || null,
      })
      onOpenChange(false)
      reset()
    } catch {
      toast.error('Failed to add mitigation plan')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Mitigation Action</DialogTitle>
          <DialogDescription>
            Define an action to reduce or control this risk.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Action *</Label>
            <Textarea
              placeholder="Describe the mitigation action to be taken..."
              {...register('action')}
              rows={3}
            />
            {errors.action && <p className="text-sm text-destructive">{errors.action.message}</p>}
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={watch('priority') || 'medium'}
                onValueChange={(v) => v && setValue('priority', v as RiskMitigationFormData['priority'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input type="date" {...register('target_date')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMitigation.isPending}>
              {createMitigation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Action
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
