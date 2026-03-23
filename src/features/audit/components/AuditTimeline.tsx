import type { AuditLogWithUser } from '../hooks/useAuditLogs'
import { formatDateTime } from '@/lib/formatters'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Json } from '@/lib/types'

const ACTION_CONFIG = {
  insert: { icon: Plus, label: 'Created', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' },
  update: { icon: Pencil, label: 'Updated', color: 'bg-blue-100 text-blue-800', dotColor: 'bg-blue-500' },
  delete: { icon: Trash2, label: 'Deleted', color: 'bg-red-100 text-red-800', dotColor: 'bg-red-500' },
} as const

// Fields to hide from the diff display
const HIDDEN_FIELDS = new Set(['id', 'created_at', 'updated_at', 'created_by', 'logged_by'])

function formatFieldName(field: string): string {
  return field.replace(/_/g, ' ').replace(/\bid\b/g, 'ID')
}

function formatValue(value: Json): string {
  if (value === null || value === undefined) return 'empty'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

interface AuditTimelineProps {
  logs: AuditLogWithUser[]
  compact?: boolean
}

export function AuditTimeline({ logs, compact = false }: AuditTimelineProps) {
  if (!logs.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No audit history available.
      </p>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {logs.map((log) => {
          const config = ACTION_CONFIG[log.action as keyof typeof ACTION_CONFIG] ?? ACTION_CONFIG.update
          const Icon = config.icon
          const changes = (log.changes ?? {}) as Record<string, { old?: Json; new?: Json } | Json>

          // For updates, show changed fields
          const changedFields = log.action === 'update'
            ? Object.entries(changes).filter(([key]) => !HIDDEN_FIELDS.has(key))
            : []

          return (
            <div key={log.id} className="relative pl-8">
              <div className={cn('absolute left-1.5 top-1.5 w-3 h-3 rounded-full', config.dotColor)} />

              <div className={cn('rounded-md border p-3', compact && 'p-2')}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <Badge variant="secondary" className={cn('text-xs', config.color)}>
                    {config.label}
                  </Badge>
                  <span className="text-sm font-medium capitalize">
                    {(log.entity_type ?? '').replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {log.user_name} &middot; {formatDateTime(log.created_at)}
                  </span>
                </div>

                {!compact && changedFields.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {changedFields.slice(0, 8).map(([field, change]) => {
                      const typedChange = change as { old?: Json; new?: Json }
                      return (
                        <div key={field} className="text-xs text-muted-foreground">
                          <span className="font-medium capitalize">{formatFieldName(field)}</span>
                          {': '}
                          {typedChange.old !== undefined && (
                            <>
                              <span className="line-through text-red-500">{formatValue(typedChange.old)}</span>
                              {' → '}
                            </>
                          )}
                          {typedChange.new !== undefined && (
                            <span className="text-green-600">{formatValue(typedChange.new)}</span>
                          )}
                        </div>
                      )
                    })}
                    {changedFields.length > 8 && (
                      <p className="text-xs text-muted-foreground">
                        +{changedFields.length - 8} more fields
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
