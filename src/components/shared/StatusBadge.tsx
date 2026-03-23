import { Badge } from '@/components/ui/badge'
import { PARTICIPANT_STATUS_COLORS, CONCERN_STATUS_COLORS, INCIDENT_STATUS_COLORS, COMPLAINT_STATUS_COLORS, RISK_STATUS_COLORS, SERVICE_AGREEMENT_STATUS_COLORS, NDIS_PLAN_STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const WORKER_STATUS_COLORS: Record<string, string> = {
  onboarding: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  terminated: 'bg-red-100 text-red-800',
}

const BOOKING_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-emerald-100 text-emerald-800',
  checked_out: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  no_show: 'bg-red-100 text-red-800',
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

const INCIDENT_SEVERITY_COLORS: Record<string, string> = {
  minor: 'bg-blue-100 text-blue-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  major: 'bg-orange-100 text-orange-800',
}

const MITIGATION_STATUS_COLORS: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

const POLICY_VERSION_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-blue-100 text-blue-800',
  current: 'bg-green-100 text-green-800',
  superseded: 'bg-gray-100 text-gray-500',
}

const ALL_COLORS: Record<string, string> = {
  ...PARTICIPANT_STATUS_COLORS,
  ...WORKER_STATUS_COLORS,
  ...BOOKING_STATUS_COLORS,
  ...CONCERN_STATUS_COLORS,
  ...INCIDENT_STATUS_COLORS,
  ...COMPLAINT_STATUS_COLORS,
  ...RISK_STATUS_COLORS,
  ...SERVICE_AGREEMENT_STATUS_COLORS,
  ...NDIS_PLAN_STATUS_COLORS,
  ...SEVERITY_COLORS,
  ...INCIDENT_SEVERITY_COLORS,
  ...MITIGATION_STATUS_COLORS,
  ...POLICY_VERSION_STATUS_COLORS,
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = ALL_COLORS[status as string] || 'bg-gray-100 text-gray-800'

  return (
    <Badge
      variant="secondary"
      className={cn('capitalize font-medium', colorClass, className)}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
