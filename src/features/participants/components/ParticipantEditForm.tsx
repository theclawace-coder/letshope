import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Save, X } from 'lucide-react'
import { PARTICIPANT_STATUSES, FUNDING_TYPES, URGENCY_LEVELS } from '@/lib/constants'
import type { Tables } from '@/lib/types'
import type { Address } from '@/lib/types'

type Participant = Tables<'participants'>

interface ParticipantEditFormProps {
  participant: Participant
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  isSaving: boolean
}

export function ParticipantEditForm({ participant, onSave, onCancel, isSaving }: ParticipantEditFormProps) {
  const address = (participant.address as Address | null) || { street: '', suburb: '', state: '', postcode: '' }

  const [form, setForm] = useState({
    first_name: participant.first_name || '',
    last_name: participant.last_name || '',
    preferred_name: participant.preferred_name || '',
    date_of_birth: participant.date_of_birth || '',
    gender: participant.gender || '',
    phone: participant.phone || '',
    email: participant.email || '',
    ndis_number: participant.ndis_number || '',
    status: participant.status || 'referral',
    funding_type: participant.funding_type || '',
    plan_start_date: participant.plan_start_date || '',
    plan_end_date: participant.plan_end_date || '',
    plan_number: participant.plan_number || '',
    address_street: address.street || '',
    address_suburb: address.suburb || '',
    address_state: address.state || '',
    address_postcode: address.postcode || '',
    support_coordinator_name: participant.support_coordinator_name || '',
    support_coordinator_phone: participant.support_coordinator_phone || '',
    support_coordinator_email: participant.support_coordinator_email || '',
    lac_name: participant.lac_name || '',
    lac_contact: participant.lac_contact || '',
    has_guardian: participant.has_guardian || false,
    guardian_name: participant.guardian_name || '',
    guardian_relationship: participant.guardian_relationship || '',
    guardian_phone: participant.guardian_phone || '',
    guardian_email: participant.guardian_email || '',
    gp_name: participant.gp_name || '',
    gp_phone: participant.gp_phone || '',
    gp_address: participant.gp_address || '',
    communication_needs: participant.communication_needs || '',
    cultural_needs: participant.cultural_needs || '',
    mobility_needs: participant.mobility_needs || '',
    living_situation: participant.living_situation || '',
    urgency: participant.urgency || 'routine',
    risk_level: participant.risk_level || 'low',
    notes: participant.notes || '',
    budget_core: participant.budget_core?.toString() || '',
    budget_capacity_building: participant.budget_capacity_building?.toString() || '',
    budget_capital: participant.budget_capital?.toString() || '',
  })

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const data: Record<string, unknown> = {
      first_name: form.first_name,
      last_name: form.last_name,
      preferred_name: form.preferred_name || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      phone: form.phone || null,
      email: form.email || null,
      ndis_number: form.ndis_number || null,
      status: form.status,
      funding_type: form.funding_type || null,
      plan_start_date: form.plan_start_date || null,
      plan_end_date: form.plan_end_date || null,
      plan_number: form.plan_number || null,
      address: form.address_street
        ? { street: form.address_street, suburb: form.address_suburb, state: form.address_state, postcode: form.address_postcode }
        : null,
      support_coordinator_name: form.support_coordinator_name || null,
      support_coordinator_phone: form.support_coordinator_phone || null,
      support_coordinator_email: form.support_coordinator_email || null,
      lac_name: form.lac_name || null,
      lac_contact: form.lac_contact || null,
      has_guardian: form.has_guardian,
      guardian_name: form.has_guardian ? form.guardian_name || null : null,
      guardian_relationship: form.has_guardian ? form.guardian_relationship || null : null,
      guardian_phone: form.has_guardian ? form.guardian_phone || null : null,
      guardian_email: form.has_guardian ? form.guardian_email || null : null,
      gp_name: form.gp_name || null,
      gp_phone: form.gp_phone || null,
      gp_address: form.gp_address || null,
      communication_needs: form.communication_needs || null,
      cultural_needs: form.cultural_needs || null,
      mobility_needs: form.mobility_needs || null,
      living_situation: form.living_situation || null,
      urgency: form.urgency,
      risk_level: form.risk_level,
      notes: form.notes || null,
      budget_core: form.budget_core ? parseFloat(form.budget_core) : null,
      budget_capacity_building: form.budget_capacity_building ? parseFloat(form.budget_capacity_building) : null,
      budget_capital: form.budget_capital ? parseFloat(form.budget_capital) : null,
    }

    onSave(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || !form.first_name || !form.last_name}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField label="First Name" required>
              <Input value={form.first_name} onChange={(e) => handleChange('first_name', e.target.value)} />
            </FormField>
            <FormField label="Last Name" required>
              <Input value={form.last_name} onChange={(e) => handleChange('last_name', e.target.value)} />
            </FormField>
            <FormField label="Preferred Name">
              <Input value={form.preferred_name} onChange={(e) => handleChange('preferred_name', e.target.value)} />
            </FormField>
            <FormField label="Date of Birth">
              <Input type="date" value={form.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} />
            </FormField>
            <FormField label="Gender">
              <Input value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
            </FormField>
          </CardContent>
        </Card>

        {/* NDIS & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">NDIS & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField label="NDIS Number">
              <Input value={form.ndis_number} onChange={(e) => handleChange('ndis_number', e.target.value)} className="font-mono" />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={(v) => v && handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PARTICIPANT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Funding Type">
              <Select value={form.funding_type} onValueChange={(v) => v && handleChange('funding_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {FUNDING_TYPES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Plan Number">
              <Input value={form.plan_number} onChange={(e) => handleChange('plan_number', e.target.value)} />
            </FormField>
            <FormField label="Plan Start">
              <Input type="date" value={form.plan_start_date} onChange={(e) => handleChange('plan_start_date', e.target.value)} />
            </FormField>
            <FormField label="Plan End">
              <Input type="date" value={form.plan_end_date} onChange={(e) => handleChange('plan_end_date', e.target.value)} />
            </FormField>
            <FormField label="Urgency">
              <Select value={form.urgency} onValueChange={(v) => v && handleChange('urgency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {URGENCY_LEVELS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Street">
              <Input value={form.address_street} onChange={(e) => handleChange('address_street', e.target.value)} />
            </FormField>
            <FormField label="Suburb">
              <Input value={form.address_suburb} onChange={(e) => handleChange('address_suburb', e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="State">
                <Input value={form.address_state} onChange={(e) => handleChange('address_state', e.target.value)} />
              </FormField>
              <FormField label="Postcode">
                <Input value={form.address_postcode} onChange={(e) => handleChange('address_postcode', e.target.value)} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Support Team */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Support Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Support Coordinator">
              <Input value={form.support_coordinator_name} onChange={(e) => handleChange('support_coordinator_name', e.target.value)} />
            </FormField>
            <FormField label="SC Phone">
              <Input value={form.support_coordinator_phone} onChange={(e) => handleChange('support_coordinator_phone', e.target.value)} />
            </FormField>
            <FormField label="SC Email">
              <Input type="email" value={form.support_coordinator_email} onChange={(e) => handleChange('support_coordinator_email', e.target.value)} />
            </FormField>
            <FormField label="LAC Name">
              <Input value={form.lac_name} onChange={(e) => handleChange('lac_name', e.target.value)} />
            </FormField>
            <FormField label="LAC Contact">
              <Input value={form.lac_contact} onChange={(e) => handleChange('lac_contact', e.target.value)} />
            </FormField>
          </CardContent>
        </Card>

        {/* Guardian */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Guardian / Nominee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.has_guardian}
                onCheckedChange={(v) => handleChange('has_guardian', v)}
                size="sm"
              />
              <Label className="text-sm">Has Guardian</Label>
            </div>
            {form.has_guardian && (
              <>
                <FormField label="Guardian Name">
                  <Input value={form.guardian_name} onChange={(e) => handleChange('guardian_name', e.target.value)} />
                </FormField>
                <FormField label="Relationship">
                  <Input value={form.guardian_relationship} onChange={(e) => handleChange('guardian_relationship', e.target.value)} />
                </FormField>
                <FormField label="Phone">
                  <Input value={form.guardian_phone} onChange={(e) => handleChange('guardian_phone', e.target.value)} />
                </FormField>
                <FormField label="Email">
                  <Input type="email" value={form.guardian_email} onChange={(e) => handleChange('guardian_email', e.target.value)} />
                </FormField>
              </>
            )}
          </CardContent>
        </Card>

        {/* Medical */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">GP Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField label="GP Name">
              <Input value={form.gp_name} onChange={(e) => handleChange('gp_name', e.target.value)} />
            </FormField>
            <FormField label="GP Phone">
              <Input value={form.gp_phone} onChange={(e) => handleChange('gp_phone', e.target.value)} />
            </FormField>
            <FormField label="GP Address">
              <Input value={form.gp_address} onChange={(e) => handleChange('gp_address', e.target.value)} />
            </FormField>
          </CardContent>
        </Card>

        {/* Needs & Living */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Support Needs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Communication Needs">
              <Textarea value={form.communication_needs} onChange={(e) => handleChange('communication_needs', e.target.value)} rows={2} />
            </FormField>
            <FormField label="Cultural Needs">
              <Textarea value={form.cultural_needs} onChange={(e) => handleChange('cultural_needs', e.target.value)} rows={2} />
            </FormField>
            <FormField label="Mobility Needs">
              <Textarea value={form.mobility_needs} onChange={(e) => handleChange('mobility_needs', e.target.value)} rows={2} />
            </FormField>
            <FormField label="Living Situation">
              <Input value={form.living_situation} onChange={(e) => handleChange('living_situation', e.target.value)} />
            </FormField>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Core Supports ($)">
              <Input type="number" step="0.01" value={form.budget_core} onChange={(e) => handleChange('budget_core', e.target.value)} />
            </FormField>
            <FormField label="Capacity Building ($)">
              <Input type="number" step="0.01" value={form.budget_capacity_building} onChange={(e) => handleChange('budget_capacity_building', e.target.value)} />
            </FormField>
            <FormField label="Capital ($)">
              <Input type="number" step="0.01" value={form.budget_capital} onChange={(e) => handleChange('budget_capital', e.target.value)} />
            </FormField>
          </CardContent>
        </Card>
      </div>

      {/* Notes (full width) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={4} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || !form.first_name || !form.last_name}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}
