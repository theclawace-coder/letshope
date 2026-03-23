import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { stage3Schema } from '../../schemas'
import type { Stage3Data } from '../../schemas'
import type { Stage1Data, Stage2Data } from '../../schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'

interface Stage3Props {
  defaultValues?: Partial<Stage3Data>
  participantData: {
    stage1: Stage1Data
    stage2: Stage2Data
  }
  onSubmit: (data: Stage3Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage3IntakeDetails({ defaultValues, participantData, onSubmit, onBack, isLoading }: Stage3Props) {
  const { stage1, stage2 } = participantData

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<Stage3Data>({
    resolver: zodResolver(stage3Schema),
    defaultValues: {
      funding_type: 'ndia_managed',
      emergency_contacts: [{ name: '', relationship: '', phone: '', is_guardian: false }],
      goals: stage2.goals_notes
        ? [{ goal: stage2.goals_notes, priority: 'medium' as const, notes: '' }]
        : [{ goal: '', priority: 'medium' as const, notes: '' }],
      communication_needs: stage2.communication_needs || '',
      cultural_needs: stage2.cultural_needs || '',
      medical_conditions: stage2.medical_conditions || '',
      mobility_needs: stage2.mobility_needs || '',
      ...defaultValues,
    },
  })

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control,
    name: 'emergency_contacts',
  })

  const {
    fields: goalFields,
    append: appendGoal,
    remove: removeGoal,
  } = useFieldArray({
    control,
    name: 'goals',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Accordion defaultValue={['personal', 'ndis_plan', 'medical', 'emergency', 'coordinator', 'needs', 'goals']} className="w-full" multiple>
        {/* Personal Details */}
        <AccordionItem value="personal">
          <AccordionTrigger className="text-sm font-semibold">Personal Details</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={stage1.first_name} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">From referral</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={stage1.last_name} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">From referral</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>NDIS Number</Label>
                    <Input value={stage1.ndis_number} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
                    {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
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
                      <SelectTrigger>
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
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
                      onValueChange={(v) => setValue('funding_type', v as Stage3Data['funding_type'], { shouldValidate: true })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                  <Label htmlFor="medical_conditions">Medical Conditions</Label>
                  <Textarea id="medical_conditions" {...register('medical_conditions')} placeholder="List known medical conditions..." rows={3} />
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
            {errors.emergency_contacts && (
              <Badge variant="destructive" className="ml-2">Required</Badge>
            )}
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
                      {errors.emergency_contacts?.[index]?.name && (
                        <p className="text-xs text-destructive">{errors.emergency_contacts[index]?.name?.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Relationship *</Label>
                      <Input {...register(`emergency_contacts.${index}.relationship`)} placeholder="e.g., Mother, Spouse" />
                      {errors.emergency_contacts?.[index]?.relationship && (
                        <p className="text-xs text-destructive">{errors.emergency_contacts[index]?.relationship?.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Phone *</Label>
                      <Input {...register(`emergency_contacts.${index}.phone`)} />
                      {errors.emergency_contacts?.[index]?.phone && (
                        <p className="text-xs text-destructive">{errors.emergency_contacts[index]?.phone?.message}</p>
                      )}
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
            {errors.emergency_contacts?.message && (
              <p className="text-sm text-destructive">{errors.emergency_contacts.message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendContact({ name: '', relationship: '', phone: '', is_guardian: false })}
            >
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

        {/* Communication / Cultural / Mobility Needs */}
        <AccordionItem value="needs">
          <AccordionTrigger className="text-sm font-semibold">Communication, Cultural & Mobility Needs</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="communication_needs">Communication Needs</Label>
                  <Textarea
                    id="communication_needs"
                    {...register('communication_needs')}
                    placeholder="e.g., Uses Auslan, needs Easy Read, prefers visual aids..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cultural_needs">Cultural / Religious Considerations</Label>
                  <Textarea
                    id="cultural_needs"
                    {...register('cultural_needs')}
                    placeholder="e.g., Halal food requirements, prayer times, cultural practices..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobility_needs">Mobility / Access Needs</Label>
                  <Textarea
                    id="mobility_needs"
                    {...register('mobility_needs')}
                    placeholder="e.g., Wheelchair user, walking frame, requires ramp access..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Goals */}
        <AccordionItem value="goals">
          <AccordionTrigger className="text-sm font-semibold">
            Goals
            {errors.goals && (
              <Badge variant="destructive" className="ml-2">Required</Badge>
            )}
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
                    {errors.goals?.[index]?.goal && (
                      <p className="text-xs text-destructive">{errors.goals[index]?.goal?.message}</p>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Priority</Label>
                      <Select
                        value={watch(`goals.${index}.priority`)}
                        onValueChange={(v) => setValue(`goals.${index}.priority`, v as 'high' | 'medium' | 'low')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
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
            {errors.goals?.message && (
              <p className="text-sm text-destructive">{errors.goals.message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendGoal({ goal: '', priority: 'medium', notes: '' })}
            >
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
