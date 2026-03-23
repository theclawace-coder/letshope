import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { riskAssessmentSchema, type RiskAssessmentFormData } from '../schemas'
import { useCreateAssessment } from '../hooks/useRisks'
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
import { Badge } from '@/components/ui/badge'
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
import {
  RISK_LIKELIHOODS,
  RISK_CONSEQUENCES,
  RISK_LEVELS,
  calculateRiskLevel,
} from '@/lib/constants'

interface RiskAssessmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  riskId: string
}

export function RiskAssessmentDialog({ open, onOpenChange, riskId }: RiskAssessmentDialogProps) {
  const createAssessment = useCreateAssessment()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RiskAssessmentFormData>({
    resolver: zodResolver(riskAssessmentSchema),
    defaultValues: {
      likelihood: 'possible',
      consequence: 'moderate',
    },
  })

  const likelihood = watch('likelihood')
  const consequence = watch('consequence')
  const calculatedLevel = likelihood && consequence ? calculateRiskLevel(likelihood, consequence) : null
  const levelInfo = RISK_LEVELS.find((l) => l.value === calculatedLevel)

  const envScore = watch('environmental_score') ?? 0
  const healthScore = watch('health_score') ?? 0
  const behavScore = watch('behavioral_score') ?? 0
  const overallScore = envScore + healthScore + behavScore

  const onSubmit = async (data: RiskAssessmentFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await createAssessment.mutateAsync({
        risk_id: riskId,
        assessed_by: user?.id || null,
        likelihood: data.likelihood,
        consequence: data.consequence,
        calculated_level: calculatedLevel,
        environmental_score: data.environmental_score || null,
        health_score: data.health_score || null,
        behavioral_score: data.behavioral_score || null,
        overall_score: overallScore || null,
        findings: data.findings,
        recommendations: data.recommendations || null,
      })
      onOpenChange(false)
      reset()
    } catch {
      toast.error('Failed to record assessment')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Risk Assessment</DialogTitle>
          <DialogDescription>
            Reassess this risk using the likelihood x consequence matrix.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>Likelihood *</Label>
              <Select
                value={watch('likelihood') || ''}
                onValueChange={(v) => v && setValue('likelihood', v as RiskAssessmentFormData['likelihood'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_LIKELIHOODS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.likelihood && <p className="text-sm text-destructive">{errors.likelihood.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Consequence *</Label>
              <Select
                value={watch('consequence') || ''}
                onValueChange={(v) => v && setValue('consequence', v as RiskAssessmentFormData['consequence'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_CONSEQUENCES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.consequence && <p className="text-sm text-destructive">{errors.consequence.message}</p>}
            </div>
          </div>

          {calculatedLevel && levelInfo && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
              <span className="text-sm font-medium">Calculated Level:</span>
              <Badge variant="secondary" className={levelInfo.color}>{levelInfo.label}</Badge>
            </div>
          )}

          <div className="grid gap-4 grid-cols-3">
            <div className="space-y-2">
              <Label>Environment (0-10)</Label>
              <Input type="number" min={0} max={10} {...register('environmental_score')} />
            </div>
            <div className="space-y-2">
              <Label>Health (0-10)</Label>
              <Input type="number" min={0} max={10} {...register('health_score')} />
            </div>
            <div className="space-y-2">
              <Label>Behavioral (0-10)</Label>
              <Input type="number" min={0} max={10} {...register('behavioral_score')} />
            </div>
          </div>

          {overallScore > 0 && (
            <p className="text-sm text-muted-foreground">Overall Score: <strong>{overallScore}/30</strong></p>
          )}

          <div className="space-y-2">
            <Label>Findings *</Label>
            <Textarea
              placeholder="Describe what was assessed and observed..."
              {...register('findings')}
              rows={3}
            />
            {errors.findings && <p className="text-sm text-destructive">{errors.findings.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Recommendations</Label>
            <Textarea
              placeholder="Any recommended changes to controls or mitigation..."
              {...register('recommendations')}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAssessment.isPending}>
              {createAssessment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Assessment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
