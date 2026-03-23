import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useParticipants } from '@/features/participants/hooks/useParticipants'
import { useNdisPlans } from '../hooks/useNdisPlans'
import { useCreateServiceAgreement } from '../hooks/useServiceAgreements'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, Link2, AlertCircle } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { FUNDING_TYPES } from '@/lib/constants'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'

interface ServiceLine {
  code: string
  name: string
  hours: number
  rate: number
}

export function CreateServiceAgreementPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedParticipantId = searchParams.get('participantId') || ''
  const preselectedPlanId = searchParams.get('planId') || ''

  const { data: participants, isLoading: loadingParticipants } = useParticipants()
  const createAgreement = useCreateServiceAgreement()

  const [participantId, setParticipantId] = useState(preselectedParticipantId)
  const [planId, setPlanId] = useState(preselectedPlanId)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [services, setServices] = useState<ServiceLine[]>([
    { code: '', name: '', hours: 0, rate: 0 },
  ])

  const { data: plans, isLoading: loadingPlans } = useNdisPlans(participantId || undefined)
  const selectedPlan = plans?.find((p) => p.id === planId)

  // Auto-fill dates from plan when selected
  useEffect(() => {
    if (selectedPlan) {
      if (!startDate) setStartDate(selectedPlan.start_date)
      if (!endDate) setEndDate(selectedPlan.end_date)
    }
  }, [selectedPlan, startDate, endDate])

  const addServiceLine = () => {
    setServices([...services, { code: '', name: '', hours: 0, rate: 0 }])
  }

  const removeServiceLine = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const updateServiceLine = (index: number, field: keyof ServiceLine, value: string | number) => {
    const updated = [...services]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'code' && typeof value === 'string') {
      updated[index].name = ALL_REGISTRATION_GROUPS[value] || ''
    }
    setServices(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!participantId) return

    const validServices = services.filter((s) => s.code || s.name)

    try {
      const result = await createAgreement.mutateAsync({
        participant_id: participantId,
        plan_id: planId || null,
        services: validServices,
        start_date: startDate || null,
        end_date: endDate || null,
        notes: notes || null,
      })
      navigate(`/service-agreements/${result.id}`)
    } catch {
      // error handled by react-query
    }
  }

  if (loadingParticipants) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="New Service Agreement"
        description="Create a service agreement and link it to an NDIS plan"
        action={
          <Button variant="outline" onClick={() => navigate('/service-agreements')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Participant Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participant</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={participantId} onValueChange={(v) => { setParticipantId(v); setPlanId('') }}>
              <SelectTrigger>
                <SelectValue placeholder="Select participant..." />
              </SelectTrigger>
              <SelectContent>
                {participants?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} {p.ndis_number ? `(${p.ndis_number})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Plan Linkage */}
        {participantId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Link to NDIS Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingPlans ? (
                <p className="text-sm text-muted-foreground">Loading plans...</p>
              ) : !plans?.length ? (
                <div className="flex items-start gap-2 p-3 border rounded-lg bg-muted/50">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">No NDIS plans found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You can still create the agreement without a plan link, or add a plan from the participant's profile first.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Select value={planId} onValueChange={setPlanId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select NDIS plan (optional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No plan link</SelectItem>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.plan_number || 'Plan'} — {formatDate(p.start_date)} to {formatDate(p.end_date)}
                          {' '}({p.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedPlan && (
                    <div className="grid gap-3 md:grid-cols-4 p-3 border rounded-lg bg-muted/30">
                      <div>
                        <p className="text-xs text-muted-foreground">Funding Type</p>
                        <p className="text-sm font-medium capitalize">{selectedPlan.funding_type?.replace(/_/g, ' ') || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Core</p>
                        <p className="text-sm font-medium">{formatCurrency(selectedPlan.budget_core)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Capacity Building</p>
                        <p className="text-sm font-medium">{formatCurrency(selectedPlan.budget_capacity_building)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Capital</p>
                        <p className="text-sm font-medium">{formatCurrency(selectedPlan.budget_capital)}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Agreement Period */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agreement Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Services</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addServiceLine}>
              <Plus className="h-4 w-4 mr-1" />
              Add Service
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {services.map((svc, i) => (
              <div key={i} className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Registration Group</Label>
                  <Select value={svc.code} onValueChange={(v) => updateServiceLine(i, 'code', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ALL_REGISTRATION_GROUPS).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {code} – {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Hours</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={svc.hours || ''}
                    onChange={(e) => updateServiceLine(i, 'hours', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs">Rate ($/hr)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={svc.rate || ''}
                    onChange={(e) => updateServiceLine(i, 'rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                {services.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeServiceLine(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            {services.some((s) => s.hours > 0 && s.rate > 0) && (
              <div className="flex justify-end pt-2 border-t">
                <Badge variant="outline" className="text-sm">
                  Est. total: {formatCurrency(services.reduce((sum, s) => sum + s.hours * s.rate, 0))}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Additional notes about the agreement..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/service-agreements')}>
            Cancel
          </Button>
          <Button type="submit" disabled={!participantId || createAgreement.isPending}>
            {createAgreement.isPending ? 'Creating...' : 'Create Agreement'}
          </Button>
        </div>
      </form>
    </div>
  )
}
