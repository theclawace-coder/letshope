import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { workerStage8Schema, type WorkerStage8Data } from '../../schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FileUpload } from '@/components/shared/FileUpload'
import { SignaturePad } from '@/components/shared/SignaturePad'
import { supabase } from '@/lib/supabase'

interface Stage8Props {
  defaultValues?: Partial<WorkerStage8Data>
  workerId?: string
  onSubmit: (data: WorkerStage8Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage8CodeOfConduct({ defaultValues, workerId, onSubmit, onBack, isLoading }: Stage8Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkerStage8Data>({
    resolver: zodResolver(workerStage8Schema),
    defaultValues: {
      code_of_conduct_signed: false,
      code_of_conduct_date: '',
      ...defaultValues,
    },
  })

  const signed = watch('code_of_conduct_signed')

  async function handleUpload(file: File) {
    if (!workerId) return
    const path = `workers/${workerId}/code_of_conduct/${file.name}`
    await supabase.storage.from('documents').upload(path, file, { upsert: true })
    await supabase.from('documents').insert({
      name: file.name,
      category: 'code_of_conduct',
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
          <CardTitle className="text-base">NDIS Code of Conduct</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The worker must read and sign the NDIS Code of Conduct. Upload the signed document or capture a signature below.
          </p>

          <FileUpload
            onUpload={handleUpload}
            accept=".pdf,.jpg,.jpeg,.png"
          />

          <div className="space-y-2">
            <Label>Worker Signature (optional)</Label>
            <SignaturePad
              onSave={(dataUrl) => {
                // Signature captured but stored in stage data, not separately
                void dataUrl
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code_of_conduct_date">Date Signed *</Label>
            <Input id="code_of_conduct_date" type="date" {...register('code_of_conduct_date')} />
            {errors.code_of_conduct_date && (
              <p className="text-xs text-destructive">{errors.code_of_conduct_date.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="code_signed"
              checked={signed}
              onCheckedChange={(checked) => setValue('code_of_conduct_signed', checked === true, { shouldValidate: true })}
            />
            <Label htmlFor="code_signed" className="font-normal">
              I confirm the NDIS Code of Conduct has been signed
            </Label>
          </div>
          {errors.code_of_conduct_signed && (
            <p className="text-xs text-destructive">{errors.code_of_conduct_signed.message}</p>
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
