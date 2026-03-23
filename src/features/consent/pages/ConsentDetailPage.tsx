import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useConsent, useConsentAuditLog } from '../hooks/useConsents'
import { WithdrawConsentDialog } from '../components/WithdrawConsentDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, XCircle, Clock } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/formatters'

export function ConsentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: consent, isLoading } = useConsent(id)
  const { data: auditLog } = useConsentAuditLog(id)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  if (isLoading) return <LoadingState />
  if (!consent) return <div>Consent record not found</div>

  const isActive = consent.consent_status === 'active'

  return (
    <div>
      <PageHeader
        title={consent.title}
        description={`${(consent.consent_type ?? '').replace(/_/g, ' ')} - ${consent.participant_name}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/consent')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {isActive && (
              <Button variant="destructive" onClick={() => setWithdrawOpen(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Withdraw Consent
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consent Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={consent.consent_status} />
              <Badge variant="outline" className="capitalize">
                {(consent.consent_type ?? '').replace(/_/g, ' ')}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {(consent.consent_method ?? '').replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participant</span>
                <span className="font-medium">{consent.participant_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Given By</span>
                <span className="font-medium">{consent.given_by_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Relationship</span>
                <span className="font-medium">{consent.given_by_relationship || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Given Date</span>
                <span className="font-medium">{formatDate(consent.given_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiry Date</span>
                <span className="font-medium">{consent.expiry_date ? formatDate(consent.expiry_date) : 'No expiry'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Review Date</span>
                <span className="font-medium">{consent.review_date ? formatDate(consent.review_date) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Witnessed By</span>
                <span className="font-medium">{consent.witnessed_by_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recorded By</span>
                <span className="font-medium">{consent.recorded_by_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDateTime(consent.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{consent.scope}</p>
          </CardContent>
        </Card>

        {consent.conditions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conditions / Limitations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{consent.conditions}</p>
            </CardContent>
          </Card>
        )}

        {consent.consent_status === 'withdrawn' && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-base text-red-800">Withdrawal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Withdrawn By</span>
                <span className="font-medium">{consent.withdrawn_by_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Withdrawn Date</span>
                <span className="font-medium">{consent.withdrawn_date ? formatDate(consent.withdrawn_date) : '-'}</span>
              </div>
              {consent.withdrawn_reason && (
                <div className="mt-2">
                  <span className="text-muted-foreground">Reason:</span>
                  <p className="mt-1 whitespace-pre-wrap">{consent.withdrawn_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {consent.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{consent.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Audit Trail */}
        {auditLog && auditLog.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLog.map((entry) => (
                  <div key={entry.id as string} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 h-2 w-2 rounded-full bg-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{(entry.action as string).replace(/_/g, ' ')}</span>
                        {entry.old_status && entry.new_status && (
                          <span className="text-muted-foreground">
                            {(entry.old_status as string).replace(/_/g, ' ')} &rarr; {(entry.new_status as string).replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        {entry.changed_by_name as string || 'System'} - {formatDateTime(entry.created_at as string)}
                      </p>
                      {entry.change_reason && (
                        <p className="text-muted-foreground mt-1">{entry.change_reason as string}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <WithdrawConsentDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        consentId={consent.id}
      />
    </div>
  )
}
