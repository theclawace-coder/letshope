import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { withdrawConsentSchema, type WithdrawConsentData } from '../schemas'
import { useUpdateConsent } from '../hooks/useConsents'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface WithdrawConsentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  consentId: string
}

export function WithdrawConsentDialog({ open, onOpenChange, consentId }: WithdrawConsentDialogProps) {
  const updateConsent = useUpdateConsent()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WithdrawConsentData>({
    resolver: zodResolver(withdrawConsentSchema),
  })

  const onSubmit = async (data: WithdrawConsentData) => {
    try {
      await updateConsent.mutateAsync({
        id: consentId,
        consent_status: 'withdrawn',
        withdrawn_date: new Date().toISOString().split('T')[0],
        withdrawn_reason: data.withdrawn_reason,
        withdrawn_by_name: data.withdrawn_by_name,
      })
      toast.success('Consent withdrawn successfully')
      reset()
      onOpenChange(false)
    } catch {
      toast.error('Failed to withdraw consent')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw Consent</DialogTitle>
          <DialogDescription>
            Record the withdrawal of consent. This action will be logged in the consent audit trail.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Withdrawn By *</Label>
            <Input placeholder="Name of person withdrawing consent" {...register('withdrawn_by_name')} />
            {errors.withdrawn_by_name && (
              <p className="text-sm text-destructive">{errors.withdrawn_by_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Reason for Withdrawal *</Label>
            <Textarea
              placeholder="Why is consent being withdrawn?"
              {...register('withdrawn_reason')}
              rows={3}
            />
            {errors.withdrawn_reason && (
              <p className="text-sm text-destructive">{errors.withdrawn_reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={updateConsent.isPending}>
              {updateConsent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Withdraw Consent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
