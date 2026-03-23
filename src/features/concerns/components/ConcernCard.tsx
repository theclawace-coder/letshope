import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/formatters'
import type { ConcernWithNames } from '../hooks/useConcerns'

interface ConcernCardProps {
  concern: ConcernWithNames
  onClick?: () => void
}

export function ConcernCard({ concern, onClick }: ConcernCardProps) {
  return (
    <Card
      className={onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={concern.severity} />
              <span className="text-sm capitalize text-muted-foreground">
                {concern.concern_type}
              </span>
              <StatusBadge status={concern.status} />
            </div>
            <p className="text-sm font-medium">{concern.title}</p>
            {concern.participant_name && (
              <p className="text-sm text-muted-foreground">
                Participant: {concern.participant_name}
              </p>
            )}
            <p className="text-sm line-clamp-2 text-muted-foreground">{concern.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Raised {formatDate(concern.created_at)}
              {concern.raised_by_name && ` by ${concern.raised_by_name}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
