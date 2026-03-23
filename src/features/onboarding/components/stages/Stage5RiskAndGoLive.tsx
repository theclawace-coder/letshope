import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { RISK_ASSESSMENT_SECTIONS } from '../../constants'
import { AlertTriangle, Phone, Languages, CheckCircle, Rocket } from 'lucide-react'
import type { Stage1Data, Stage2Data, Stage3Data, Stage4Data, Stage5Data } from '../../schemas'

interface StageData {
  stage1?: Stage1Data
  stage2?: Stage2Data
  stage3?: Stage3Data
  stage4?: Stage4Data
}

interface Stage5Props {
  defaultValues?: Partial<Stage5Data>
  stageData: StageData
  onSubmit: (data: Stage5Data) => void
  onBack: () => void
  isLoading: boolean
}

interface CheckItem {
  label: string
  passed: boolean
  detail?: string
}

function calculateRiskLevel(answers: Record<string, string>): 'low' | 'medium' | 'high' {
  const highIndicators = ['High', 'Significant', 'Severe', 'Active', 'Current - flag immediately', 'Significant risks', 'Potentially aggressive', 'Severe - refer to RN', 'Active wounds - refer to RN', 'Significant support']
  const mediumIndicators = ['Medium', 'Minor', 'Modifications needed', 'Monitor', 'Modified texture diet', 'History - managed', 'History', 'Limited', 'Easy Read materials']

  let hasHigh = false
  let hasMedium = false

  for (const answer of Object.values(answers)) {
    if (highIndicators.some((ind) => answer === ind)) hasHigh = true
    if (mediumIndicators.some((ind) => answer === ind)) hasMedium = true
  }

  if (hasHigh) return 'high'
  if (hasMedium) return 'medium'
  return 'low'
}

export function Stage5RiskAndGoLive({ defaultValues, stageData, onSubmit, onBack, isLoading }: Stage5Props) {
  const [riskAnswers, setRiskAnswers] = useState<Record<string, string>>(defaultValues?.risk_answers || {})
  const [interpreterLanguage, setInterpreterLanguage] = useState(defaultValues?.interpreter_language || '')
  const [notes, setNotes] = useState(defaultValues?.notes || '')

  const riskLevel = useMemo(() => calculateRiskLevel(riskAnswers), [riskAnswers])
  const totalQuestions = Object.values(RISK_ASSESSMENT_SECTIONS).reduce((sum, s) => sum + s.questions.length, 0)
  const riskComplete = Object.keys(riskAnswers).length >= Math.ceil(totalQuestions * 0.7) // At least 70% answered

  const selfHarmCurrent = riskAnswers['self_harm'] === 'Current - flag immediately'
  const interpreterNeeded = riskAnswers['interpreter'] === 'Yes'

  function setAnswer(questionId: string, value: string) {
    setRiskAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  // ── Go-Live checks ──
  const checks = useMemo<CheckItem[]>(() => {
    const { stage2, stage3, stage4 } = stageData
    return [
      {
        label: 'Intake completed',
        passed: !!(stage2?.date_of_birth && stage2?.plan_start_date && stage2?.plan_end_date && stage2?.emergency_contacts?.length),
        detail: stage2 ? 'All required fields captured' : 'Stage 2 not completed',
      },
      {
        label: 'Service Agreement signed',
        passed: !!(stage3?.service_agreement_signed),
        detail: stage3?.service_agreement_signed ? 'Signed' : 'Not yet signed',
      },
      {
        label: 'Consent Form signed',
        passed: !!(stage3?.consent_form_signed),
        detail: stage3?.consent_form_signed ? 'Signed' : 'Not yet signed',
      },
      {
        label: 'Welcome Pack provided',
        passed: !!(stage3?.documents_generated?.includes('welcome_pack')),
        detail: stage3?.documents_generated?.includes('welcome_pack') ? 'Generated and provided' : 'Not yet generated',
      },
      {
        label: 'Risk Assessment completed',
        passed: riskComplete,
        detail: riskComplete ? `Risk level: ${riskLevel.toUpperCase()}` : 'Complete the risk assessment above',
      },
      {
        label: 'Support plan / goals documented',
        passed: !!(stage2?.goals?.length && stage2.goals.length > 0),
        detail: stage2?.goals?.length ? `${stage2.goals.length} goal(s) documented` : 'No goals entered',
      },
      {
        label: 'Workers assigned',
        passed: !!(stage4?.assignments?.length && stage4.assignments.length > 0),
        detail: stage4?.assignments?.length ? `${stage4.assignments.length} worker(s) assigned` : 'No workers assigned',
      },
      {
        label: 'First booking scheduled',
        passed: !!(stage4?.bookings?.length && stage4.bookings.some((b) => b.booking_date)),
        detail: stage4?.bookings?.some((b) => b.booking_date)
          ? `${stage4.bookings.filter((b) => b.booking_date).length} booking(s) scheduled`
          : 'No bookings scheduled',
      },
    ]
  }, [stageData, riskComplete, riskLevel])

  const allPassed = checks.every((c) => c.passed)
  const passedCount = checks.filter((c) => c.passed).length

  function handleActivate() {
    const data: Stage5Data = {
      risk_answers: riskAnswers,
      risk_level: riskLevel,
      interpreter_language: interpreterLanguage || undefined,
      notes: notes || undefined,
      all_checks_passed: allPassed ? true : undefined,
    }
    onSubmit(data)
  }

  const riskBadgeVariant = riskLevel === 'high' ? 'destructive' : riskLevel === 'medium' ? 'secondary' : 'default'
  const riskBadgeClass = riskLevel === 'low' ? 'bg-green-600' : riskLevel === 'medium' ? 'bg-orange-500 text-white' : ''

  return (
    <div className="space-y-6">
      {/* ═══════════ PART A: Risk Assessment ═══════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Risk Assessment</CardTitle>
            <Badge variant={riskBadgeVariant} className={riskBadgeClass}>
              Risk Level: {riskLevel.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete this assessment during the first visit in the participant's home/environment. The risk level is calculated automatically.
          </p>
        </CardContent>
      </Card>

      {selfHarmCurrent && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-semibold">IMMEDIATE ACTION REQUIRED - Self-harm risk identified</p>
            <p>If the participant is in immediate danger, call <span className="font-bold">000</span>.</p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Lifeline 24/7 Crisis Support: <span className="font-bold text-lg">13 11 14</span>
            </p>
            <p className="text-sm">Document the situation and notify your supervisor immediately.</p>
          </AlertDescription>
        </Alert>
      )}

      {interpreterNeeded && (
        <Alert>
          <Languages className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-medium">Interpreter Required</p>
            <p className="text-sm">Note: Haleh is available as a Farsi interpreter. Contact the office to arrange interpreter services.</p>
            <div className="space-y-2 pt-2">
              <Label htmlFor="interpreter_language">Language Required</Label>
              <input
                id="interpreter_language"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={interpreterLanguage}
                onChange={(e) => setInterpreterLanguage(e.target.value)}
                placeholder="e.g., Farsi, Arabic, Mandarin"
              />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {Object.entries(RISK_ASSESSMENT_SECTIONS).map(([sectionKey, section]) => (
        <Card key={sectionKey}>
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {section.questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label className="text-sm">{question.label}</Label>
                <RadioGroup value={riskAnswers[question.id] || ''} onValueChange={(v) => setAnswer(question.id, v)}>
                  <div className="flex flex-wrap gap-3">
                    {question.options.map((option) => {
                      const isHighRisk = ['High', 'Significant', 'Severe', 'Current - flag immediately', 'Significant risks', 'Potentially aggressive', 'Severe - refer to RN', 'Active wounds - refer to RN', 'Significant support', 'Active'].includes(option)
                      const isMediumRisk = ['Medium', 'Minor', 'Modifications needed', 'Monitor', 'Modified texture diet', 'History - managed', 'History', 'Limited', 'Easy Read materials'].includes(option)
                      return (
                        <div key={option} className="flex items-center gap-2">
                          <RadioGroupItem value={option} id={`${question.id}_${option}`} />
                          <Label htmlFor={`${question.id}_${option}`} className={`font-normal text-sm cursor-pointer ${isHighRisk ? 'text-red-600' : isMediumRisk ? 'text-orange-600' : ''}`}>
                            {option}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional observations or risk notes..." rows={4} />
        </CardContent>
      </Card>

      {/* ═══════════ PART B: Activation Checklist ═══════════ */}
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
              <p className={`text-sm font-medium ${check.passed ? 'text-green-800' : 'text-orange-800'}`}>{check.label}</p>
              {check.detail && <p className={`text-xs ${check.passed ? 'text-green-600' : 'text-orange-600'}`}>{check.detail}</p>}
            </div>
          </div>
        ))}
      </div>

      {!allPassed && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Some checks have not passed. Go back to the relevant stage to complete the missing items.</AlertDescription>
        </Alert>
      )}

      {allPassed && (
        <Alert className="border-green-200 bg-green-50/50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Everything looks good! Once activated, the participant's status will change to "Active", workers will see them in their participant list, and budget tracking will begin.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
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
