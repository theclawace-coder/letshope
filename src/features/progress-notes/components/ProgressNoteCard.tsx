import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Mic, FileDown, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { REGISTRATION_GROUPS } from '@/lib/constants'
import { generateProgressNote } from '@/lib/pdf/generate-document'
import { toast } from 'sonner'
import type { ProgressNoteWithNames } from '../hooks/useProgressNotes'

interface ProgressNoteCardProps {
  note: ProgressNoteWithNames
  onClick?: () => void
}

export function ProgressNoteCard({ note, onClick }: ProgressNoteCardProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setExporting(true)
    try {
      await generateProgressNote(note, note.participant_name || 'Unknown', note.worker_name || 'Unknown', { download: true, preview: true, store: false })
      toast.success('Progress note exported')
    } catch {
      toast.error('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card
      className={onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{formatDate(note.note_date)}</span>
              <span className="text-sm text-muted-foreground">by {note.worker_name || 'Unknown'}</span>
              {note.service_type && REGISTRATION_GROUPS[note.service_type] && (
                <Badge variant="outline" className="text-xs">
                  {REGISTRATION_GROUPS[note.service_type].name}
                </Badge>
              )}
              {note.is_transcribed && (
                <Mic className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            {note.participant_name && (
              <p className="text-sm text-muted-foreground">
                Participant: {note.participant_name}
              </p>
            )}
            <p className="text-sm line-clamp-2">{note.content}</p>
            {note.goals_addressed?.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {note.goals_addressed.map((goal, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {goal}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport} disabled={exporting} title="Export PDF">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            </Button>
            {note.concern_flagged && (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
