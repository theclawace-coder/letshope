import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUpload } from '@/components/shared/FileUpload'
import { Plus, Trash2 } from 'lucide-react'
import { QUALIFICATION_TYPES } from '../../constants'
import { REGISTRATION_GROUPS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import type { WorkerStage10Data } from '../../schemas'

interface Qualification {
  type: string
  registration_number: string
  expiry_date: string
}

interface Stage10Props {
  defaultValues?: Partial<WorkerStage10Data>
  workerId?: string
  roleTitle?: string
  onSubmit: (data: WorkerStage10Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage10Qualifications({ defaultValues, workerId, roleTitle, onSubmit, onBack, isLoading }: Stage10Props) {
  const [qualifications, setQualifications] = useState<Qualification[]>(
    (defaultValues?.qualifications as Qualification[] | undefined) || []
  )
  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    defaultValues?.qualified_registration_groups || []
  )
  const [referencesVerified, setReferencesVerified] = useState(
    defaultValues?.references_verified || false
  )

  function addQualification() {
    setQualifications((prev) => [...prev, { type: '', registration_number: '', expiry_date: '' }])
  }

  function updateQualification(index: number, field: keyof Qualification, value: string) {
    setQualifications((prev) => prev.map((q, i) => i === index ? { ...q, [field]: value } : q))
  }

  function removeQualification(index: number) {
    setQualifications((prev) => prev.filter((_, i) => i !== index))
  }

  function toggleGroup(code: string) {
    setSelectedGroups((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  async function handleUpload(file: File) {
    if (!workerId) return
    const path = `workers/${workerId}/qualifications/${file.name}`
    await supabase.storage.from('documents').upload(path, file, { upsert: true })
    await supabase.from('documents').insert({
      name: file.name,
      category: 'qualification',
      worker_id: workerId,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
    } as never)
  }

  function handleFormSubmit() {
    if (selectedGroups.length === 0) return
    onSubmit({
      qualifications,
      qualified_registration_groups: selectedGroups,
      references_verified: referencesVerified,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Qualifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verify role-specific qualifications for <strong>{roleTitle || 'this worker'}</strong>.
          </p>

          {qualifications.map((qual, i) => (
            <div key={i} className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Qualification {i + 1}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeQualification(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={qual.type} onValueChange={(v) => updateQualification(i, 'type', v || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALIFICATION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Registration Number</Label>
                  <Input
                    value={qual.registration_number}
                    onChange={(e) => updateQualification(i, 'registration_number', e.target.value)}
                    placeholder="e.g., AHPRA-123456"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Expiry Date</Label>
                  <Input
                    type="date"
                    value={qual.expiry_date}
                    onChange={(e) => updateQualification(i, 'expiry_date', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addQualification}>
            <Plus className="h-4 w-4 mr-1" /> Add Qualification
          </Button>

          <FileUpload
            onUpload={handleUpload}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registration Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select the NDIS registration groups this worker is qualified to deliver services for.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(REGISTRATION_GROUPS).map(([code, group]) => (
              <button
                type="button"
                key={code}
                onClick={() => toggleGroup(code)}
                className={`flex items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors ${
                  selectedGroups.includes(code)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Checkbox checked={selectedGroups.includes(code)} />
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{code}</span>{' '}
                  <span>{group.name}</span>
                </div>
              </button>
            ))}
          </div>
          {selectedGroups.length === 0 && (
            <p className="text-sm text-destructive">Select at least one registration group</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">References</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="references_verified"
              checked={referencesVerified}
              onCheckedChange={(checked) => setReferencesVerified(checked === true)}
            />
            <Label htmlFor="references_verified" className="font-normal">
              Minimum 2 references have been checked and verified
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <div className="flex items-center gap-3">
          {selectedGroups.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
            </span>
          )}
          <Button onClick={handleFormSubmit} disabled={isLoading || selectedGroups.length === 0}>
            {isLoading ? 'Saving...' : 'Complete Onboarding'}
          </Button>
        </div>
      </div>
    </div>
  )
}
