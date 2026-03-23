import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { workerStage6Schema, type WorkerStage6Data } from '../../schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FileUpload } from '@/components/shared/FileUpload'
import { supabase } from '@/lib/supabase'

interface Stage6Props {
  defaultValues?: Partial<WorkerStage6Data>
  workerId?: string
  onSubmit: (data: WorkerStage6Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage6Orientation({ defaultValues, workerId, onSubmit, onBack, isLoading }: Stage6Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkerStage6Data>({
    resolver: zodResolver(workerStage6Schema),
    defaultValues: {
      orientation_completed: false,
      orientation_date: '',
      ...defaultValues,
    },
  })

  const completed = watch('orientation_completed')

  async function handleUpload(file: File) {
    if (!workerId) return
    const path = `workers/${workerId}/orientation/${file.name}`
    await supabase.storage.from('documents').upload(path, file, { upsert: true })
    await supabase.from('documents').insert({
      name: file.name,
      category: 'qualification',
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
          <CardTitle className="text-base">NDIS Worker Orientation Module</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The worker must complete the NDIS Worker Orientation Module ("Quality, Safety and You"). Upload the completion certificate as evidence.
          </p>

          <FileUpload
            onUpload={handleUpload}
            accept=".pdf,.jpg,.jpeg,.png"
          />

          <div className="space-y-2">
            <Label htmlFor="orientation_date">Completion Date *</Label>
            <Input id="orientation_date" type="date" {...register('orientation_date')} />
            {errors.orientation_date && (
              <p className="text-xs text-destructive">{errors.orientation_date.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="orientation_completed"
              checked={completed}
              onCheckedChange={(checked) => setValue('orientation_completed', checked === true, { shouldValidate: true })}
            />
            <Label htmlFor="orientation_completed" className="font-normal">
              Worker has completed the NDIS Worker Orientation Module
            </Label>
          </div>
          {errors.orientation_completed && (
            <p className="text-xs text-destructive">{errors.orientation_completed.message}</p>
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
