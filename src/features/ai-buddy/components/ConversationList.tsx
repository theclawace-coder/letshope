import { MessageSquare, Pin, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { Tables } from '@/lib/types'

type AiConversation = Tables<'ai_conversations'>

interface ConversationListProps {
  conversations: AiConversation[]
  activeId: string | undefined
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onTogglePin: (id: string, pinned: boolean) => void
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onTogglePin,
}: ConversationListProps) {
  const pinned = conversations.filter((c) => c.is_pinned)
  const recent = conversations.filter((c) => !c.is_pinned)

  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-semibold">Conversations</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {pinned.length > 0 && (
            <>
              <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Pinned
              </p>
              {pinned.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onTogglePin={onTogglePin}
                />
              ))}
              <Separator className="my-2" />
            </>
          )}

          {recent.length > 0 && (
            <>
              <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Recent
              </p>
              {recent.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onTogglePin={onTogglePin}
                />
              ))}
            </>
          )}

          {conversations.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              No conversations yet. Ask a question to get started!
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
}: {
  conversation: AiConversation
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string, pinned: boolean) => void
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer transition-colors',
        isActive
          ? 'bg-primary/10 text-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      onClick={() => onSelect(conversation.id)}
    >
      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate text-xs">{conversation.title}</span>
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin(conversation.id, !conversation.is_pinned)
          }}
          className="p-0.5 rounded hover:bg-background"
        >
          <Pin className={cn('h-3 w-3', conversation.is_pinned && 'text-primary')} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(conversation.id)
          }}
          className="p-0.5 rounded hover:bg-background text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
