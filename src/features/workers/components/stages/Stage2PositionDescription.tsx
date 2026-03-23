import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { workerStage2Schema, type WorkerStage2Data } from '../../schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FileUpload } from '@/components/shared/FileUpload'
import { supabase } from '@/lib/supabase'

interface Stage2Props {
  defaultValues?: Partial<WorkerStage2Data>
  workerId?: string
  roleTitle?: string
  onSubmit: (data: WorkerStage2Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage2PositionDescription({ defaultValues, workerId, roleTitle, onSubmit, onBack, isLoading }: Stage2Props) {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkerStage2Data>({
    resolver: zodResolver(workerStage2Schema),
    defaultValues: {
      position_description_acknowledged: false,
      ...defaultValues,
    },
  })

  const acknowledged = watch('position_description_acknowledged')

  async function handleUpload(file: File) {
    if (!workerId) return
    const path = `workers/${workerId}/position_description/${file.name}`
    await supabase.storage.from('documents').upload(path, file, { upsert: true })
    await supabase.from('documents').insert({
      name: file.name,
      category: 'position_description',
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
          <CardTitle className="text-base">Position Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload the position description for the role of <strong>{roleTitle || 'this worker'}</strong> and confirm it has been acknowledged.
          </p>

          <FileUpload
            onUpload={handleUpload}
            accept=".pdf,.doc,.docx"
          />

          <div className="flex items-center gap-2">
            <Checkbox
              id="pd_acknowledged"
              checked={acknowledged}
              onCheckedChange={(checked) => setValue('position_description_acknowledged', checked === true, { shouldValidate: true })}
            />
            <Label htmlFor="pd_acknowledged" className="font-normal">
              Worker has read and acknowledged the position description
            </Label>
          </div>
          {errors.position_description_acknowledged && (
            <p className="text-xs text-destructive">{errors.position_description_acknowledged.message}</p>
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
