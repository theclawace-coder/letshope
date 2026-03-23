import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { RISK_ASSESSMENT_SECTIONS } from '../../constants'
import { AlertTriangle, Phone, Languages } from 'lucide-react'
import type { Stage5Data as Stage7Data } from '../../schemas'

interface Stage7Props {
  defaultValues?: Partial<Stage7Data>
  onSubmit: (data: Stage7Data) => void
  onBack: () => void
  isLoading: boolean
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

export function Stage7RiskAssessment({ defaultValues, onSubmit, onBack, isLoading }: Stage7Props) {
  const [riskAnswers, setRiskAnswers] = useState<Record<string, string>>(
    defaultValues?.risk_answers || {}
  )
  const [interpreterLanguage, setInterpreterLanguage] = useState(
    defaultValues?.interpreter_language || ''
  )
  const [notes, setNotes] = useState(defaultValues?.notes || '')

  const riskLevel = useMemo(() => calculateRiskLevel(riskAnswers), [riskAnswers])

  const selfHarmCurrent = riskAnswers['self_harm'] === 'Current - flag immediately'
  const interpreterNeeded = riskAnswers['interpreter'] === 'Yes'

  function setAnswer(questionId: string, value: string) {
    setRiskAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function handleSubmit() {
    const data: Stage7Data = {
      risk_answers: riskAnswers,
      risk_level: riskLevel,
      interpreter_language: interpreterLanguage || undefined,
      notes: notes || undefined,
    }
    onSubmit(data)
  }

  const riskBadgeVariant = riskLevel === 'high' ? 'destructive' : riskLevel === 'medium' ? 'secondary' : 'default'
  const riskBadgeClass = riskLevel === 'low' ? 'bg-green-600' : riskLevel === 'medium' ? 'bg-orange-500 text-white' : ''

  return (
    <div className="space-y-6">
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
            Complete this assessment during the first visit in the participant's home/environment.
            The risk level is calculated automatically based on your answers.
          </p>
        </CardContent>
      </Card>

      {selfHarmCurrent && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-semibold">IMMEDIATE ACTION REQUIRED - Self-harm risk identified</p>
            <p>
              If the participant is in immediate danger, call{' '}
              <span className="font-bold">000</span>.
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Lifeline 24/7 Crisis Support:{' '}
              <span className="font-bold text-lg">13 11 14</span>
            </p>
            <p className="text-sm">
              Document the situation and notify your supervisor immediately.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {interpreterNeeded && (
        <Alert>
          <Languages className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-medium">Interpreter Required</p>
            <p className="text-sm">
              Note: Haleh is available as a Farsi interpreter. Contact the office to arrange interpreter services for future visits.
            </p>
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
                <RadioGroup
                  value={riskAnswers[question.id] || ''}
                  onValueChange={(v) => setAnswer(question.id, v)}
                >
                  <div className="flex flex-wrap gap-3">
                    {question.options.map((option) => {
                      const isHighRisk = ['High', 'Significant', 'Severe', 'Current - flag immediately', 'Significant risks', 'Potentially aggressive', 'Severe - refer to RN', 'Active wounds - refer to RN', 'Significant support', 'Active'].includes(option)
                      const isMediumRisk = ['Medium', 'Minor', 'Modifications needed', 'Monitor', 'Modified texture diet', 'History - managed', 'History', 'Limited', 'Easy Read materials'].includes(option)
                      return (
                        <div key={option} className="flex items-center gap-2">
                          <RadioGroupItem value={option} id={`${question.id}_${option}`} />
                          <Label
                            htmlFor={`${question.id}_${option}`}
                            className={`font-normal text-sm cursor-pointer ${
                              isHighRisk ? 'text-red-600' : isMediumRisk ? 'text-orange-600' : ''
                            }`}
                          >
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
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional observations or risk notes..."
            rows={4}
          />
        </CardContent>
      </Card>

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
