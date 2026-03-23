import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { INDUCTION_CHECKLIST_ITEMS } from '../../constants'
import type { WorkerStage9Data } from '../../schemas'

interface Stage9Props {
  defaultValues?: Partial<WorkerStage9Data>
  onSubmit: (data: WorkerStage9Data) => void
  onBack: () => void
  isLoading: boolean
}

export function Stage9Induction({ defaultValues, onSubmit, onBack, isLoading }: Stage9Props) {
  const [items, setItems] = useState<Record<string, boolean>>(
    defaultValues?.induction_items ||
    Object.fromEntries(INDUCTION_CHECKLIST_ITEMS.map((item) => [item, false]))
  )
  const [inductionDate, setInductionDate] = useState(defaultValues?.induction_date || '')
  const [notes, setNotes] = useState(defaultValues?.notes || '')

  const completedCount = useMemo(() => Object.values(items).filter(Boolean).length, [items])
  const allComplete = completedCount === INDUCTION_CHECKLIST_ITEMS.length
  const progress = (completedCount / INDUCTION_CHECKLIST_ITEMS.length) * 100

  function toggleItem(item: string) {
    setItems((prev) => ({ ...prev, [item]: !prev[item] }))
  }

  function handleFormSubmit() {
    if (!allComplete || !inductionDate) return
    onSubmit({
      induction_items: items,
      induction_date: inductionDate,
      notes: notes || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staff Induction Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Complete the staff induction checklist. All {INDUCTION_CHECKLIST_ITEMS.length} items must be checked.
          </p>

          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground">
              {completedCount}/{INDUCTION_CHECKLIST_ITEMS.length}
            </span>
          </div>

          <div className="space-y-3">
            {INDUCTION_CHECKLIST_ITEMS.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <Checkbox
                  id={`induction-${item}`}
                  checked={items[item] || false}
                  onCheckedChange={() => toggleItem(item)}
                  className="mt-0.5"
                />
                <Label htmlFor={`induction-${item}`} className="font-normal leading-relaxed cursor-pointer">
                  {item}
                </Label>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="induction_date">Induction Date *</Label>
            <Input
              id="induction_date"
              type="date"
              value={inductionDate}
              onChange={(e) => setInductionDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="induction_notes">Notes (optional)</Label>
            <Textarea
              id="induction_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about the induction..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleFormSubmit} disabled={isLoading || !allComplete || !inductionDate}>
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
}
