import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgressNotes } from '../hooks/useProgressNotes'
import { useParticipants } from '@/features/participants/hooks/useParticipants'
import { useWorkers } from '@/features/workers/hooks/useWorkers'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, FileText, Search, AlertTriangle, Mic } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { REGISTRATION_GROUPS } from '@/lib/constants'

export function ProgressNotesListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [participantFilter, setParticipantFilter] = useState('')
  const [workerFilter, setWorkerFilter] = useState('')

  const { data: notes, isLoading } = useProgressNotes({
    participantId: participantFilter && participantFilter !== 'all' ? participantFilter : undefined,
    workerId: workerFilter && workerFilter !== 'all' ? workerFilter : undefined,
  })
  const { data: participants } = useParticipants()
  const { data: workers } = useWorkers()

  const filtered = notes?.filter((n) => {
    if (!search) return true
    const searchable = `${n.participant_name || ''} ${n.worker_name || ''} ${n.content}`.toLowerCase()
    return searchable.includes(search.toLowerCase())
  })

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Progress Notes"
        description={`${notes?.length ?? 0} notes total`}
        action={
          <Button onClick={() => navigate('/progress-notes/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={participantFilter} onValueChange={(v) => setParticipantFilter(v || '')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Participants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Participants</SelectItem>
                {participants?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={workerFilter} onValueChange={(v) => setWorkerFilter(v || '')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Workers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workers</SelectItem>
                {workers?.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.first_name} {w.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!filtered?.length ? (
            <EmptyState
              icon={FileText}
              title="No progress notes yet"
              description="Create your first progress note to start recording participant interactions."
              action={
                <Button onClick={() => navigate('/progress-notes/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Progress Note
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((note) => (
                  <TableRow key={note.id} className="cursor-pointer">
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatDate(note.note_date)}
                    </TableCell>
                    <TableCell>{note.participant_name || '-'}</TableCell>
                    <TableCell>{note.worker_name || '-'}</TableCell>
                    <TableCell>
                      {note.service_type ? (
                        <Badge variant="outline" className="text-xs">
                          {REGISTRATION_GROUPS[note.service_type]?.name || note.service_type}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{note.content}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {note.concern_flagged && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                        {note.is_transcribed && (
                          <Mic className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
