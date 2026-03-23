import { cn } from '@/lib/utils'

interface BudgetBarProps {
  label: string
  allocated: number
  used: number
  colorClass?: string
}

export function BudgetBar({ label, allocated, used, colorClass = 'bg-primary' }: BudgetBarProps) {
  const percentage = allocated > 0 ? Math.min(Math.round((used / allocated) * 100), 100) : 0
  const remaining = Math.max(allocated - used, 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          ${used.toLocaleString('en-AU', { minimumFractionDigits: 2 })} of ${allocated.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            percentage >= 90 ? 'bg-destructive' : percentage >= 70 ? 'bg-yellow-500' : colorClass
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{percentage}% used</span>
        <span>${remaining.toLocaleString('en-AU', { minimumFractionDigits: 2 })} remaining</span>
      </div>
    </div>
  )
}
