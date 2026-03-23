import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Eye, Download, Printer, Share2, Mail, GitBranch,
  RefreshCw, FolderInput, Archive, RotateCcw, Loader2, Activity,
} from 'lucide-react'
import { useDocumentAccessLog } from '../hooks/useDocumentAccessLog'
import { formatDate } from '@/lib/formatters'

const ACTION_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  viewed: { icon: Eye, label: 'Viewed', color: 'bg-blue-100 text-blue-800' },
  downloaded: { icon: Download, label: 'Downloaded', color: 'bg-green-100 text-green-800' },
  printed: { icon: Printer, label: 'Printed', color: 'bg-purple-100 text-purple-800' },
  shared: { icon: Share2, label: 'Shared', color: 'bg-indigo-100 text-indigo-800' },
  emailed: { icon: Mail, label: 'Emailed', color: 'bg-cyan-100 text-cyan-800' },
  version_created: { icon: GitBranch, label: 'New Version', color: 'bg-violet-100 text-violet-800' },
  status_changed: { icon: RefreshCw, label: 'Status Changed', color: 'bg-amber-100 text-amber-800' },
  moved: { icon: FolderInput, label: 'Moved', color: 'bg-teal-100 text-teal-800' },
  archived: { icon: Archive, label: 'Archived', color: 'bg-gray-100 text-gray-800' },
  restored: { icon: RotateCcw, label: 'Restored', color: 'bg-emerald-100 text-emerald-800' },
}

interface DocumentAccessLogProps {
  documentId: string
}

export function DocumentAccessLog({ documentId }: DocumentAccessLogProps) {
  const { data: logs, isLoading } = useDocumentAccessLog(documentId)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !logs?.length ? (
          <p className="text-sm text-muted-foreground py-2">
            No activity recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action] || {
                icon: Activity,
                label: log.action,
                color: 'bg-gray-100 text-gray-800',
              }
              const ActionIcon = config.icon

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg border p-2.5 text-sm"
                >
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <ActionIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`text-[10px] ${config.color}`}>
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    {log.profiles && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {log.profiles.full_name}
                      </p>
                    )}
                    {log.metadata && typeof log.metadata === 'object' && 'old_status' in (log.metadata as Record<string, unknown>) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {String((log.metadata as Record<string, unknown>).old_status).replace(/_/g, ' ')} &rarr;{' '}
                        {String((log.metadata as Record<string, unknown>).new_status).replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
