import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { useAuth } from '@/providers/AuthProvider'
import { getInitials } from '@/lib/formatters'
import {
  useThreadMessages,
  useMessageThreads,
  useSendMessage,
  useMarkThreadRead,
} from '../hooks/useMessages'

interface ThreadViewProps {
  threadId: string
}

function formatMessageDate(dateStr: string) {
  const date = new Date(dateStr)
  if (isToday(date)) return format(date, 'h:mm a')
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`
  return format(date, 'dd MMM h:mm a')
}

export function ThreadView({ threadId }: ThreadViewProps) {
  const { profile } = useAuth()
  const { data: messages = [] } = useThreadMessages(threadId)
  const { data: threads = [] } = useMessageThreads()
  const sendMessage = useSendMessage()
  const markRead = useMarkThreadRead()
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const thread = threads.find((t) => t.id === threadId)

  // Mark thread as read when opened
  useEffect(() => {
    markRead.mutate(threadId)
  }, [threadId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  function handleSend() {
    const trimmed = newMessage.trim()
    if (!trimmed) return

    sendMessage.mutate({ thread_id: threadId, content: trimmed })
    setNewMessage('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div>
          <h3 className="text-sm font-semibold">{thread?.subject ?? 'Thread'}</h3>
          {thread && (
            <p className="text-xs text-muted-foreground">
              {thread.participants.map((p) => p.full_name).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === profile?.id

          return (
            <div
              key={msg.id}
              className={cn('flex gap-2 max-w-[80%]', isOwn && 'ml-auto flex-row-reverse')}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {getInitials(
                    msg.sender_name.split(' ')[0] ?? '',
                    msg.sender_name.split(' ').slice(1).join(' ') ?? ''
                  )}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className={cn('text-xs font-medium', isOwn && 'text-right w-full')}>
                    {isOwn ? 'You' : msg.sender_name}
                  </span>
                </div>
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm mt-0.5',
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <p
                  className={cn(
                    'text-[10px] text-muted-foreground mt-0.5',
                    isOwn && 'text-right'
                  )}
                >
                  {formatMessageDate(msg.created_at)}
                  {msg.is_edited && ' (edited)'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Message input */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            className="min-h-[40px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
