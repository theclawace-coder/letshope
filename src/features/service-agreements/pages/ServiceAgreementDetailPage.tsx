import { useParams, useNavigate } from 'react-router-dom'
import { useServiceAgreement, useUpdateServiceAgreement } from '../hooks/useServiceAgreements'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Link2, User, Calendar, FileText } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { ALL_REGISTRATION_GROUPS, SERVICE_AGREEMENT_STATUSES } from '@/lib/constants'

export function ServiceAgreementDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: agreement, isLoading } = useServiceAgreement(id)
  const updateAgreement = useUpdateServiceAgreement()

  if (isLoading) return <LoadingState />
  if (!agreement) return <div>Agreement not found</div>

  const participant = agreement.participants as { first_name: string; last_name: string; ndis_number: string | null; funding_type: string | null; phone: string | null; email: string | null } | null
  const plan = agreement.ndis_plans as { id: string; plan_number: string | null; start_date: string; end_date: string; funding_type: string | null; budget_core: number; budget_capacity_building: number; budget_capital: number; status: string } | null
  const services = (agreement.services || []) as Array<{ code: string; name?: string; hours?: number; rate?: number }>

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return
    await updateAgreement.mutateAsync({ id: agreement.id, status: newStatus })
  }

  const totalBudget = plan ? plan.budget_core + plan.budget_capacity_building + plan.budget_capital : null
  const estimatedCost = services.reduce((sum, s) => sum + (s.hours || 0) * (s.rate || 0), 0)

  return (
    <div>
      <PageHeader
        title={`Service Agreement v${agreement.version}`}
        description={participant ? `${participant.first_name} ${participant.last_name}` : undefined}
        action={
          <div className="flex gap-2 items-center">
            <Select value={agreement.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_AGREEMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => navigate('/service-agreements')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column – Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Participant info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Participant
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participant ? (
                <div className="grid gap-3 md:grid-cols-2 text-sm">
                  <InfoRow label="Name" value={`${participant.first_name} ${participant.last_name}`} />
                  <InfoRow label="NDIS Number" value={participant.ndis_number} />
                  <InfoRow label="Funding Type" value={participant.funding_type?.replace(/_/g, ' ')} />
                  <InfoRow label="Phone" value={participant.phone} />
                  <InfoRow label="Email" value={participant.email} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Participant details unavailable</p>
              )}
            </CardContent>
          </Card>

          {/* Linked Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Linked NDIS Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plan ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <InfoRow label="Plan Number" value={plan.plan_number} />
                    <InfoRow label="Status" value={plan.status} />
                    <InfoRow label="Period" value={`${formatDate(plan.start_date)} – ${formatDate(plan.end_date)}`} />
                    <InfoRow label="Funding Type" value={plan.funding_type?.replace(/_/g, ' ')} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-3 pt-3 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Core</p>
                      <p className="text-lg font-bold">{formatCurrency(plan.budget_core)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Capacity Building</p>
                      <p className="text-lg font-bold">{formatCurrency(plan.budget_capacity_building)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Capital</p>
                      <p className="text-lg font-bold">{formatCurrency(plan.budget_capital)}</p>
                    </div>
                  </div>
                  {totalBudget !== null && estimatedCost > 0 && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Total Plan Budget</span>
                        <span className="font-medium">{formatCurrency(totalBudget)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span>This Agreement Est.</span>
                        <span className="font-medium">{formatCurrency(estimatedCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1 pt-1 border-t">
                        <span>Utilisation</span>
                        <span className="font-medium">
                          {totalBudget > 0 ? Math.round((estimatedCost / totalBudget) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">Unlinked</Badge>
                  <span>This agreement is not linked to an NDIS plan</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Services</CardTitle>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services specified</p>
              ) : (
                <div className="space-y-2">
                  {services.map((svc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">{svc.code}</Badge>
                          <span className="text-sm font-medium">{svc.name || ALL_REGISTRATION_GROUPS[svc.code] || svc.code}</span>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {svc.hours ? (
                          <>
                            <span className="text-muted-foreground">{svc.hours}h × {formatCurrency(svc.rate || 0)}</span>
                            <span className="ml-3 font-medium">{formatCurrency((svc.hours || 0) * (svc.rate || 0))}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">No hours specified</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {estimatedCost > 0 && (
                    <div className="flex justify-end pt-2 border-t mt-3">
                      <span className="text-sm font-medium">Total: {formatCurrency(estimatedCost)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column – Meta */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Agreement Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Status" value={agreement.status} />
              <InfoRow label="Version" value={`v${agreement.version}`} />
              <InfoRow label="Start Date" value={formatDate(agreement.start_date)} />
              <InfoRow label="End Date" value={formatDate(agreement.end_date)} />
              <InfoRow label="Created" value={formatDate(agreement.created_at)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signatures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Participant</span>
                {agreement.participant_signed ? (
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800">Signed</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(agreement.participant_signed_date)}</p>
                  </div>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Provider</span>
                {agreement.provider_signed ? (
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800">Signed</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(agreement.provider_signed_date)}</p>
                  </div>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {agreement.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{agreement.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value || '-'}</span>
    </div>
  )
}
