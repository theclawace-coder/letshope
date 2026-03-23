import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useConcern } from '../hooks/useConcerns'
import { ConcernResolutionDialog } from '../components/ConcernResolutionDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { useAuth } from '@/providers/AuthProvider'

export function ConcernDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: concern, isLoading } = useConcern(id)
  const { user } = useAuth()
  const [resolveOpen, setResolveOpen] = useState(false)

  if (isLoading) return <LoadingState />
  if (!concern) return <div>Concern not found</div>

  const isActionable = concern.status === 'open' || concern.status === 'reviewing'

  return (
    <div>
      <PageHeader
        title={concern.title}
        description={`Concern #${concern.id.slice(0, 8)}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/concerns')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {isActionable && user?.id && (
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
            <CardTitle className="text-base">Concern Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={concern.severity} />
              <StatusBadge status={concern.status} />
              <Badge variant="outline" className="capitalize">{concern.concern_type}</Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participant</span>
                <span className="font-medium">{concern.participant_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raised By</span>
                <span className="font-medium">{concern.raised_by_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date Raised</span>
                <span className="font-medium">{formatDateTime(concern.created_at)}</span>
              </div>
              {concern.progress_note_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linked Progress Note</span>
                  <span className="font-medium">Yes</span>
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
            <p className="text-sm whitespace-pre-wrap">{concern.description}</p>
          </CardContent>
        </Card>

        {concern.actions_requested && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions Requested</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{concern.actions_requested}</p>
            </CardContent>
          </Card>
        )}

        {concern.resolution_notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={concern.status} />
                <span className="text-sm text-muted-foreground">
                  {formatDate(concern.resolved_at)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{concern.resolution_notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {user?.id && (
        <ConcernResolutionDialog
          open={resolveOpen}
          onOpenChange={setResolveOpen}
          concernId={concern.id}
          userId={user.id}
        />
      )}
    </div>
  )
}
