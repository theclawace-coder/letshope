import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { History, Upload, Download, FileText, Loader2 } from 'lucide-react'
import { useDocumentVersions, useCreateDocumentVersion } from '../hooks/useDocumentVersions'
import { useDocumentDownload } from '../hooks/useDocuments'
import { formatDate } from '@/lib/formatters'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types/database'

interface DocumentVersionHistoryProps {
  document: Tables<'documents'>
}

export function DocumentVersionHistory({ document: doc }: DocumentVersionHistoryProps) {
  const { profile } = useAuth()
  const { data: versions, isLoading } = useDocumentVersions(doc.id)
  const createVersion = useCreateDocumentVersion()
  const { downloadDocument } = useDocumentDownload()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [changeSummary, setChangeSummary] = useState('')

  async function handleUploadVersion() {
    if (!file) return

    try {
      await createVersion.mutateAsync({
        documentId: doc.id,
        file,
        changeSummary: changeSummary || undefined,
        uploadedBy: profile?.id,
      })
      toast.success('New version uploaded')
      setOpen(false)
      setFile(null)
      setChangeSummary('')
    } catch {
      toast.error('Failed to upload new version')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                New Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Version</DialogTitle>
                <DialogDescription>
                  Upload a new version of "{doc.name}". The current version is v{doc.version}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>File</Label>
                  <Input
                    type="file"
                    className="mt-1.5"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <Label>What changed?</Label>
                  <Textarea
                    placeholder="Describe what's different in this version..."
                    className="mt-1.5"
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleUploadVersion}
                  disabled={!file || createVersion.isPending}
                >
                  {createVersion.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Upload v{(doc.version || 1) + 1}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !versions?.length ? (
          <p className="text-sm text-muted-foreground py-2">
            No previous versions. This is the original document (v{doc.version}).
          </p>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 rounded-lg border p-2.5 text-sm"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      v{v.version_number}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(v.created_at)}
                    </span>
                  </div>
                  {v.change_summary && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {v.change_summary}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() =>
                    downloadDocument({
                      ...doc,
                      file_path: v.file_path,
                      name: `${doc.name}_v${v.version_number}`,
                    })
                  }
                  title="Download this version"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
