import { Input } from '@/components/ui/input'
import { formatPhone } from '@/lib/validators'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
}

export function PhoneInput({ value, onChange, error, placeholder = '04XX XXX XXX' }: PhoneInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10)
    onChange(formatPhone(raw))
  }

  return (
    <div>
      <Input
        type="tel"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        maxLength={12}
        className={error ? 'border-destructive' : ''}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}
