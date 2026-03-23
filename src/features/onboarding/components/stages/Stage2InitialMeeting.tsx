import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { MEETING_CHECKLIST_ITEMS, SERVICE_QUESTIONS } from '../../constants'
import type { MeetingChecklistItem } from '../../constants'
import type { Stage2Data } from '../../schemas'

interface Stage2Props {
  defaultValues?: Partial<Stage2Data>
  servicesRequested: string[]
  onSubmit: (data: Partial<Stage2Data>) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage2InitialMeeting({ defaultValues, servicesRequested, onSubmit, onBack, isLoading }: Stage2Props) {
  // Manual checklist ticks (for "explain" items)
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>(
    defaultValues?.meeting_checklist || {}
  )

  // Form fields that drive auto-ticking
  const [goalsNotes, setGoalsNotes] = useState(defaultValues?.goals_notes || '')
  const [communicationNeeds, setCommunicationNeeds] = useState(defaultValues?.communication_needs || '')
  const [culturalNeeds, setCulturalNeeds] = useState(defaultValues?.cultural_needs || '')
  const [medicalConditions, setMedicalConditions] = useState(defaultValues?.medical_conditions || '')
  const [medications, setMedications] = useState(defaultValues?.medications || '')
  const [mobilityNeeds, setMobilityNeeds] = useState(defaultValues?.mobility_needs || '')
  const [otherProviders, setOtherProviders] = useState(defaultValues?.other_providers || '')

  // Guardian
  const [hasGuardian, setHasGuardian] = useState(defaultValues?.has_guardian || false)
  const [guardianName, setGuardianName] = useState(defaultValues?.guardian_name || '')
  const [guardianRelationship, setGuardianRelationship] = useState(defaultValues?.guardian_relationship || '')
  const [guardianPhone, setGuardianPhone] = useState(defaultValues?.guardian_phone || '')
  const [guardianAuthority, setGuardianAuthority] = useState(defaultValues?.guardian_authority || '')

  // Service-specific Q&A
  const [serviceAnswers, setServiceAnswers] = useState<Record<string, Record<string, string>>>(
    defaultValues?.service_answers || {}
  )

  // Which auto-items are expanded
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Field value getter for auto-tick evaluation
  const fieldValues: Record<string, string> = {
    goals_notes: goalsNotes,
    communication_needs: communicationNeeds,
    cultural_needs: culturalNeeds,
    medical_conditions: medicalConditions,
    medications: medications,
    mobility_needs: mobilityNeeds,
    other_providers: otherProviders,
  }

  // Field setters
  const fieldSetters: Record<string, (v: string) => void> = {
    goals_notes: setGoalsNotes,
    communication_needs: setCommunicationNeeds,
    cultural_needs: culturalNeeds ? setCulturalNeeds : setCulturalNeeds,
    medical_conditions: setMedicalConditions,
    medications: setMedications,
    mobility_needs: setMobilityNeeds,
    other_providers: setOtherProviders,
  }

  // Compute whether each item is "checked"
  function isItemChecked(item: MeetingChecklistItem): boolean {
    if (item.type === 'manual') {
      return !!manualChecks[item.id]
    }
    // Auto items
    if (item.field === 'guardian') {
      // Guardian: checked if toggle is off (N/A) or if toggle is on AND name is filled
      return !hasGuardian || (hasGuardian && guardianName.trim().length > 0)
    }
    if (item.field && fieldValues[item.field] !== undefined) {
      return fieldValues[item.field].trim().length > 0
    }
    return false
  }

  const checkedCount = useMemo(
    () => MEETING_CHECKLIST_ITEMS.filter(isItemChecked).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manualChecks, goalsNotes, communicationNeeds, culturalNeeds, medicalConditions, medications, mobilityNeeds, otherProviders, hasGuardian, guardianName]
  )
  const totalCount = MEETING_CHECKLIST_ITEMS.length
  const allChecked = checkedCount === totalCount

  function toggleManualCheck(id: string) {
    setManualChecks((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleExpanded(id: string) {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function setServiceAnswer(group: string, question: string, answer: string) {
    setServiceAnswers((prev) => ({
      ...prev,
      [group]: { ...(prev[group] || {}), [question]: answer },
    }))
  }

  // Build the full meeting_checklist record (manual + auto combined)
  function buildChecklistRecord(): Record<string, boolean> {
    const record: Record<string, boolean> = {}
    for (const item of MEETING_CHECKLIST_ITEMS) {
      record[item.id] = isItemChecked(item)
    }
    return record
  }

  function handleSubmit() {
    const data: Partial<Stage2Data> = {
      meeting_checklist: buildChecklistRecord(),
      service_answers: serviceAnswers,
      has_guardian: hasGuardian,
      guardian_name: guardianName || undefined,
      guardian_relationship: guardianRelationship || undefined,
      guardian_phone: guardianPhone || undefined,
      guardian_authority: guardianAuthority || undefined,
      communication_needs: communicationNeeds || undefined,
      cultural_needs: culturalNeeds || undefined,
      goals_notes: goalsNotes || undefined,
      medical_conditions: medicalConditions || undefined,
      medications: medications || undefined,
      mobility_needs: mobilityNeeds || undefined,
      other_providers: otherProviders || undefined,
    }
    onSubmit(data)
  }

  return (
    <div className="space-y-6">
      {/* ── Live Meeting Checklist ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Meeting Checklist</CardTitle>
            <Badge variant={allChecked ? 'default' : 'secondary'} className={allChecked ? 'bg-green-600' : ''}>
              {checkedCount}/{totalCount}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Cover all these topics during the initial meeting. Items with fields auto-tick when you fill them in.
          </p>
        </CardHeader>
        <CardContent className="space-y-1">
          {MEETING_CHECKLIST_ITEMS.map((item) => {
            const checked = isItemChecked(item)
            const isExpanded = expandedItems[item.id]

            if (item.type === 'manual') {
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                    checked ? 'bg-green-50 border border-green-200' : 'hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleManualCheck(item.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${checked ? 'text-green-800 line-through' : ''}`}>
                      {item.label}
                    </span>
                    {item.hint && !checked && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.hint}</p>
                    )}
                  </div>
                  {checked && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />}
                </label>
              )
            }

            // Auto item — guardian is special
            if (item.field === 'guardian') {
              return (
                <div
                  key={item.id}
                  className={`rounded-lg px-3 py-2.5 transition-colors ${
                    checked ? 'bg-green-50 border border-green-200' : 'border border-transparent'
                  }`}
                >
                  <button
                    type="button"
                    className="flex items-start gap-3 w-full text-left"
                    onClick={() => toggleExpanded(item.id)}
                  >
                    {checked ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${checked ? 'text-green-800' : ''}`}>{item.label}</span>
                      {checked && !hasGuardian && (
                        <p className="text-xs text-green-600 mt-0.5">No guardian — not applicable</p>
                      )}
                      {checked && hasGuardian && (
                        <p className="text-xs text-green-600 mt-0.5">Guardian: {guardianName}</p>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-7 mt-3 space-y-3 pb-1">
                      <div className="flex items-center gap-3">
                        <Switch checked={hasGuardian} onCheckedChange={setHasGuardian} />
                        <Label className="text-sm">Participant has a guardian or nominee</Label>
                      </div>
                      {hasGuardian && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Guardian Name</Label>
                            <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Full name" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Relationship</Label>
                            <Input value={guardianRelationship} onChange={(e) => setGuardianRelationship(e.target.value)} placeholder="e.g., Mother, Spouse" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Phone</Label>
                            <Input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="Phone number" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Authority Details</Label>
                            <Input value={guardianAuthority} onChange={(e) => setGuardianAuthority(e.target.value)} placeholder="e.g., Guardianship order number" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            }

            // Regular auto item with textarea
            const fieldKey = item.field!
            const value = fieldValues[fieldKey] || ''
            const setter = fieldSetters[fieldKey]

            return (
              <div
                key={item.id}
                className={`rounded-lg px-3 py-2.5 transition-colors ${
                  checked ? 'bg-green-50 border border-green-200' : 'border border-transparent'
                }`}
              >
                <button
                  type="button"
                  className="flex items-start gap-3 w-full text-left"
                  onClick={() => toggleExpanded(item.id)}
                >
                  {checked ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${checked ? 'text-green-800' : ''}`}>{item.label}</span>
                    {checked && value && (
                      <p className="text-xs text-green-600 mt-0.5 truncate">{value}</p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-7 mt-2 pb-1">
                    <Textarea
                      rows={2}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={item.placeholder}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            )
          })}

          {/* Progress bar */}
          <div className="pt-3">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  allChecked ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${(checkedCount / totalCount) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {allChecked
                ? 'All topics covered — ready to continue.'
                : `${totalCount - checkedCount} item${totalCount - checkedCount === 1 ? '' : 's'} remaining`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Service-Specific Questions ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service-Specific Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion className="w-full" multiple>
            {servicesRequested.map((groupCode) => {
              const sq = SERVICE_QUESTIONS[groupCode]
              if (!sq) return null
              return (
                <AccordionItem key={groupCode} value={groupCode}>
                  <AccordionTrigger className="text-sm">
                    <span className="font-mono text-xs text-muted-foreground mr-2">{groupCode}</span>
                    {sq.label}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    {sq.questions.map((q) => (
                      <div key={q} className="space-y-1">
                        <Label className="text-sm font-normal">{q}</Label>
                        <Textarea
                          rows={2}
                          value={serviceAnswers[groupCode]?.[q] || ''}
                          onChange={(e) => setServiceAnswer(groupCode, q, e.target.value)}
                          placeholder="Enter response..."
                        />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
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
