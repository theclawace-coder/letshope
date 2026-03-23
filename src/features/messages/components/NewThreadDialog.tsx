import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, X } from 'lucide-react'
import { useCreateThread, useStaffMembers } from '../hooks/useMessages'

interface NewThreadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (threadId: string) => void
}

export function NewThreadDialog({ open, onOpenChange, onCreated }: NewThreadDialogProps) {
  const { data: staff = [] } = useStaffMembers()
  const createThread = useCreateThread()

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const filteredStaff = staff.filter(
    (s) =>
      !selectedIds.includes(s.id) &&
      (s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.email?.toLowerCase().includes(search.toLowerCase()) ?? false))
  )

  const selectedStaff = staff.filter((s) => selectedIds.includes(s.id))

  function handleCreate() {
    if (!subject.trim() || !message.trim() || selectedIds.length === 0) return

    createThread.mutate(
      {
        subject: subject.trim(),
        participant_ids: selectedIds,
        initial_message: message.trim(),
      },
      {
        onSuccess: (thread) => {
          setSubject('')
          setMessage('')
          setSelectedIds([])
          setSearch('')
          onCreated(thread.id)
        },
      }
    )
  }

  function reset() {
    setSubject('')
    setMessage('')
    setSelectedIds([])
    setSearch('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Plan review discussion for John"
            />
          </div>

          <div className="space-y-2">
            <Label>Recipients</Label>

            {selectedStaff.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedStaff.map((s) => (
                  <Badge key={s.id} variant="secondary" className="gap-1">
                    {s.full_name}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIds((prev) => prev.filter((id) => id !== s.id))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff..."
                className="pl-8"
              />
            </div>

            <ScrollArea className="h-32 border rounded-md">
              {filteredStaff.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground text-center">
                  {staff.length === 0 ? 'No staff found' : 'No matches'}
                </p>
              ) : (
                <div className="divide-y">
                  {filteredStaff.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedIds((prev) => [...prev, s.id])}
                    >
                      <div>
                        <p className="text-sm">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground">{s.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !subject.trim() ||
              !message.trim() ||
              selectedIds.length === 0 ||
              createThread.isPending
            }
          >
            {createThread.isPending ? 'Creating...' : 'Start Conversation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
