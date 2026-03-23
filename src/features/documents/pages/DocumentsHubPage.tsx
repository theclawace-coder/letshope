import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FolderOpen, Download, Eye, Search, FileText, Calendar,
  HardDrive, MoreVertical, Archive, FolderInput, History,
  Shield, AlertTriangle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDocuments, useDocumentDownload } from '../hooks/useDocuments'
import { useArchiveDocument, useMoveDocument } from '../hooks/useDocumentMutations'
import { useLogDocumentAccess } from '../hooks/useDocumentAccessLog'
import { useDocumentFolders } from '../hooks/useDocumentFolders'
import { DocumentFoldersSidebar } from '../components/DocumentFoldersSidebar'
import { DocumentDetailSheet } from '../components/DocumentDetailSheet'
import { UploadDocumentDialog } from '../components/UploadDocumentDialog'
import { formatDate } from '@/lib/formatters'
import { useAuth } from '@/providers/AuthProvider'
import { DOCUMENT_TYPES } from '@/lib/pdf/document-registry'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types/database'

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
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
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'archived', label: 'Archived' },
  { value: 'expired', label: 'Expired' },
]

const CATEGORY_COLORS: Record<string, string> = {
  service_agreement: 'bg-violet-100 text-violet-800',
  consent_form: 'bg-blue-100 text-blue-800',
  welcome_pack: 'bg-indigo-100 text-indigo-800',
  intake_form: 'bg-sky-100 text-sky-800',
  referral_form: 'bg-cyan-100 text-cyan-800',
  support_plan: 'bg-emerald-100 text-emerald-800',
  risk_assessment: 'bg-orange-100 text-orange-800',
  progress_note: 'bg-green-100 text-green-800',
  incident_report: 'bg-red-100 text-red-800',
  complaint: 'bg-rose-100 text-rose-800',
  exit_transition_plan: 'bg-amber-100 text-amber-800',
  id_document: 'bg-gray-100 text-gray-800',
  screening: 'bg-purple-100 text-purple-800',
  qualification: 'bg-teal-100 text-teal-800',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  pending_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Review',
  approved: 'Approved',
  archived: 'Archived',
  expired: 'Expired',
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getCategoryLabel(category: string): string {
  const match = CATEGORY_OPTIONS.find((c) => c.value === category)
  if (match) return match.label
  const registryMatch = Object.values(DOCUMENT_TYPES).find((d) => d.templateKey === category)
  if (registryMatch) return registryMatch.label
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function DocumentsHubPage() {
  const { profile } = useAuth()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<Tables<'documents'> | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: documents, isLoading } = useDocuments(
    categoryFilter !== 'all' ? { category: categoryFilter } : undefined
  )
  const { data: folders } = useDocumentFolders()
  const { downloadDocument, previewDocument } = useDocumentDownload()
  const archiveDocument = useArchiveDocument()
  const moveDocument = useMoveDocument()
  const logAccess = useLogDocumentAccess()

  const filtered = (documents || []).filter((doc) => {
    // Status filter
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false
    // Folder filter
    if (selectedFolderId !== null && doc.folder_id !== selectedFolderId) return false
    // Search
    if (!search) return true
    const term = search.toLowerCase()
    return (
      doc.name.toLowerCase().includes(term) ||
      doc.category.toLowerCase().includes(term) ||
      (doc.description || '').toLowerCase().includes(term) ||
      (doc.tags || []).some((t) => t.toLowerCase().includes(term))
    )
  })

  // Retention warnings
  const retentionSoon = (documents || []).filter((doc) => {
    if (!doc.retention_date || doc.status === 'archived') return false
    const daysLeft = Math.ceil(
      (new Date(doc.retention_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return daysLeft <= 90 && daysLeft > 0
  })

  function handleOpenDetail(doc: Tables<'documents'>) {
    setSelectedDoc(doc)
    setDetailOpen(true)
  }

  async function handlePreview(doc: Tables<'documents'>) {
    await previewDocument(doc)
    logAccess.mutate({
      document_id: doc.id,
      action: 'viewed',
      performed_by: profile?.id,
    })
  }

  async function handleDownload(doc: Tables<'documents'>) {
    await downloadDocument(doc)
    logAccess.mutate({
      document_id: doc.id,
      action: 'downloaded',
      performed_by: profile?.id,
    })
  }

  async function handleArchive(doc: Tables<'documents'>) {
    try {
      await archiveDocument.mutateAsync(doc.id)
      logAccess.mutate({
        document_id: doc.id,
        action: 'archived',
        performed_by: profile?.id,
      })
      toast.success('Document archived')
    } catch {
      toast.error('Failed to archive')
    }
  }

  async function handleMoveToFolder(doc: Tables<'documents'>, folderId: string | null) {
    try {
      await moveDocument.mutateAsync({ id: doc.id, folderId })
      logAccess.mutate({
        document_id: doc.id,
        action: 'moved',
        performed_by: profile?.id,
        metadata: { folder_id: folderId },
      })
      toast.success('Document moved')
    } catch {
      toast.error('Failed to move document')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Documents"
          description="All generated and uploaded documents across the organisation"
        />
        <UploadDocumentDialog defaultFolderId={selectedFolderId} />
      </div>

      {/* Retention warnings banner */}
      {retentionSoon.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 mb-6">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {retentionSoon.length} document{retentionSoon.length !== 1 ? 's' : ''} approaching retention date
            </p>
            <p className="text-xs text-amber-600">
              These documents are within 90 days of their NDIS retention policy deadline.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => setStatusFilter('all')}
          >
            Review
          </Button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 shrink-0 hidden lg:block">
          <DocumentFoldersSidebar
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents, tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || 'all')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No documents found"
              description={
                search || categoryFilter !== 'all' || statusFilter !== 'all' || selectedFolderId
                  ? 'Try adjusting your search, filter, or folder selection.'
                  : 'Documents will appear here as they are generated during onboarding, incidents, complaints, and other processes.'
              }
            />
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                {filtered.length} document{filtered.length !== 1 ? 's' : ''}
              </p>

              {filtered.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  folders={folders || []}
                  onPreview={() => handlePreview(doc)}
                  onDownload={() => handleDownload(doc)}
                  onOpenDetail={() => handleOpenDetail(doc)}
                  onArchive={() => handleArchive(doc)}
                  onMoveToFolder={(folderId) => handleMoveToFolder(doc, folderId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail sheet */}
      <DocumentDetailSheet
        document={selectedDoc}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}

function DocumentRow({
  doc,
  folders,
  onPreview,
  onDownload,
  onOpenDetail,
  onArchive,
  onMoveToFolder,
}: {
  doc: Tables<'documents'>
  folders: Tables<'document_folders'>[]
  onPreview: () => void
  onDownload: () => void
  onOpenDetail: () => void
  onArchive: () => void
  onMoveToFolder: (folderId: string | null) => void
}) {
  const categoryColor = CATEGORY_COLORS[doc.category] || 'bg-gray-100 text-gray-800'
  const statusColor = STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-800'

  // Check if nearing retention
  const isRetentionSoon = doc.retention_date && (() => {
    const days = Math.ceil(
      (new Date(doc.retention_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return days <= 90 && days > 0
  })()

  return (
    <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={onOpenDetail}>
      <CardContent className="flex items-center gap-4 py-3 px-4">
        <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{doc.name}</p>
            {doc.version > 1 && (
              <Badge variant="outline" className="text-[10px] gap-0.5 shrink-0">
                <History className="h-2.5 w-2.5" />
                v{doc.version}
              </Badge>
            )}
            {isRetentionSoon && (
              <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="secondary" className={`text-[10px] ${categoryColor}`}>
              {getCategoryLabel(doc.category)}
            </Badge>
            <Badge variant="secondary" className={`text-[10px] ${statusColor}`}>
              {STATUS_LABELS[doc.status] || doc.status}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(doc.created_at)}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              {formatFileSize(doc.file_size)}
            </span>
            {doc.tags && doc.tags.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {doc.tags.slice(0, 2).join(', ')}
                {doc.tags.length > 2 && ` +${doc.tags.length - 2}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={onPreview} title="Preview">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDownload} title="Download">
            <Download className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>} />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenDetail}>
                <FileText className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {folders.length > 0 && (
                <>
                  {folders.map((f) => (
                    <DropdownMenuItem
                      key={f.id}
                      onClick={() => onMoveToFolder(f.id)}
                      disabled={doc.folder_id === f.id}
                    >
                      <FolderInput className="h-4 w-4 mr-2" />
                      Move to {f.name}
                    </DropdownMenuItem>
                  ))}
                  {doc.folder_id && (
                    <DropdownMenuItem onClick={() => onMoveToFolder(null)}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Remove from folder
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              {doc.status !== 'archived' && (
                <DropdownMenuItem className="text-destructive" onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
