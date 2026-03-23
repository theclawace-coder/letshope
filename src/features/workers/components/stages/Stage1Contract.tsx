import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { workerStage1Schema, type WorkerStage1Data } from '../../schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FileUpload } from '@/components/shared/FileUpload'
import { supabase } from '@/lib/supabase'

interface Stage1Props {
  defaultValues?: Partial<WorkerStage1Data>
  workerId?: string
  onSubmit: (data: WorkerStage1Data) => void
  isLoading: boolean
}

export function Stage1Contract({ defaultValues, workerId, onSubmit, isLoading }: Stage1Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkerStage1Data>({
    resolver: zodResolver(workerStage1Schema),
    defaultValues: {
      contract_signed: false,
      contract_date: '',
      ...defaultValues,
    },
  })

  const contractSigned = watch('contract_signed')

  async function handleUpload(file: File) {
    if (!workerId) return
    const path = `workers/${workerId}/contract/${file.name}`
    await supabase.storage.from('documents').upload(path, file, { upsert: true })
    await supabase.from('documents').insert({
      name: file.name,
      category: 'contract',
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
          <CardTitle className="text-base">Letter of Engagement / Contract</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload the signed letter of engagement or employment contract.
          </p>

          <FileUpload
            onUpload={handleUpload}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />

          <div className="space-y-2">
            <Label htmlFor="contract_date">Contract Date *</Label>
            <Input id="contract_date" type="date" {...register('contract_date')} />
            {errors.contract_date && (
              <p className="text-xs text-destructive">{errors.contract_date.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="contract_signed"
              checked={contractSigned}
              onCheckedChange={(checked) => setValue('contract_signed', checked === true, { shouldValidate: true })}
            />
            <Label htmlFor="contract_signed" className="font-normal">
              I confirm the contract has been signed
            </Label>
          </div>
          {errors.contract_signed && (
            <p className="text-xs text-destructive">{errors.contract_signed.message}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </form>
  )
}
