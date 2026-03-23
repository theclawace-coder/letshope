import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useIncident, useUpdateIncident } from '../hooks/useIncidents'
import { IncidentResolutionDialog } from '../components/IncidentResolutionDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, Search, ShieldCheck, FileDown, Loader2 } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { generateIncidentReport } from '@/lib/pdf/generate-document'
import { toast } from 'sonner'

export function IncidentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: incident, isLoading } = useIncident(id)
  const updateIncident = useUpdateIncident()
  const [resolveOpen, setResolveOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExportPdf = async () => {
    if (!incident) return
    setExporting(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inc = incident as any
      await generateIncidentReport(incident, inc.participant_name, inc.worker_name, { download: true, preview: true, store: false })
      toast.success('Incident report exported')
    } catch {
      toast.error('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) return <LoadingState />
  if (!incident) return <div>Incident not found</div>

  const isActionable = incident.status === 'open' || incident.status === 'investigating'

  const handleMarkInvestigating = async () => {
    try {
      await updateIncident.mutateAsync({ id: incident.id, status: 'investigating' })
      toast.success('Incident marked as investigating')
    } catch {
      toast.error('Failed to update incident')
    }
  }

  const handleMarkReported = async () => {
    try {
      await updateIncident.mutateAsync({ id: incident.id, reported_to_commission: true })
      toast.success('Marked as reported to NDIS Commission')
    } catch {
      toast.error('Failed to update')
    }
  }

  const correctiveActions = (incident.corrective_actions ?? []) as Array<{ action: string; completed: boolean }>

  return (
    <div>
      <PageHeader
        title={`Incident #${incident.id.slice(0, 8)}`}
        description={`${(incident.incident_type ?? 'other').replace(/_/g, ' ')} - ${formatDate(incident.incident_date)}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/incidents')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={handleExportPdf} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              Export PDF
            </Button>
            {incident.status === 'open' && (
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
            <CardTitle className="text-base">Incident Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={incident.severity ?? 'minor'} />
              <StatusBadge status={incident.status} />
              <Badge variant="outline" className="capitalize">
                {(incident.incident_type ?? 'other').replace(/_/g, ' ')}
              </Badge>
              {incident.is_reportable && (
                <Badge variant={incident.reported_to_commission ? 'outline' : 'destructive'}>
                  {incident.reported_to_commission ? 'Reported to Commission' : 'REPORTABLE - Pending'}
                </Badge>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participant</span>
                <span className="font-medium">{incident.participant_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Worker Involved</span>
                <span className="font-medium">{incident.worker_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{formatDate(incident.incident_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{incident.incident_time || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{incident.location || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Logged By</span>
                <span className="font-medium">{incident.logged_by_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Logged At</span>
                <span className="font-medium">{formatDateTime(incident.created_at)}</span>
              </div>
              {incident.report_deadline && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Report Deadline</span>
                  <span className="font-medium">{formatDateTime(incident.report_deadline)}</span>
                </div>
              )}
            </div>

            {incident.is_reportable && !incident.reported_to_commission && (
              <Button variant="outline" size="sm" onClick={handleMarkReported}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Mark as Reported to Commission
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{incident.description}</p>
          </CardContent>
        </Card>

        {incident.investigation_notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Investigation Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{incident.investigation_notes}</p>
            </CardContent>
          </Card>
        )}

        {correctiveActions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Corrective Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {correctiveActions.map((action: { action: string; completed: boolean }, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${action.completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    {action.action}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <IncidentResolutionDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        incidentId={incident.id}
      />
    </div>
  )
}
