import { Card, CardContent } from '@/components/ui/card'
import { usePortalAuth, usePortalNotes } from '../hooks/usePortal'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate } from '@/lib/formatters'
import { FileText } from 'lucide-react'

export function PortalNotesPage() {
  const { session } = usePortalAuth()
  const notes = usePortalNotes(session?.participantId)

  if (notes.isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Progress Notes
        </h1>
        <p className="text-muted-foreground mt-1">
          Notes from your support sessions with Hope Disability Support.
        </p>
      </div>

      {!notes.data || notes.data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No progress notes yet"
          description="Progress notes will appear here after your support sessions."
        />
      ) : (
        <div className="space-y-4">
          {notes.data.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold">{formatDate(note.note_date)}</h3>
                    <p className="text-sm text-muted-foreground">{note.worker_name}</p>
                  </div>
                  {note.service_type && (
                    <span className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                      {note.service_type}
                    </span>
                  )}
                </div>

                {note.presentation && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Presentation</p>
                    <p className="text-sm">{note.presentation}</p>
                  </div>
                )}

                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Session Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>

                {note.actions_taken && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Actions Taken</p>
                    <p className="text-sm">{note.actions_taken}</p>
                  </div>
                )}

                {note.goals_addressed.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Goals Addressed</p>
                    <div className="flex flex-wrap gap-1">
                      {note.goals_addressed.map((goal, i) => (
                        <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
