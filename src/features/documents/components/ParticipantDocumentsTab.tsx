import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  Download, Eye, FileText, Plus, Loader2,
  FileSignature, ClipboardList, BookOpen,
  ShieldCheck, ClipboardCheck, FolderOpen,
  History, MoreVertical, Archive,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useParticipantDocuments, useDocumentDownload } from '../hooks/useDocuments'
import { useArchiveDocument } from '../hooks/useDocumentMutations'
import { useLogDocumentAccess } from '../hooks/useDocumentAccessLog'
import { DocumentDetailSheet } from './DocumentDetailSheet'
import { UploadDocumentDialog } from './UploadDocumentDialog'
import { formatDate } from '@/lib/formatters'
import {
  generateServiceAgreement,
  generateConsentForm,
  generateParticipantHandbook,
  generateIntakeForm,
  generateReferralForm,
  generateSupportPlan,
  generateRiskAssessment,
  generateExitTransitionPlan,
} from '@/lib/pdf/generate-document'
import { useAuth } from '@/providers/AuthProvider'
import type { Tables } from '@/lib/types/database'
import { toast } from 'sonner'

interface ParticipantDocumentsTabProps {
  participant: Tables<'participants'>
}

const QUICK_GENERATE = [
  { key: 'intake_form', label: 'Intake Form', icon: ClipboardList },
  { key: 'referral_form', label: 'Referral Form', icon: FileText },
  { key: 'service_agreement', label: 'Service Agreement', icon: FileSignature },
  { key: 'consent_form', label: 'Consent Form', icon: FileSignature },
  { key: 'participant_handbook', label: 'Handbook', icon: BookOpen },
  { key: 'support_plan', label: 'Support Plan', icon: ClipboardCheck },
  { key: 'risk_assessment', label: 'Risk Assessment', icon: ShieldCheck },
  { key: 'exit_transition_plan', label: 'Exit Plan', icon: FolderOpen },
] as const

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

export function ParticipantDocumentsTab({ participant }: ParticipantDocumentsTabProps) {
  const { profile } = useAuth()
  const { data: documents, isLoading, refetch } = useParticipantDocuments(participant.id)
  const { downloadDocument, previewDocument } = useDocumentDownload()
  const archiveDocument = useArchiveDocument()
  const logAccess = useLogDocumentAccess()
  const [generating, setGenerating] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<Tables<'documents'> | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  async function handleGenerate(key: string) {
    setGenerating(key)
    try {
      switch (key) {
        case 'intake_form':
          await generateIntakeForm(participant, { preview: true })
          break
        case 'referral_form':
          await generateReferralForm(participant, { preview: true })
          break
        case 'service_agreement': {
          const mockAgreement: Tables<'service_agreements'> = {
            id: crypto.randomUUID(),
            participant_id: participant.id,
            version: 1,
            status: 'draft',
            services: participant.services_requested?.map((code) => ({ code })) || [],
            start_date: participant.plan_start_date,
            end_date: participant.plan_end_date,
            participant_signed: false,
            participant_signed_date: null,
            participant_signature_data: null,
            provider_signed: false,
            provider_signed_date: null,
            file_path: null,
            shared_link: null,
            shared_link_expiry: null,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          await generateServiceAgreement(participant, mockAgreement, { preview: true })
          break
        }
        case 'consent_form':
          await generateConsentForm(participant, undefined, { preview: true })
          break
        case 'participant_handbook':
          await generateParticipantHandbook(participant, { preview: true })
          break
        case 'support_plan':
          await generateSupportPlan(participant, undefined, { preview: true })
          break
        case 'risk_assessment':
          await generateRiskAssessment(participant, {}, { preview: true })
          break
        case 'exit_transition_plan':
          await generateExitTransitionPlan(participant, undefined, { preview: true })
          break
      }
      toast.success('Document generated and stored')
      refetch()
    } catch (err) {
      console.error('Generation error:', err)
      toast.error('Failed to generate document')
    } finally {
      setGenerating(null)
    }
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
      toast.success('Document archived')
    } catch {
      toast.error('Failed to archive')
    }
  }

  // Split docs by status
  const activeDocs = (documents || []).filter((d) => d.status !== 'archived')
  const archivedDocs = (documents || []).filter((d) => d.status === 'archived')

  return (
    <div className="space-y-6">
      {/* Quick generate */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Generate Document
            </CardTitle>
            <UploadDocumentDialog
              participantId={participant.id}
              trigger={
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Upload
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Auto-generate a document from {participant.first_name}'s data. Documents are filled with their details, stored, and opened for preview.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {QUICK_GENERATE.map((item) => (
              <Button
                key={item.key}
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-auto py-2.5"
                disabled={generating !== null}
                onClick={() => handleGenerate(item.key)}
              >
                {generating === item.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <item.icon className="h-4 w-4 shrink-0" />
                )}
                <span className="text-xs">{item.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Stored Documents
            {activeDocs.length > 0 && (
              <span className="text-muted-foreground font-normal ml-2">({activeDocs.length})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !activeDocs.length ? (
            <EmptyState
              icon={FolderOpen}
              title="No documents yet"
              description="Generate documents using the buttons above, upload files, or they will be created automatically during onboarding."
            />
          ) : (
            <div className="space-y-2">
              {activeDocs.map((doc) => {
                const categoryColor = CATEGORY_COLORS[doc.category] || 'bg-gray-100 text-gray-800'
                const statusColor = STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-800'
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => { setSelectedDoc(doc); setDetailOpen(true) }}
                  >
                    <div className="h-9 w-9 rounded bg-violet-50 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        {doc.version > 1 && (
                          <Badge variant="outline" className="text-[10px] gap-0.5 shrink-0">
                            <History className="h-2.5 w-2.5" />
                            v{doc.version}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="secondary" className={`text-[10px] ${categoryColor}`}>
                          {doc.category.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="secondary" className={`text-[10px] ${statusColor}`}>
                          {STATUS_LABELS[doc.status] || doc.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreview(doc)} title="Preview">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)} title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedDoc(doc); setDetailOpen(true) }}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details & Versions
                          </DropdownMenuItem>
                          {doc.status !== 'archived' && (
                            <DropdownMenuItem className="text-destructive" onClick={() => handleArchive(doc)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archived documents (collapsed) */}
      {archivedDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archived ({archivedDocs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {archivedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-dashed p-3 opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={() => { setSelectedDoc(doc); setDetailOpen(true) }}
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{doc.name}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</span>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc)}>
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail sheet */}
      <DocumentDetailSheet
        document={selectedDoc}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
