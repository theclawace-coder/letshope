import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { workerStage5Schema, type WorkerStage5Data } from '../../schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUpload } from '@/components/shared/FileUpload'
import { AlertTriangle } from 'lucide-react'
import { POLICE_CHECK_STATUS_OPTIONS } from '../../constants'
import { supabase } from '@/lib/supabase'

interface Stage5Props {
  defaultValues?: Partial<WorkerStage5Data>
  workerId?: string
  onSubmit: (data: WorkerStage5Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage5PoliceCheck({ defaultValues, workerId, onSubmit, onBack, isLoading }: Stage5Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkerStage5Data>({
    resolver: zodResolver(workerStage5Schema),
    defaultValues: {
      police_check_status: 'not_started',
      ...defaultValues,
    },
  })

  const status = watch('police_check_status')
  const checkDate = watch('police_check_date')

  // Auto-calculate 3-year expiry from check date
  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const date = e.target.value
    setValue('police_check_date', date, { shouldValidate: true })
    if (date) {
      const expiry = new Date(date)
      expiry.setFullYear(expiry.getFullYear() + 3)
      setValue('police_check_expiry', expiry.toISOString().split('T')[0])
    }
  }

  async function handleUpload(file: File) {
    if (!workerId) return
    const path = `workers/${workerId}/police_check/${file.name}`
    await supabase.storage.from('documents').upload(path, file, { upsert: true })
    await supabase.from('documents').insert({
      name: file.name,
      category: 'screening',
      worker_id: workerId,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
    } as never)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">National Police Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The National Police Check must be less than 3 years old and show "No disclosable outcomes".
          </p>

          <div className="space-y-2">
            <Label>Check Status *</Label>
            <Select
              value={status}
              onValueChange={(v) => setValue('police_check_status', v as WorkerStage5Data['police_check_status'], { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POLICE_CHECK_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === 'disclosable' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This check has disclosable outcomes. Escalate to the Director for a risk assessment before proceeding.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="police_check_date">Check Date</Label>
              <Input
                id="police_check_date"
                type="date"
                value={checkDate || ''}
                onChange={handleDateChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="police_check_expiry">Expiry Date (auto-calculated)</Label>
              <Input id="police_check_expiry" type="date" {...register('police_check_expiry')} readOnly className="bg-muted" />
            </div>
          </div>

          {(status === 'clear' || status === 'pending') && (
            <FileUpload
              onUpload={handleUpload}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          )}
          {errors.police_check_status && (
            <p className="text-xs text-destructive">{errors.police_check_status.message}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </form>
  )
}
