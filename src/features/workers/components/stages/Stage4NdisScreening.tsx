import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { workerStage4Schema, type WorkerStage4Data } from '../../schemas'
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
import { ShieldX } from 'lucide-react'
import { SCREENING_STATUS_OPTIONS } from '../../constants'
import { supabase } from '@/lib/supabase'

interface Stage4Props {
  defaultValues?: Partial<WorkerStage4Data>
  workerId?: string
  onSubmit: (data: WorkerStage4Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage4NdisScreening({ defaultValues, workerId, onSubmit, onBack, isLoading }: Stage4Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkerStage4Data>({
    resolver: zodResolver(workerStage4Schema),
    defaultValues: {
      ndis_screening_status: 'not_started',
      ...defaultValues,
    },
  })

  const status = watch('ndis_screening_status')

  async function handleUpload(file: File) {
    if (!workerId) return
    const path = `workers/${workerId}/ndis_screening/${file.name}`
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
          <CardTitle className="text-base">NDIS Worker Screening Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Record the NDIS Worker Screening Check status. Workers cannot be assigned to participants until this is "Cleared".
          </p>

          <div className="space-y-2">
            <Label>Screening Status *</Label>
            <Select
              value={status}
              onValueChange={(v) => setValue('ndis_screening_status', v as WorkerStage4Data['ndis_screening_status'], { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCREENING_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === 'barred' && (
            <Alert variant="destructive">
              <ShieldX className="h-4 w-4" />
              <AlertDescription>
                This worker has been BARRED by the NDIS Commission. They CANNOT provide NDIS supports. This must be escalated immediately.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ndis_screening_number">Screening Number</Label>
              <Input id="ndis_screening_number" {...register('ndis_screening_number')} placeholder="e.g., NDIS-2024-XXXXX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ndis_screening_date">Screening Date</Label>
              <Input id="ndis_screening_date" type="date" {...register('ndis_screening_date')} />
            </div>
          </div>

          {(status === 'cleared' || status === 'pending') && (
            <FileUpload
              onUpload={handleUpload}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          )}
          {errors.ndis_screening_status && (
            <p className="text-xs text-destructive">{errors.ndis_screening_status.message}</p>
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
