import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, Rocket } from 'lucide-react'
import type { Stage1Data, Stage2Data, Stage3Data, Stage4Data, Stage5Data, Stage6Data, Stage7Data, Stage8Data } from '../../schemas'

interface StageData {
  stage1?: Stage1Data
  stage2?: Stage2Data
  stage3?: Stage3Data
  stage4?: Stage4Data
  stage5?: Stage5Data
  stage6?: Stage6Data
  stage7?: Stage7Data
}

interface Stage8Props {
  stageData: StageData
  onActivate: (data: Stage8Data) => void
  onBack: () => void
  isLoading: boolean
}

interface CheckItem {
  label: string
  passed: boolean
  detail?: string
}

export function Stage8GoLive({ stageData, onActivate, onBack, isLoading }: Stage8Props) {
  const checks = useMemo<CheckItem[]>(() => {
    const { stage3, stage4, stage5, stage6, stage7 } = stageData

    return [
      {
        label: 'Intake completed',
        passed: !!(stage3?.date_of_birth && stage3?.plan_start_date && stage3?.plan_end_date && stage3?.emergency_contacts?.length),
        detail: stage3 ? 'All required fields captured' : 'Stage 3 not completed',
      },
      {
        label: 'Service Agreement signed',
        passed: !!(stage4?.service_agreement_signed),
        detail: stage4?.service_agreement_signed ? 'Signed' : 'Not yet signed',
      },
      {
        label: 'Consent Form signed',
        passed: !!(stage4?.consent_form_signed),
        detail: stage4?.consent_form_signed ? 'Signed' : 'Not yet signed',
      },
      {
        label: 'Welcome Pack provided',
        passed: !!(stage4?.documents_generated?.includes('welcome_pack')),
        detail: stage4?.documents_generated?.includes('welcome_pack') ? 'Generated and provided' : 'Not yet generated',
      },
      {
        label: 'Risk Assessment completed',
        passed: !!(stage7?.risk_level),
        detail: stage7 ? `Risk level: ${stage7.risk_level.toUpperCase()}` : 'Not yet completed',
      },
      {
        label: 'Support plan / goals documented',
        passed: !!(stage3?.goals?.length && stage3.goals.length > 0),
        detail: stage3?.goals?.length ? `${stage3.goals.length} goal(s) documented` : 'No goals entered',
      },
      {
        label: 'Workers assigned',
        passed: !!(stage5?.assignments?.length && stage5.assignments.length > 0),
        detail: stage5?.assignments?.length
          ? `${stage5.assignments.length} worker(s) assigned`
          : 'No workers assigned',
      },
      {
        label: 'First booking scheduled',
        passed: !!(stage6?.bookings?.length && stage6.bookings.length > 0 && stage6.bookings.some((b) => b.booking_date)),
        detail: stage6?.bookings?.some((b) => b.booking_date)
          ? `${stage6.bookings.filter((b) => b.booking_date).length} booking(s) scheduled`
          : 'No bookings scheduled',
      },
    ]
  }, [stageData])

  const allPassed = checks.every((c) => c.passed)
  const passedCount = checks.filter((c) => c.passed).length

  function handleActivate() {
    if (!allPassed) return
    onActivate({ all_checks_passed: true })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Activation Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            {allPassed
              ? 'All checks passed! The participant is ready to be activated.'
              : `${passedCount} of ${checks.length} checks passed. Complete all items before activation.`}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {checks.map((check) => (
          <div
            key={check.label}
            className={`flex items-start gap-3 rounded-lg border p-4 ${
              check.passed ? 'border-green-200 bg-green-50/50' : 'border-orange-200 bg-orange-50/50'
            }`}
          >
            {check.passed ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
            )}
            <div>
              <p className={`text-sm font-medium ${check.passed ? 'text-green-800' : 'text-orange-800'}`}>
                {check.label}
              </p>
              {check.detail && (
                <p className={`text-xs ${check.passed ? 'text-green-600' : 'text-orange-600'}`}>
                  {check.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {!allPassed && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some checks have not passed. Go back to the relevant stage to complete the missing items.
            The participant cannot be activated until all checks are green.
          </AlertDescription>
        </Alert>
      )}

      {allPassed && (
        <Alert className="border-green-200 bg-green-50/50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Everything looks good! Once activated, the participant's status will change to "Active",
            workers will see them in their participant list, and budget tracking will begin.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleActivate}
          disabled={!allPassed || isLoading}
          className={allPassed ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {isLoading ? 'Activating...' : 'Activate Participant'}
        </Button>
      </div>
    </div>
  )
}
