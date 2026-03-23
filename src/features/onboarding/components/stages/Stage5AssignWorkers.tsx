import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ALL_REGISTRATION_GROUPS } from '@/lib/constants'
import { UserCheck, AlertTriangle, ShieldAlert } from 'lucide-react'
import type { Stage5Data } from '../../schemas'

interface Worker {
  id: string
  full_name: string
  qualified_registration_groups: string[]
  ndis_screening_valid: boolean
  police_check_valid: boolean
  code_of_conduct_signed: boolean
  orientation_completed: boolean
}

interface Stage5Props {
  defaultValues?: Partial<Stage5Data>
  servicesRequested: string[]
  onSubmit: (data: Stage5Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage5AssignWorkers({ defaultValues, servicesRequested, onSubmit, onBack, isLoading }: Stage5Props) {
  const [assignments, setAssignments] = useState<Record<string, { worker_id: string; worker_name: string }>>(
    () => {
      const initial: Record<string, { worker_id: string; worker_name: string }> = {}
      if (defaultValues?.assignments) {
        for (const a of defaultValues.assignments) {
          initial[a.registration_group] = { worker_id: a.worker_id, worker_name: a.worker_name }
        }
      }
      return initial
    }
  )

  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('workers')
        .select('id, full_name, qualified_registration_groups, ndis_screening_valid, police_check_valid, code_of_conduct_signed, orientation_completed')
        .eq('status', 'active')
      return (data || []) as Worker[]
    },
  })

  function getWorkersForGroup(groupCode: string) {
    return workers.filter((w) => w.qualified_registration_groups?.includes(groupCode))
  }

  function hasScreeningIssues(worker: Worker) {
    return !worker.ndis_screening_valid || !worker.police_check_valid || !worker.code_of_conduct_signed || !worker.orientation_completed
  }

  function getMissingScreening(worker: Worker) {
    const missing: string[] = []
    if (!worker.ndis_screening_valid) missing.push('NDIS Screening')
    if (!worker.police_check_valid) missing.push('Police Check')
    if (!worker.code_of_conduct_signed) missing.push('Code of Conduct')
    if (!worker.orientation_completed) missing.push('Orientation Module')
    return missing
  }

  function assignWorker(groupCode: string, workerId: string) {
    const worker = workers.find((w) => w.id === workerId)
    if (!worker) return
    setAssignments((prev) => ({
      ...prev,
      [groupCode]: { worker_id: workerId, worker_name: worker.full_name },
    }))
  }

  function handleSubmit() {
    const data: Stage5Data = {
      assignments: Object.entries(assignments).map(([registration_group, { worker_id, worker_name }]) => ({
        worker_id,
        worker_name,
        registration_group,
      })),
    }
    onSubmit(data)
  }

  const allAssigned = servicesRequested.every((code) => assignments[code])

  // Group services by category for display
  const groupedByCategory = servicesRequested.reduce<Record<string, string[]>>((acc, code) => {
    const prefix = code.substring(0, 2)
    if (!acc[prefix]) acc[prefix] = []
    acc[prefix].push(code)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Worker Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Assign a qualified worker to each service the participant requires. Only workers with the relevant registration group qualifications are shown.
          </p>

          {workersLoading ? (
            <p className="text-sm text-muted-foreground">Loading workers...</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByCategory).map(([prefix, codes]) => (
                <div key={prefix} className="space-y-3">
                  {codes.map((groupCode) => {
                    const availableWorkers = getWorkersForGroup(groupCode)
                    const groupName = ALL_REGISTRATION_GROUPS[groupCode as keyof typeof ALL_REGISTRATION_GROUPS] || groupCode
                    const currentAssignment = assignments[groupCode]

                    return (
                      <Card key={groupCode} className={currentAssignment ? 'border-green-200' : 'border-border'}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">{groupCode}</Badge>
                              <span className="text-sm font-medium">{groupName}</span>
                            </div>
                            {currentAssignment && (
                              <Badge variant="default" className="bg-green-600">
                                <UserCheck className="h-3 w-3 mr-1" /> Assigned
                              </Badge>
                            )}
                          </div>

                          {availableWorkers.length === 0 ? (
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                No qualified workers available for this service. You may need to hire or upskill a worker.
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Select
                              value={currentAssignment?.worker_id || ''}
                              onValueChange={(v) => v && assignWorker(groupCode, v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a worker..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableWorkers.map((worker) => {
                                  const blocked = hasScreeningIssues(worker)
                                  const missing = getMissingScreening(worker)
                                  return (
                                    <SelectItem
                                      key={worker.id}
                                      value={worker.id}
                                      disabled={blocked}
                                    >
                                      <div className="flex items-center gap-2">
                                        {blocked && <ShieldAlert className="h-3 w-3 text-destructive shrink-0" />}
                                        <span>{worker.full_name}</span>
                                        {blocked && (
                                          <span className="text-xs text-destructive">
                                            (Missing: {missing.join(', ')})
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!allAssigned && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Not all services have a worker assigned. You can still save and assign workers later.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
}
