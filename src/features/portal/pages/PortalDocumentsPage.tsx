import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePortalAuth, usePortalDocuments } from '../hooks/usePortal'
import { supabase } from '@/lib/supabase'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate } from '@/lib/formatters'
import { FolderOpen, Download, FileText, FileImage, File } from 'lucide-react'
import { toast } from 'sonner'

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText
  return File
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PortalDocumentsPage() {
  const { session } = usePortalAuth()
  const documents = usePortalDocuments(session?.participantId)

  async function handleDownload(filePath: string, _fileName: string) {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch {
      toast.error('Unable to download document. Please try again.')
    }
  }

  if (documents.isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FolderOpen className="h-6 w-6" />
          My Documents
        </h1>
        <p className="text-muted-foreground mt-1">
          View and download your documents from Hope Disability Support.
        </p>
      </div>

      {!documents.data || documents.data.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents yet"
          description="Documents like your Service Agreement, Support Plan, and reports will appear here."
        />
      ) : (
        <div className="space-y-3">
          {documents.data.map((doc) => {
            const Icon = getFileIcon(doc.mime_type)
            return (
              <Card key={doc.id}>
                <CardContent className="flex items-center justify-between gap-4 pt-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{doc.category.replace(/_/g, ' ')}</span>
                        {doc.file_size && (
                          <>
                            <span>&middot;</span>
                            <span>{formatFileSize(doc.file_size)}</span>
                          </>
                        )}
                        <span>&middot;</span>
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc.file_path, doc.name)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
