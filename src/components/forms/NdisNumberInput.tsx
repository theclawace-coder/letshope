import { Input } from '@/components/ui/input'
import { formatNdisNumber } from '@/lib/validators'

interface NdisNumberInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function NdisNumberInput({ value, onChange, error }: NdisNumberInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 9)
    onChange(formatNdisNumber(raw))
  }

  return (
    <div>
      <Input
        placeholder="### ### ###"
        value={value}
        onChange={handleChange}
        maxLength={11}
        className={error ? 'border-destructive' : ''}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}
