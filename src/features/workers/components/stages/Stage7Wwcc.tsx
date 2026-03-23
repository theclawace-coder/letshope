import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { workerStage7Schema, type WorkerStage7Data } from '../../schemas'
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
import { Switch } from '@/components/ui/switch'
import { FileUpload } from '@/components/shared/FileUpload'
import { Info } from 'lucide-react'
import { WWCC_STATUS_OPTIONS } from '../../constants'
import { supabase } from '@/lib/supabase'

interface Stage7Props {
  defaultValues?: Partial<WorkerStage7Data>
  workerId?: string
  onSubmit: (data: WorkerStage7Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage7Wwcc({ defaultValues, workerId, onSubmit, onBack, isLoading }: Stage7Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkerStage7Data>({
    resolver: zodResolver(workerStage7Schema),
    defaultValues: {
      wwcc_required: false,
      wwcc_status: 'not_required',
      ...defaultValues,
    },
  })

  const isRequired = watch('wwcc_required')
  const status = watch('wwcc_status')

  function handleToggle(checked: boolean) {
    setValue('wwcc_required', checked)
    if (!checked) {
      setValue('wwcc_status', 'not_required')
      setValue('wwcc_number', '')
      setValue('wwcc_expiry', '')
    } else {
      setValue('wwcc_status', 'not_started')
    }
  }

  async function handleUpload(file: File) {
    if (!workerId) return
    const path = `workers/${workerId}/wwcc/${file.name}`
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
          <CardTitle className="text-base">Working With Children Check (WWCC)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="wwcc_toggle" className="font-medium">Will this worker support participants under 18?</Label>
              <p className="text-sm text-muted-foreground">If yes, a WWCC is required.</p>
            </div>
            <Switch
              id="wwcc_toggle"
              checked={isRequired}
              onCheckedChange={handleToggle}
            />
          </div>

          {!isRequired && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Even if not currently needed, we recommend workers obtain a WWCC. In NSW, apply via Service NSW.
              </AlertDescription>
            </Alert>
          )}

          {isRequired && (
            <>
              <div className="space-y-2">
                <Label>WWCC Status</Label>
                <Select
                  value={status || 'not_started'}
                  onValueChange={(v) => setValue('wwcc_status', v || '', { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WWCC_STATUS_OPTIONS.filter((o) => o.value !== 'not_required').map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wwcc_number">WWCC Number</Label>
                  <Input id="wwcc_number" {...register('wwcc_number')} placeholder="e.g., WWC1234567E" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wwcc_expiry">Expiry Date</Label>
                  <Input id="wwcc_expiry" type="date" {...register('wwcc_expiry')} />
                </div>
              </div>

              <FileUpload
                onUpload={handleUpload}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </>
          )}
          {errors.wwcc_status && (
            <p className="text-xs text-destructive">{errors.wwcc_status.message}</p>
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
