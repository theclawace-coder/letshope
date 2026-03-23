import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useComplaint, useUpdateComplaint } from '../hooks/useComplaints'
import { ComplaintResolutionDialog } from '../components/ComplaintResolutionDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, ThumbsUp, Search, FileDown, Loader2 } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { generateComplaintForm } from '@/lib/pdf/generate-document'
import { toast } from 'sonner'

export function ComplaintDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: complaint, isLoading } = useComplaint(id)
  const updateComplaint = useUpdateComplaint()
  const [resolveOpen, setResolveOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExportPdf = async () => {
    if (!complaint) return
    setExporting(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const comp = complaint as any
      await generateComplaintForm(complaint, comp.participant_name, { download: true, preview: true, store: false })
      toast.success('Complaint form exported')
    } catch {
      toast.error('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) return <LoadingState />
  if (!complaint) return <div>Complaint not found</div>

  const isActionable = complaint.status !== 'resolved' && complaint.status !== 'closed'

  const handleAcknowledge = async () => {
    try {
      await updateComplaint.mutateAsync({
        id: complaint.id,
        acknowledged: true,
        acknowledged_date: new Date().toISOString().split('T')[0],
        status: 'acknowledged',
      })
      toast.success('Complaint acknowledged')
    } catch {
      toast.error('Failed to acknowledge complaint')
    }
  }

  const handleMarkInvestigating = async () => {
    try {
      await updateComplaint.mutateAsync({ id: complaint.id, status: 'investigating' })
      toast.success('Complaint marked as investigating')
    } catch {
      toast.error('Failed to update complaint')
    }
  }

  const ackOverdue = !complaint.acknowledged && complaint.acknowledge_deadline && new Date(complaint.acknowledge_deadline) < new Date()
  const resOverdue = complaint.status !== 'resolved' && complaint.status !== 'closed' && complaint.resolution_deadline && new Date(complaint.resolution_deadline) < new Date()

  return (
    <div>
      <PageHeader
        title={`Complaint #${complaint.id.slice(0, 8)}`}
        description={`${(complaint.category ?? 'other').replace(/_/g, ' ')} - ${formatDate(complaint.complaint_date)}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/complaints')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={handleExportPdf} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              Export PDF
            </Button>
            {!complaint.acknowledged && isActionable && (
              <Button variant="outline" onClick={handleAcknowledge}>
                <ThumbsUp className="h-4 w-4 mr-2" />
                Acknowledge
              </Button>
            )}
            {complaint.acknowledged && complaint.status !== 'investigating' && isActionable && (
              <Button variant="outline" onClick={handleMarkInvestigating}>
                <Search className="h-4 w-4 mr-2" />
                Investigate
              </Button>
            )}
            {isActionable && (
              <Button onClick={() => setResolveOpen(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Complaint Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={complaint.status} />
              <Badge variant="outline" className="capitalize">
                {(complaint.category ?? 'other').replace(/_/g, ' ')}
              </Badge>
              {complaint.acknowledged && (
                <Badge variant="outline" className="bg-green-50 text-green-700">Acknowledged</Badge>
              )}
              {ackOverdue && (
                <Badge variant="destructive">Acknowledgment Overdue</Badge>
              )}
              {resOverdue && (
                <Badge variant="destructive">Resolution Overdue</Badge>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participant</span>
                <span className="font-medium">{complaint.participant_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Complainant</span>
                <span className="font-medium">{complaint.complainant_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Relationship</span>
                <span className="font-medium">{complaint.complainant_relationship || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date Received</span>
                <span className="font-medium">{formatDate(complaint.complaint_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Logged By</span>
                <span className="font-medium">{complaint.logged_by_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Logged At</span>
                <span className="font-medium">{formatDateTime(complaint.created_at)}</span>
              </div>
              {complaint.acknowledge_deadline && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Acknowledge By</span>
                  <span className={`font-medium ${ackOverdue ? 'text-red-600' : ''}`}>
                    {formatDate(complaint.acknowledge_deadline)}
                  </span>
                </div>
              )}
              {complaint.acknowledged_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Acknowledged On</span>
                  <span className="font-medium">{formatDate(complaint.acknowledged_date)}</span>
                </div>
              )}
              {complaint.resolution_deadline && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolution Due</span>
                  <span className={`font-medium ${resOverdue ? 'text-red-600' : ''}`}>
                    {formatDate(complaint.resolution_deadline)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{complaint.description}</p>
          </CardContent>
        </Card>

        {complaint.resolution && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={complaint.status} />
                {complaint.resolution_date && (
                  <span className="text-sm text-muted-foreground">
                    {formatDate(complaint.resolution_date)}
                  </span>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{complaint.resolution}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <ComplaintResolutionDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        complaintId={complaint.id}
      />
    </div>
  )
}
