import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUpload } from '@/components/shared/FileUpload'
import { Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'
import { ID_DOCUMENT_TYPES } from '../../constants'
import { supabase } from '@/lib/supabase'
import type { WorkerStage3Data } from '../../schemas'

interface IdentityDoc {
  doc_type: string
  points: number
}

interface Stage3Props {
  defaultValues?: Partial<WorkerStage3Data>
  workerId?: string
  onSubmit: (data: WorkerStage3Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage3IdentityPoints({ defaultValues, workerId, onSubmit, onBack, isLoading }: Stage3Props) {
  const [documents, setDocuments] = useState<IdentityDoc[]>(
    defaultValues?.identity_documents || []
  )

  const totalPoints = useMemo(() => documents.reduce((sum, d) => sum + d.points, 0), [documents])
  const isValid = totalPoints >= 100

  function addDocument(docType: string) {
    const docInfo = ID_DOCUMENT_TYPES.find((d) => d.value === docType)
    if (!docInfo) return
    setDocuments((prev) => [...prev, { doc_type: docType, points: docInfo.points }])
  }

  function removeDocument(index: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleUpload(file: File) {
    if (!workerId) return
    const path = `workers/${workerId}/id_documents/${file.name}`
    await supabase.storage.from('documents').upload(path, file, { upsert: true })
    await supabase.from('documents').insert({
      name: file.name,
      category: 'id_document',
      worker_id: workerId,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
    } as never)
  }

  function handleFormSubmit() {
    if (!isValid) return
    onSubmit({
      identity_documents: documents,
      total_points: totalPoints,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">100 Points of ID Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-4">
            <div>
              <p className="text-sm font-medium">Total Points</p>
              <p className="text-3xl font-bold">{totalPoints}</p>
            </div>
            <div>
              {isValid ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> 100+ Points
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Need {100 - totalPoints} more
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {documents.map((doc, i) => {
              const info = ID_DOCUMENT_TYPES.find((d) => d.value === doc.doc_type)
              return (
                <div key={i} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{doc.points} pts</Badge>
                    <span>{info?.label || doc.doc_type}</span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeDocument(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <Select onValueChange={(v: string | null) => { if (v) addDocument(v) }}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Add a document..." />
              </SelectTrigger>
              <SelectContent>
                {ID_DOCUMENT_TYPES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label} ({d.points} pts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="icon" disabled>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <FileUpload
            onUpload={handleUpload}
            accept=".pdf,.jpg,.jpeg,.png"
          />

          {!isValid && documents.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need at least 100 points of identification. Add more documents above.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleFormSubmit} disabled={isLoading || !isValid}>
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
}
