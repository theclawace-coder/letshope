import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bot, X, Minus, Maximize2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'
import {
  useConversations,
  useMessages,
  useAskAiBuddy,
} from '../hooks/useAiBuddy'
import { ROUTE_MAP } from '../lib/routeMap'

export function AiBuddyWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimised, setIsMinimised] = useState(false)
  const [conversationId, setConversationId] = useState<string>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const { data: messages = [] } = useMessages(conversationId)
  const askAiBuddy = useAskAiBuddy()

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const currentPage = ROUTE_MAP.find(
    (r) => location.pathname === r.path || location.pathname.startsWith(r.path + '/')
  )

  const handleSend = useCallback(
    async (question: string) => {
      const result = await askAiBuddy.mutateAsync({
        question,
        conversationId,
        currentPage: currentPage?.label,
      })
      if (!conversationId && result.conversationId) {
        setConversationId(result.conversationId)
      }
    },
    [conversationId, askAiBuddy, currentPage]
  )

  const handleNewChat = useCallback(() => {
    setConversationId(undefined)
  }, [])

  // Intercept internal link clicks in the widget
  const handleWidgetClick = useCallback(
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

  // Don't show on the AI Buddy full page
  if (location.pathname === '/ai-buddy') return null

  const suggestedQuestions = [
    'How do I lodge a complaint?',
    'What are the incident reporting steps?',
    'How do I onboard a new participant?',
  ]

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          aria-label="Open AI Buddy"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {/* Widget panel */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border bg-background shadow-2xl transition-all',
            isMinimised ? 'w-80 h-14' : 'w-[420px] h-[600px]'
          )}
          onClick={handleWidgetClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 rounded-t-2xl bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="text-sm font-semibold">AI Buddy</span>
              {currentPage && !isMinimised && (
                <span className="text-xs opacity-70">
                  — {currentPage.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!isMinimised && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground hover:bg-white/20"
                  onClick={handleNewChat}
                  title="New conversation"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-white/20"
                onClick={() => setIsMinimised(!isMinimised)}
                title={isMinimised ? 'Expand' : 'Minimise'}
              >
                {isMinimised ? <Maximize2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-white/20"
                onClick={() => {
                  setIsOpen(false)
                  setIsMinimised(false)
                }}
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Body */}
          {!isMinimised && (
            <>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-3">
                {messages.length === 0 && !askAiBuddy.isPending ? (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <Bot className="h-10 w-10 text-primary/30 mb-3" />
                    <p className="text-sm font-medium mb-1">Need help?</p>
                    <p className="text-xs text-muted-foreground text-center mb-4">
                      Ask me about policies, procedures, or how to use any feature in Hope OS.
                    </p>
                    <div className="flex flex-col gap-1.5 w-full">
                      {suggestedQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(q)}
                          disabled={askAiBuddy.isPending}
                          className="rounded-lg border bg-muted/50 px-3 py-2 text-left text-xs hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        role={msg.role}
                        content={msg.content}
                        sources={msg.sources}
                        createdAt={msg.created_at}
                        compact
                      />
                    ))}

                    {askAiBuddy.isPending && (
                      <div className="flex gap-2 py-3 items-start">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Bot className="h-3 w-3" />
                        </div>
                        <div className="rounded-xl rounded-tl-sm bg-muted px-3 py-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="flex gap-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
                            </div>
                            <span>Searching...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <ChatInput
                onSend={handleSend}
                isLoading={askAiBuddy.isPending}
                placeholder="Ask about policies or how to use Hope OS..."
              />
            </>
          )}
        </div>
      )}
    </>
  )
}
