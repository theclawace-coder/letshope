import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { CLAIM_TYPES, LINE_ITEM_UNITS } from '@/lib/constants'
import { formatCurrency } from '@/lib/formatters'

interface LineItemValues {
  support_item_number?: string
  support_item_name: string
  registration_group?: string
  date_of_service: string
  quantity: number
  unit: string
  unit_price: number
  ndis_max_price?: number
  gst_applicable: boolean
  claim_type: string
}

interface InvoiceLineItemsProps {
  priceGuide?: { support_item_number: string; support_item_name: string; price_national: number; unit: string; registration_group: string }[]
}

export function InvoiceLineItems({ priceGuide }: InvoiceLineItemsProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext()
  const { fields, append, remove } = useFieldArray({ name: 'line_items' })
  const lineItems = watch('line_items') as LineItemValues[] | undefined

  const handleAddItem = () => {
    append({
      support_item_number: '',
      support_item_name: '',
      registration_group: '',
      date_of_service: '',
      start_time: '',
      end_time: '',
      quantity: 1,
      unit: 'hour',
      unit_price: 0,
      ndis_max_price: undefined,
      gst_applicable: false,
      claim_type: 'standard',
      worker_id: '',
      booking_id: '',
      notes: '',
    })
  }

  const handlePriceGuideSelect = (index: number, itemNumber: string) => {
    const item = priceGuide?.find((p) => p.support_item_number === itemNumber)
    if (item) {
      setValue(`line_items.${index}.support_item_number`, item.support_item_number)
      setValue(`line_items.${index}.support_item_name`, item.support_item_name)
      setValue(`line_items.${index}.unit_price`, item.price_national)
      setValue(`line_items.${index}.ndis_max_price`, item.price_national)
      setValue(`line_items.${index}.unit`, item.unit)
      setValue(`line_items.${index}.registration_group`, item.registration_group)
    }
  }

  const calculateLineTotal = (index: number) => {
    const qty = lineItems?.[index]?.quantity || 0
    const price = lineItems?.[index]?.unit_price || 0
    return Math.round(qty * price * 100) / 100
  }

  const subtotal = lineItems?.reduce((sum: number, _: LineItemValues, i: number) => sum + calculateLineTotal(i), 0) || 0
  const gst = lineItems?.reduce((sum: number, li: LineItemValues, i: number) => {
    if (li?.gst_applicable) return sum + calculateLineTotal(i) * 0.1
    return sum
  }, 0) || 0

  // Type-safe error access for array fields
  const lineItemErrors = errors.line_items as Record<string, Record<string, { message?: string }>> | undefined

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Line Items</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No line items yet. Click &quot;Add Item&quot; to add services.
          </p>
        )}

        {fields.map((field, index) => {
          const lineTotal = calculateLineTotal(index)
          const maxPrice = lineItems?.[index]?.ndis_max_price
          const unitPrice = lineItems?.[index]?.unit_price || 0
          const exceedsMax = maxPrice != null && maxPrice > 0 && unitPrice > maxPrice
          const itemErrors = lineItemErrors?.[index]

          return (
            <div key={field.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Item {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {priceGuide && priceGuide.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">NDIS Price Guide Item</Label>
                  <Select
                    value={lineItems?.[index]?.support_item_number || ''}
                    onValueChange={(v) => v && handlePriceGuideSelect(index, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select from price guide (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceGuide.map((p) => (
                        <SelectItem key={p.support_item_number} value={p.support_item_number}>
                          {p.support_item_number} - {p.support_item_name} ({formatCurrency(p.price_national)}/{p.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Service Name *</Label>
                  <Input
                    {...register(`line_items.${index}.support_item_name`)}
                    placeholder="e.g. Daily Personal Activities"
                  />
                  {itemErrors?.support_item_name && (
                    <p className="text-xs text-destructive">{itemErrors.support_item_name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date of Service *</Label>
                  <Input type="date" {...register(`line_items.${index}.date_of_service`)} />
                  {itemErrors?.date_of_service && (
                    <p className="text-xs text-destructive">{itemErrors.date_of_service.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Quantity *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`line_items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit</Label>
                  <Select
                    value={lineItems?.[index]?.unit || 'hour'}
                    onValueChange={(v) => setValue(`line_items.${index}.unit`, v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINE_ITEM_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`line_items.${index}.unit_price`, { valueAsNumber: true })}
                  />
                  {exceedsMax && (
                    <p className="text-xs text-orange-600">
                      Exceeds NDIS max: {formatCurrency(maxPrice ?? 0)}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Line Total</Label>
                  <div className="h-9 flex items-center px-3 border rounded-md bg-muted text-sm font-medium">
                    {formatCurrency(lineTotal)}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Claim Type</Label>
                  <Select
                    value={lineItems?.[index]?.claim_type || 'standard'}
                    onValueChange={(v) => setValue(`line_items.${index}.claim_type`, v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLAIM_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(`line_items.${index}.gst_applicable`)}
                      className="rounded"
                    />
                    GST Applicable
                  </label>
                </div>
              </div>
            </div>
          )
        })}

        {fields.length > 0 && (
          <div className="border-t pt-4 space-y-1 text-right">
            <div className="text-sm">Subtotal: <span className="font-medium">{formatCurrency(subtotal)}</span></div>
            <div className="text-sm">GST: <span className="font-medium">{formatCurrency(gst)}</span></div>
            <div className="text-base font-bold">Total: {formatCurrency(subtotal + gst)}</div>
          </div>
        )}

        {(lineItemErrors as Record<string, { message?: string }> | undefined)?.root && (
          <p className="text-sm text-destructive">
            {(lineItemErrors as Record<string, { message?: string }>).root?.message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
