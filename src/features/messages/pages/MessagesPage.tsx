import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useMessageThreads } from '../hooks/useMessages'
import { NewThreadDialog } from '../components/NewThreadDialog'
import { ThreadView } from '../components/ThreadView'

export function MessagesPage() {
  const { data: threads = [], isLoading } = useMessageThreads()
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [showNewThread, setShowNewThread] = useState(false)

  const totalUnread = threads.reduce((sum, t) => sum + t.unread_count, 0)

  return (
    <div>
      <PageHeader
        title="Messages"
        description={`Internal communication hub${totalUnread > 0 ? ` \u2022 ${totalUnread} unread` : ''}`}
        action={
          <Button onClick={() => setShowNewThread(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Thread
          </Button>
        }
      />

      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* Thread list */}
        <div className="w-80 shrink-0 border rounded-lg overflow-hidden flex flex-col bg-card">
          <div className="p-3 border-b bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Conversations ({threads.length})
            </p>
          </div>

          {isLoading ? (
            <LoadingState />
          ) : threads.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={cn(
                    'p-3 cursor-pointer hover:bg-muted/50 transition-colors',
                    selectedThreadId === thread.id && 'bg-muted'
                  )}
                  onClick={() => setSelectedThreadId(thread.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        'text-sm truncate',
                        thread.unread_count > 0 && 'font-semibold'
                      )}
                    >
                      {thread.subject}
                    </p>
                    {thread.unread_count > 0 && (
                      <Badge variant="destructive" className="shrink-0 h-5 px-1.5 text-[10px]">
                        {thread.unread_count}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {thread.participants
                        .map((p) => p.full_name.split(' ')[0])
                        .join(', ')}
                    </p>
                  </div>

                  {thread.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      <span className="font-medium">
                        {thread.last_message.sender_name.split(' ')[0]}:
                      </span>{' '}
                      {thread.last_message.content}
                    </p>
                  )}

                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(thread.last_message_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message area */}
        <div className="flex-1 border rounded-lg overflow-hidden bg-card">
          {selectedThreadId ? (
            <ThreadView threadId={selectedThreadId} />
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="Select a conversation"
              description="Choose a thread from the left or start a new one."
            />
          )}
        </div>
      </div>

      <NewThreadDialog
        open={showNewThread}
        onOpenChange={setShowNewThread}
        onCreated={(threadId) => {
          setSelectedThreadId(threadId)
          setShowNewThread(false)
        }}
      />
    </div>
  )
}
