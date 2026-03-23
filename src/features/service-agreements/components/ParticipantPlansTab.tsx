import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNdisPlans, useCreateNdisPlan, useUpdateNdisPlan } from '../hooks/useNdisPlans'
import { useServiceAgreements } from '../hooks/useServiceAgreements'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, FileText, Link2, CalendarRange, DollarSign } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { FUNDING_TYPES } from '@/lib/constants'

interface ParticipantPlansTabProps {
  participantId: string
}

export function ParticipantPlansTab({ participantId }: ParticipantPlansTabProps) {
  const navigate = useNavigate()
  const { data: plans, isLoading: loadingPlans } = useNdisPlans(participantId)
  const { data: agreements, isLoading: loadingAgreements } = useServiceAgreements({ participantId })
  const createPlan = useCreateNdisPlan()

  const [showAddPlan, setShowAddPlan] = useState(false)
  const [newPlan, setNewPlan] = useState({
    plan_number: '',
    funding_type: '' as string,
    start_date: '',
    end_date: '',
    budget_core: '',
    budget_capacity_building: '',
    budget_capital: '',
    support_coordinator_name: '',
    support_coordinator_phone: '',
    support_coordinator_email: '',
  })

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createPlan.mutateAsync({
        participant_id: participantId,
        plan_number: newPlan.plan_number || null,
        funding_type: newPlan.funding_type || null,
        start_date: newPlan.start_date,
        end_date: newPlan.end_date,
        budget_core: parseFloat(newPlan.budget_core) || 0,
        budget_capacity_building: parseFloat(newPlan.budget_capacity_building) || 0,
        budget_capital: parseFloat(newPlan.budget_capital) || 0,
        support_coordinator_name: newPlan.support_coordinator_name || null,
        support_coordinator_phone: newPlan.support_coordinator_phone || null,
        support_coordinator_email: newPlan.support_coordinator_email || null,
      })
      setShowAddPlan(false)
      setNewPlan({
        plan_number: '', funding_type: '', start_date: '', end_date: '',
        budget_core: '', budget_capacity_building: '', budget_capital: '',
        support_coordinator_name: '', support_coordinator_phone: '', support_coordinator_email: '',
      })
    } catch {
      // handled by react-query
    }
  }

  const activePlan = plans?.find((p) => p.status === 'active')

  return (
    <div className="space-y-6">
      {/* NDIS Plans Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">NDIS Plans</h3>
          <Dialog open={showAddPlan} onOpenChange={setShowAddPlan}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add NDIS Plan</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Plan Number</Label>
                    <Input
                      placeholder="e.g. 123456789"
                      value={newPlan.plan_number}
                      onChange={(e) => setNewPlan({ ...newPlan, plan_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Funding Type</Label>
                    <Select value={newPlan.funding_type} onValueChange={(v) => setNewPlan({ ...newPlan, funding_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {FUNDING_TYPES.map((ft) => (
                          <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date *</Label>
                    <Input type="date" required value={newPlan.start_date} onChange={(e) => setNewPlan({ ...newPlan, start_date: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date *</Label>
                    <Input type="date" required value={newPlan.end_date} onChange={(e) => setNewPlan({ ...newPlan, end_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Core Budget ($)</Label>
                    <Input type="number" min="0" step="0.01" value={newPlan.budget_core} onChange={(e) => setNewPlan({ ...newPlan, budget_core: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Capacity Building ($)</Label>
                    <Input type="number" min="0" step="0.01" value={newPlan.budget_capacity_building} onChange={(e) => setNewPlan({ ...newPlan, budget_capacity_building: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Capital ($)</Label>
                    <Input type="number" min="0" step="0.01" value={newPlan.budget_capital} onChange={(e) => setNewPlan({ ...newPlan, budget_capital: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Support Coordinator</Label>
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input placeholder="Name" value={newPlan.support_coordinator_name} onChange={(e) => setNewPlan({ ...newPlan, support_coordinator_name: e.target.value })} />
                    <Input placeholder="Phone" value={newPlan.support_coordinator_phone} onChange={(e) => setNewPlan({ ...newPlan, support_coordinator_phone: e.target.value })} />
                    <Input placeholder="Email" value={newPlan.support_coordinator_email} onChange={(e) => setNewPlan({ ...newPlan, support_coordinator_email: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddPlan(false)}>Cancel</Button>
                  <Button type="submit" disabled={!newPlan.start_date || !newPlan.end_date || createPlan.isPending}>
                    {createPlan.isPending ? 'Saving...' : 'Add Plan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loadingPlans ? (
          <p className="text-sm text-muted-foreground">Loading plans...</p>
        ) : !plans?.length ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CalendarRange className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No NDIS plans recorded</p>
              <p className="text-xs text-muted-foreground mt-1">Add a plan to track budgets and link service agreements</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => {
              const linkedAgreements = agreements?.filter((a) => a.plan_id === plan.id) || []
              const totalBudget = plan.budget_core + plan.budget_capacity_building + plan.budget_capital
              return (
                <Card key={plan.id} className={plan.status === 'active' ? 'border-green-200' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{plan.plan_number || 'NDIS Plan'}</span>
                          <StatusBadge status={plan.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatDate(plan.start_date)} – {formatDate(plan.end_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total Budget</p>
                        <p className="text-lg font-bold">{formatCurrency(totalBudget)}</p>
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3 text-sm mb-3">
                      <div className="flex justify-between p-2 bg-muted/30 rounded">
                        <span className="text-muted-foreground">Core</span>
                        <span className="font-medium">{formatCurrency(plan.budget_core)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/30 rounded">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className="font-medium">{formatCurrency(plan.budget_capacity_building)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/30 rounded">
                        <span className="text-muted-foreground">Capital</span>
                        <span className="font-medium">{formatCurrency(plan.budget_capital)}</span>
                      </div>
                    </div>

                    {plan.funding_type && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Funding: <span className="capitalize">{plan.funding_type.replace(/_/g, ' ')}</span>
                      </p>
                    )}

                    {/* Linked agreements */}
                    {linkedAgreements.length > 0 ? (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs text-muted-foreground mb-1.5">
                          <Link2 className="h-3 w-3 inline mr-1" />
                          {linkedAgreements.length} linked agreement{linkedAgreements.length > 1 ? 's' : ''}
                        </p>
                        <div className="space-y-1">
                          {linkedAgreements.map((sa) => (
                            <div
                              key={sa.id}
                              className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                              onClick={() => navigate(`/service-agreements/${sa.id}`)}
                            >
                              <span>v{sa.version} — {formatDate(sa.start_date)} to {formatDate(sa.end_date)}</span>
                              <StatusBadge status={sa.status} className="text-[10px] h-5" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-t pt-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => navigate(`/service-agreements/new?participantId=${participantId}&planId=${plan.id}`)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create agreement for this plan
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Service Agreements Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Service Agreements</h3>
          <Button
            size="sm"
            onClick={() => navigate(`/service-agreements/new?participantId=${participantId}${activePlan ? `&planId=${activePlan.id}` : ''}`)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Agreement
          </Button>
        </div>

        {loadingAgreements ? (
          <p className="text-sm text-muted-foreground">Loading agreements...</p>
        ) : !agreements?.length ? (
          <EmptyState
            icon={FileText}
            title="No service agreements"
            description="Create a service agreement to formalise supports for this participant."
            action={
              <Button onClick={() => navigate(`/service-agreements/new?participantId=${participantId}`)}>
                <Plus className="h-4 w-4 mr-2" />
                New Agreement
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {agreements.map((sa) => (
              <Card
                key={sa.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/service-agreements/${sa.id}`)}
              >
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Version {sa.version}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(sa.start_date)} – {formatDate(sa.end_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sa.plan_id ? (
                        <Badge variant="outline" className="text-xs">
                          <Link2 className="h-3 w-3 mr-1" />
                          {sa.plan_number || 'Plan linked'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Unlinked</Badge>
                      )}
                      <StatusBadge status={sa.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
