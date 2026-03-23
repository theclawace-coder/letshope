import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PolicySourceCard } from './PolicySourceCard'
import type { Json } from '@/lib/types'
import type { PolicySource } from '../hooks/useAiBuddy'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  sources?: Json
  createdAt: string
  /** Compact mode for the floating widget */
  compact?: boolean
}

/**
 * Render markdown-style bold links **[Label](/path)** and plain [Label](/path)
 * as clickable <a> tags. Internal links (starting with /) use client-side navigation.
 */
function renderContent(text: string) {
  // Match both **[Label](/path)** and [Label](/path)
  const linkRegex = /\*{0,2}\[([^\]]+)\]\(([^)]+)\)\*{0,2}/g
  const parts: (string | { label: string; href: string })[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push({ label: match[1], href: match[2] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.map((part, i) => {
    if (typeof part === 'string') {
      return <span key={i}>{part}</span>
    }
    const isInternal = part.href.startsWith('/')
    return (
      <a
        key={i}
        href={part.href}
        className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
        {...(isInternal
          ? {} // Internal links handled by click handler on parent
          : { target: '_blank', rel: 'noopener noreferrer' })}
      >
        {part.label}
      </a>
    )
  })
}

export function ChatMessage({ role, content, sources, createdAt, compact }: ChatMessageProps) {
  const isAssistant = role === 'assistant'
  const parsedSources = (Array.isArray(sources) ? sources : []) as unknown as PolicySource[]
  const navigate = useNavigate()

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      if (anchor) {
        const href = anchor.getAttribute('href')
        if (href && href.startsWith('/')) {
          e.preventDefault()
          navigate(href)
        }
      }
    },
    [navigate]
  )

  const avatarSize = compact ? 'h-6 w-6' : 'h-8 w-8'
  const iconSize = compact ? 'h-3 w-3' : 'h-4 w-4'

  return (
    <div
      className={cn(
        'flex gap-3',
        compact ? 'py-2' : 'py-4',
        isAssistant ? 'items-start' : 'items-start justify-end'
      )}
    >
      {isAssistant && (
        <div className={cn('flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground', avatarSize)}>
          <Bot className={iconSize} />
        </div>
      )}

      <div
        className={cn('flex flex-col gap-2 max-w-[80%]', !isAssistant && 'items-end')}
        onClick={handleClick}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 leading-relaxed',
            compact ? 'text-xs' : 'text-sm',
            isAssistant
              ? 'bg-muted text-foreground rounded-tl-sm'
              : 'bg-primary text-primary-foreground rounded-tr-sm'
          )}
        >
          <div className="whitespace-pre-wrap">{renderContent(content)}</div>
        </div>

        {isAssistant && parsedSources.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            <p className="text-xs font-medium text-muted-foreground">Sources referenced:</p>
            {parsedSources.slice(0, compact ? 2 : undefined).map((source, i) => (
              <PolicySourceCard key={i} source={source} />
            ))}
            {compact && parsedSources.length > 2 && (
              <p className="text-[10px] text-muted-foreground">
                +{parsedSources.length - 2} more sources
              </p>
            )}
          </div>
        )}

        <span className="text-[10px] text-muted-foreground">
          {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {!isAssistant && (
        <div className={cn('flex shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground', avatarSize)}>
          <User className={iconSize} />
        </div>
      )}
    </div>
  )
}
