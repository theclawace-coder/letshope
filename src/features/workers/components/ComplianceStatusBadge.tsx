import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { COMPLIANCE_COLORS } from '../constants'
import type { ComplianceLevel } from '../hooks/useWorkerCompliance'

interface ComplianceStatusBadgeProps {
  status: ComplianceLevel
  className?: string
}

const labels: Record<ComplianceLevel, string> = {
  green: 'Compliant',
  amber: 'At Risk',
  red: 'Non-Compliant',
}

export function ComplianceStatusBadge({ status, className }: ComplianceStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn('font-medium', COMPLIANCE_COLORS[status], className)}
    >
      <span className={cn(
        'inline-block h-2 w-2 rounded-full mr-1.5',
        status === 'green' && 'bg-green-600',
        status === 'amber' && 'bg-amber-600',
        status === 'red' && 'bg-red-600',
      )} />
      {labels[status]}
    </Badge>
  )
}
