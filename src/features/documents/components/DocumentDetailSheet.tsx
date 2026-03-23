import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Download, Eye, Archive, FileText, Clock, Tag,
  Folder, User, Calendar, HardDrive, Shield,
} from 'lucide-react'
import { DocumentVersionHistory } from './DocumentVersionHistory'
import { DocumentAccessLog } from './DocumentAccessLog'
import { useDocumentDownload } from '../hooks/useDocuments'
import { useUpdateDocument, useArchiveDocument } from '../hooks/useDocumentMutations'
import { useLogDocumentAccess } from '../hooks/useDocumentAccessLog'
import { useAuth } from '@/providers/AuthProvider'
import { formatDate } from '@/lib/formatters'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types/database'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  pending_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  archived: 'Archived',
  expired: 'Expired',
}

interface DocumentDetailSheetProps {
  document: Tables<'documents'> | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocumentDetailSheet({ document: doc, open, onOpenChange }: DocumentDetailSheetProps) {
  const { profile } = useAuth()
  const { downloadDocument, previewDocument } = useDocumentDownload()
  const updateDocument = useUpdateDocument()
  const archiveDocument = useArchiveDocument()
  const logAccess = useLogDocumentAccess()
  const [tab, setTab] = useState('details')

  if (!doc) return null

  async function handlePreview() {
    if (!doc) return
    await previewDocument(doc)
    logAccess.mutate({
      document_id: doc.id,
      action: 'viewed',
      performed_by: profile?.id,
    })
  }

  async function handleDownload() {
    if (!doc) return
    await downloadDocument(doc)
    logAccess.mutate({
      document_id: doc.id,
      action: 'downloaded',
      performed_by: profile?.id,
    })
  }

  async function handleStatusChange(newStatus: string) {
    if (!doc) return
    try {
      await updateDocument.mutateAsync({
        id: doc.id,
        status: newStatus as Tables<'documents'>['status'],
      })
      logAccess.mutate({
        document_id: doc.id,
        action: 'status_changed',
        performed_by: profile?.id,
        metadata: { old_status: doc.status, new_status: newStatus },
      })
      toast.success(`Status updated to ${STATUS_LABELS[newStatus] || newStatus}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleArchive() {
    if (!doc) return
    try {
      await archiveDocument.mutateAsync(doc.id)
      logAccess.mutate({
        document_id: doc.id,
        action: 'archived',
        performed_by: profile?.id,
      })
      toast.success('Document archived')
      onOpenChange(false)
    } catch {
      toast.error('Failed to archive document')
    }
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const statusColor = STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-800'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[520px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 pr-6">
            <FileText className="h-5 w-5 text-violet-600 shrink-0" />
            <span className="truncate">{doc.name}</span>
          </SheetTitle>
          <SheetDescription>
            v{doc.version} &middot; {formatDate(doc.created_at)}
          </SheetDescription>
        </SheetHeader>

        {/* Quick actions */}
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handlePreview}>
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          {doc.status !== 'archived' && (
            <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={handleArchive}>
              <Archive className="h-3.5 w-3.5" />
              Archive
            </Button>
          )}
        </div>

        <Separator className="my-4" />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            <TabsTrigger value="versions" className="flex-1">Versions</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Status
              </span>
              <Select value={doc.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px] h-8">
                  <Badge className={`${statusColor} text-xs`}>
                    {STATUS_LABELS[doc.status] || doc.status}
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3">
              <MetaItem icon={Folder} label="Category" value={doc.category.replace(/_/g, ' ')} />
              <MetaItem icon={HardDrive} label="Size" value={formatFileSize(doc.file_size)} />
              <MetaItem icon={Calendar} label="Created" value={formatDate(doc.created_at)} />
              <MetaItem icon={Clock} label="Updated" value={formatDate(doc.updated_at)} />
              <MetaItem icon={User} label="Version" value={`v${doc.version}`} />
              {doc.retention_date && (
                <MetaItem icon={Shield} label="Retention" value={formatDate(doc.retention_date)} />
              )}
            </div>

            {/* Description */}
            {doc.description && (
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{doc.description}</p>
              </div>
            )}

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="versions" className="mt-4">
            <DocumentVersionHistory document={doc} />
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <DocumentAccessLog documentId={doc.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border p-2.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="text-sm font-medium mt-0.5 capitalize">{value}</p>
    </div>
  )
}
