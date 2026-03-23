import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileUpload } from '@/components/shared/FileUpload'
import { Upload, Loader2 } from 'lucide-react'
import { useUploadDocument } from '../hooks/useDocumentMutations'
import { useDocumentFolders } from '../hooks/useDocumentFolders'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from 'sonner'

const UPLOAD_CATEGORIES = [
  { value: 'service_agreement', label: 'Service Agreement' },
  { value: 'consent_form', label: 'Consent Form' },
  { value: 'welcome_pack', label: 'Welcome Pack / Handbook' },
  { value: 'intake_form', label: 'Intake Form' },
  { value: 'referral_form', label: 'Referral Form' },
  { value: 'support_plan', label: 'Support Plan' },
  { value: 'risk_assessment', label: 'Risk Assessment' },
  { value: 'progress_note', label: 'Progress Notes' },
  { value: 'incident_report', label: 'Incident Report' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'exit_transition_plan', label: 'Exit & Transition Plan' },
  { value: 'id_document', label: 'ID Document' },
  { value: 'screening', label: 'Screening' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'other', label: 'Other' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
]

interface UploadDocumentDialogProps {
  participantId?: string
  workerId?: string
  defaultFolderId?: string | null
  trigger?: React.ReactNode
}

export function UploadDocumentDialog({
  participantId,
  workerId,
  defaultFolderId,
  trigger,
}: UploadDocumentDialogProps) {
  const { profile } = useAuth()
  const { data: folders } = useDocumentFolders()
  const uploadDocument = useUploadDocument()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('other')
  const [folderId, setFolderId] = useState<string>(defaultFolderId || '')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'pending_review' | 'approved'>('approved')
  const [tags, setTags] = useState('')

  function reset() {
    setFile(null)
    setName('')
    setCategory('other')
    setFolderId(defaultFolderId || '')
    setDescription('')
    setStatus('approved')
    setTags('')
  }

  async function handleUpload() {
    if (!file || !name.trim()) return

    try {
      await uploadDocument.mutateAsync({
        file,
        name: name.trim(),
        category,
        participantId,
        workerId,
        folderId: folderId || undefined,
        description: description || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        status,
        uploadedBy: profile?.id,
      })
      toast.success('Document uploaded')
      setOpen(false)
      reset()
    } catch {
      toast.error('Failed to upload document')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a file and fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          {/* File */}
          <FileUpload
            onUpload={async (f) => setFile(f)}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{file.name}</span>{' '}
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}

          {/* Name */}
          <div>
            <Label>Document Name *</Label>
            <Input
              className="mt-1.5"
              placeholder="e.g. John Smith Service Agreement"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UPLOAD_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Folder */}
          <div>
            <Label>Folder</Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="No folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No folder</SelectItem>
                {(folders || []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-1.5"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <Input
              className="mt-1.5"
              placeholder="Comma-separated tags, e.g. ndis, compliance, urgent"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset() }}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !name.trim() || uploadDocument.isPending}
          >
            {uploadDocument.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
