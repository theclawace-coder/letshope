import { useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { stage2Schema } from '../../schemas'
import type { Stage2Data } from '../../schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, ChevronDown, ChevronUp, Plus, Trash2, BookOpen } from 'lucide-react'
import { MEETING_CHECKLIST_ITEMS, SERVICE_QUESTIONS } from '../../constants'
import type { MeetingChecklistItem } from '../../constants'

interface Stage2Props {
  defaultValues?: Partial<Stage2Data>
  servicesRequested: string[]
  onSubmit: (data: Stage2Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage2MeetAndLearn({ defaultValues, servicesRequested, onSubmit, onBack, isLoading }: Stage2Props) {
  // ── Meeting checklist state ──
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>(
    defaultValues?.meeting_checklist || {}
  )
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Guardian
  const [hasGuardian, setHasGuardian] = useState(defaultValues?.has_guardian || false)
  const [guardianName, setGuardianName] = useState(defaultValues?.guardian_name || '')
  const [guardianRelationship, setGuardianRelationship] = useState(defaultValues?.guardian_relationship || '')
  const [guardianPhone, setGuardianPhone] = useState(defaultValues?.guardian_phone || '')
  const [guardianAuthority, setGuardianAuthority] = useState(defaultValues?.guardian_authority || '')

  // Needs fields (for auto-tick checklist)
  const [communicationNeeds, setCommunicationNeeds] = useState(defaultValues?.communication_needs || '')
  const [culturalNeeds, setCulturalNeeds] = useState(defaultValues?.cultural_needs || '')
  const [medicalConditions, setMedicalConditions] = useState(defaultValues?.medical_conditions || '')
  const [medications, setMedications] = useState(defaultValues?.medications || '')
  const [mobilityNeeds, setMobilityNeeds] = useState(defaultValues?.mobility_needs || '')
  const [otherProviders, setOtherProviders] = useState(defaultValues?.other_providers || '')

  // Service-specific Q&A
  const [serviceAnswers, setServiceAnswers] = useState<Record<string, Record<string, string>>>(
    defaultValues?.service_answers || {}
  )

  // ── Form for the intake fields (personal details, NDIS, contacts, goals) ──
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<Stage2Data>({
    resolver: zodResolver(stage2Schema),
    defaultValues: {
      meeting_checklist: {},
      service_answers: {},
      has_guardian: false,
      date_of_birth: '',
      funding_type: 'ndia_managed',
      plan_start_date: '',
      plan_end_date: '',
      emergency_contacts: [{ name: '', relationship: '', phone: '', is_guardian: false }],
      goals: [{ goal: '', priority: 'medium' as const, notes: '' }],
      ...defaultValues,
    },
  })

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({ control, name: 'emergency_contacts' })

  const {
    fields: goalFields,
    append: appendGoal,
    remove: removeGoal,
  } = useFieldArray({ control, name: 'goals' })

  // ── Auto-tick helpers ──
  const fieldValues: Record<string, string> = {
    communication_needs: communicationNeeds,
    cultural_needs: culturalNeeds,
    medical_conditions: medicalConditions,
    medications,
    mobility_needs: mobilityNeeds,
    other_providers: otherProviders,
  }

  const fieldSetters: Record<string, (v: string) => void> = {
    communication_needs: setCommunicationNeeds,
    cultural_needs: setCulturalNeeds,
    medical_conditions: setMedicalConditions,
    medications: setMedications,
    mobility_needs: setMobilityNeeds,
    other_providers: setOtherProviders,
  }

  const goalsArray = watch('goals')

  function isItemChecked(item: MeetingChecklistItem): boolean {
    if (item.type === 'manual') return !!manualChecks[item.id]
    if (item.field === 'guardian') return !hasGuardian || (hasGuardian && guardianName.trim().length > 0)
    if (item.field === 'goals') return (goalsArray?.length ?? 0) > 0 && goalsArray?.[0]?.goal?.trim().length > 0
    if (item.field && fieldValues[item.field] !== undefined) return fieldValues[item.field].trim().length > 0
    return false
  }

  const checkedCount = useMemo(
    () => MEETING_CHECKLIST_ITEMS.filter(isItemChecked).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manualChecks, communicationNeeds, culturalNeeds, medicalConditions, medications, mobilityNeeds, otherProviders, hasGuardian, guardianName, goalsArray]
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

  function buildChecklistRecord(): Record<string, boolean> {
    const record: Record<string, boolean> = {}
    for (const item of MEETING_CHECKLIST_ITEMS) {
      record[item.id] = isItemChecked(item)
    }
    return record
  }

  function onFormSubmit(formData: Stage2Data) {
    const data: Stage2Data = {
      ...formData,
      meeting_checklist: buildChecklistRecord(),
      service_answers: serviceAnswers,
      has_guardian: hasGuardian,
      guardian_name: guardianName || undefined,
      guardian_relationship: guardianRelationship || undefined,
      guardian_phone: guardianPhone || undefined,
      guardian_authority: guardianAuthority || undefined,
      communication_needs: communicationNeeds || undefined,
      cultural_needs: culturalNeeds || undefined,
      medical_conditions: medicalConditions || undefined,
      medications: medications || undefined,
      mobility_needs: mobilityNeeds || undefined,
      other_providers: otherProviders || undefined,
    }
    onSubmit(data)
  }

  return (
    <form onSubmit={rhfHandleSubmit(onFormSubmit)} className="space-y-6">
      {/* ═══════════ SECTION A: Meeting Guide ═══════════ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Meeting Guide
            </CardTitle>
            <Badge variant={allChecked ? 'default' : 'secondary'} className={allChecked ? 'bg-green-600' : ''}>
              {checkedCount}/{totalCount}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Walk through each topic with the participant. Expand items to see what to explain — auto-tick items complete when you fill in the fields below.
          </p>
        </CardHeader>
        <CardContent className="space-y-1">
          {MEETING_CHECKLIST_ITEMS.map((item) => {
            const checked = isItemChecked(item)
            const isExpanded = expandedItems[item.id]

            // ── Manual items (explain services/rights/complaints/privacy) ──
            if (item.type === 'manual') {
              return (
                <div
                  key={item.id}
                  className={`rounded-lg px-3 py-2.5 transition-colors ${
                    checked ? 'bg-green-50 border border-green-200' : 'border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleManualCheck(item.id)}
                      className="mt-0.5"
                    />
                    <button
                      type="button"
                      className="flex-1 text-left min-w-0"
                      onClick={() => toggleExpanded(item.id)}
                    >
                      <span className={`text-sm ${checked ? 'text-green-800 line-through' : ''}`}>
                        {item.label}
                      </span>
                      {item.hint && !checked && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.hint}</p>
                      )}
                    </button>
                    {item.handbookContent && (
                      <button type="button" onClick={() => toggleExpanded(item.id)} className="shrink-0 mt-0.5">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    )}
                    {checked && !item.handbookContent && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />}
                  </div>

                  {/* Inline handbook content */}
                  {isExpanded && item.handbookContent && (
                    <div className="ml-7 mt-3 mb-1 rounded-lg bg-blue-50 border border-blue-200 p-4">
                      <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> Read this with the participant:
                      </p>
                      <div className="text-sm text-blue-900 prose prose-sm max-w-none whitespace-pre-line">
                        {item.handbookContent}
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            // ── Guardian auto item ──
            if (item.field === 'guardian') {
              return (
                <div
                  key={item.id}
                  className={`rounded-lg px-3 py-2.5 transition-colors ${
                    checked ? 'bg-green-50 border border-green-200' : 'border border-transparent'
                  }`}
                >
                  <button type="button" className="flex items-start gap-3 w-full text-left" onClick={() => toggleExpanded(item.id)}>
                    {checked ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${checked ? 'text-green-800' : ''}`}>{item.label}</span>
                      {checked && !hasGuardian && <p className="text-xs text-green-600 mt-0.5">No guardian — not applicable</p>}
                      {checked && hasGuardian && <p className="text-xs text-green-600 mt-0.5">Guardian: {guardianName}</p>}
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
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

            // ── Goals auto item (points to the goals section below) ──
            if (item.field === 'goals') {
              const goalsOk = (goalsArray?.length ?? 0) > 0 && goalsArray?.[0]?.goal?.trim().length > 0
              return (
                <div
                  key={item.id}
                  className={`rounded-lg px-3 py-2.5 transition-colors ${
                    goalsOk ? 'bg-green-50 border border-green-200' : 'border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {goalsOk ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${goalsOk ? 'text-green-800' : ''}`}>{item.label}</span>
                      {goalsOk && <p className="text-xs text-green-600 mt-0.5">{goalsArray?.length} goal(s) entered below</p>}
                      {!goalsOk && <p className="text-xs text-muted-foreground mt-0.5">Fill in the Goals section below</p>}
                    </div>
                  </div>
                </div>
              )
            }

            // ── Regular auto item with inline textarea ──
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
                <button type="button" className="flex items-start gap-3 w-full text-left" onClick={() => toggleExpanded(item.id)}>
                  {checked ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${checked ? 'text-green-800' : ''}`}>{item.label}</span>
                    {checked && value && <p className="text-xs text-green-600 mt-0.5 truncate">{value}</p>}
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="ml-7 mt-2 pb-1">
                    <Textarea rows={2} value={value} onChange={(e) => setter(e.target.value)} placeholder={item.placeholder} className="text-sm" />
                  </div>
                )}
              </div>
            )
          })}

          {/* Progress bar */}
          <div className="pt-3">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${allChecked ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${(checkedCount / totalCount) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {allChecked ? 'All topics covered!' : `${totalCount - checkedCount} item${totalCount - checkedCount === 1 ? '' : 's'} remaining`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ SECTION B: Service-Specific Questions ═══════════ */}
      {servicesRequested.some((code) => SERVICE_QUESTIONS[code]) && (
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
                          <Textarea rows={2} value={serviceAnswers[groupCode]?.[q] || ''} onChange={(e) => setServiceAnswer(groupCode, q, e.target.value)} placeholder="Enter response..." />
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ SECTION C: Personal Details ═══════════ */}
      <Accordion defaultValue={['personal', 'ndis_plan', 'medical', 'emergency', 'coordinator', 'goals']} className="w-full" multiple>
        <AccordionItem value="personal">
          <AccordionTrigger className="text-sm font-semibold">Personal Details</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
                    {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={watch('gender') || ''} onValueChange={(v) => setValue('gender', v ?? '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non_binary">Non-binary</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="living_situation">Living Situation</Label>
                    <Select value={watch('living_situation') || ''} onValueChange={(v) => setValue('living_situation', v ?? '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alone">Lives alone</SelectItem>
                        <SelectItem value="with_family">Lives with family</SelectItem>
                        <SelectItem value="shared">Shared housing</SelectItem>
                        <SelectItem value="sil">Supported Independent Living</SelectItem>
                        <SelectItem value="group_home">Group home</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_street">Street Address</Label>
                  <Input id="address_street" {...register('address_street')} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="address_suburb">Suburb</Label>
                    <Input id="address_suburb" {...register('address_suburb')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_state">State</Label>
                    <Select value={watch('address_state') || ''} onValueChange={(v) => setValue('address_state', v ?? '')}>
                      <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NSW">NSW</SelectItem>
                        <SelectItem value="VIC">VIC</SelectItem>
                        <SelectItem value="QLD">QLD</SelectItem>
                        <SelectItem value="SA">SA</SelectItem>
                        <SelectItem value="WA">WA</SelectItem>
                        <SelectItem value="TAS">TAS</SelectItem>
                        <SelectItem value="NT">NT</SelectItem>
                        <SelectItem value="ACT">ACT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_postcode">Postcode</Label>
                    <Input id="address_postcode" {...register('address_postcode')} maxLength={4} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* NDIS Plan Details */}
        <AccordionItem value="ndis_plan">
          <AccordionTrigger className="text-sm font-semibold">NDIS Plan Details</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Funding Type *</Label>
                    <Select
                      value={watch('funding_type')}
                      onValueChange={(v) => setValue('funding_type', v as Stage2Data['funding_type'], { shouldValidate: true })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ndia_managed">NDIA Managed</SelectItem>
                        <SelectItem value="plan_managed">Plan Managed</SelectItem>
                        <SelectItem value="self_managed">Self Managed</SelectItem>
                        <SelectItem value="combination">Combination</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan_number">Plan Number</Label>
                    <Input id="plan_number" {...register('plan_number')} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plan_start_date">Plan Start Date *</Label>
                    <Input id="plan_start_date" type="date" {...register('plan_start_date')} />
                    {errors.plan_start_date && <p className="text-xs text-destructive">{errors.plan_start_date.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan_end_date">Plan End Date *</Label>
                    <Input id="plan_end_date" type="date" {...register('plan_end_date')} />
                    {errors.plan_end_date && <p className="text-xs text-destructive">{errors.plan_end_date.message}</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="budget_core">Core Budget ($)</Label>
                    <Input id="budget_core" type="number" step="0.01" {...register('budget_core')} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget_capacity_building">Capacity Building ($)</Label>
                    <Input id="budget_capacity_building" type="number" step="0.01" {...register('budget_capacity_building')} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget_capital">Capital ($)</Label>
                    <Input id="budget_capital" type="number" step="0.01" {...register('budget_capital')} placeholder="0.00" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Medical */}
        <AccordionItem value="medical">
          <AccordionTrigger className="text-sm font-semibold">Medical</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gp_name">GP Name</Label>
                    <Input id="gp_name" {...register('gp_name')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gp_phone">GP Phone</Label>
                    <Input id="gp_phone" {...register('gp_phone')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gp_address">GP Address</Label>
                  <Input id="gp_address" {...register('gp_address')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea id="allergies" {...register('allergies')} placeholder="List allergies (medications, food, environmental)..." rows={2} />
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Emergency Contacts */}
        <AccordionItem value="emergency">
          <AccordionTrigger className="text-sm font-semibold">
            Emergency Contacts
            {errors.emergency_contacts && <Badge variant="destructive" className="ml-2">Required</Badge>}
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            {contactFields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Contact {index + 1}</CardTitle>
                    {contactFields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeContact(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Name *</Label>
                      <Input {...register(`emergency_contacts.${index}.name`)} />
                      {errors.emergency_contacts?.[index]?.name && <p className="text-xs text-destructive">{errors.emergency_contacts[index]?.name?.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Relationship *</Label>
                      <Input {...register(`emergency_contacts.${index}.relationship`)} placeholder="e.g., Mother, Spouse" />
                      {errors.emergency_contacts?.[index]?.relationship && <p className="text-xs text-destructive">{errors.emergency_contacts[index]?.relationship?.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Phone *</Label>
                      <Input {...register(`emergency_contacts.${index}.phone`)} />
                      {errors.emergency_contacts?.[index]?.phone && <p className="text-xs text-destructive">{errors.emergency_contacts[index]?.phone?.message}</p>}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={watch(`emergency_contacts.${index}.is_guardian`) || false}
                      onCheckedChange={(checked) => setValue(`emergency_contacts.${index}.is_guardian`, !!checked)}
                    />
                    <span className="text-sm">This person is the participant's guardian/nominee</span>
                  </label>
                </CardContent>
              </Card>
            ))}
            {errors.emergency_contacts?.message && <p className="text-sm text-destructive">{errors.emergency_contacts.message}</p>}
            <Button type="button" variant="outline" size="sm" onClick={() => appendContact({ name: '', relationship: '', phone: '', is_guardian: false })}>
              <Plus className="h-4 w-4 mr-1" /> Add Contact
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Support Coordinator */}
        <AccordionItem value="coordinator">
          <AccordionTrigger className="text-sm font-semibold">Support Coordinator / LAC</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground">Support Coordinator</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="support_coordinator_name">Name</Label>
                    <Input id="support_coordinator_name" {...register('support_coordinator_name')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support_coordinator_phone">Phone</Label>
                    <Input id="support_coordinator_phone" {...register('support_coordinator_phone')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support_coordinator_email">Email</Label>
                    <Input id="support_coordinator_email" type="email" {...register('support_coordinator_email')} />
                  </div>
                </div>
                <hr className="my-2" />
                <p className="text-sm text-muted-foreground">Local Area Coordinator (LAC)</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lac_name">Name</Label>
                    <Input id="lac_name" {...register('lac_name')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lac_contact">Contact</Label>
                    <Input id="lac_contact" {...register('lac_contact')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Goals */}
        <AccordionItem value="goals">
          <AccordionTrigger className="text-sm font-semibold">
            Goals
            {errors.goals && <Badge variant="destructive" className="ml-2">Required</Badge>}
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              What does the participant want to achieve? Add at least one goal.
            </p>
            {goalFields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Goal {index + 1}</CardTitle>
                    {goalFields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeGoal(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label>Goal Description *</Label>
                    <Textarea {...register(`goals.${index}.goal`)} placeholder="e.g., I want to be able to cook a meal independently" rows={2} />
                    {errors.goals?.[index]?.goal && <p className="text-xs text-destructive">{errors.goals[index]?.goal?.message}</p>}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Priority</Label>
                      <Select value={watch(`goals.${index}.priority`)} onValueChange={(v) => setValue(`goals.${index}.priority`, v as 'high' | 'medium' | 'low')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Notes</Label>
                      <Input {...register(`goals.${index}.notes`)} placeholder="Optional notes" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {errors.goals?.message && <p className="text-sm text-destructive">{errors.goals.message}</p>}
            <Button type="button" variant="outline" size="sm" onClick={() => appendGoal({ goal: '', priority: 'medium', notes: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Goal
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </form>
  )
}
