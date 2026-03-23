import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Sparkles, BookOpen, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { ChatMessage } from '../components/ChatMessage'
import { ChatInput } from '../components/ChatInput'
import { ConversationList } from '../components/ConversationList'
import {
  useConversations,
  useMessages,
  useAskAiBuddy,
  useDeleteConversation,
  useTogglePinConversation,
  useSuggestedQuestions,
} from '../hooks/useAiBuddy'

export function AiBuddyPage() {
  const [activeConversationId, setActiveConversationId] = useState<string>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations = [] } = useConversations()
  const { data: messages = [] } = useMessages(activeConversationId)
  const { data: suggestedQuestions = [] } = useSuggestedQuestions()
  const deleteConversation = useDeleteConversation()
  const togglePin = useTogglePinConversation()
  const askAiBuddy = useAskAiBuddy()

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(
    async (question: string) => {
      const result = await askAiBuddy.mutateAsync({
        question,
        conversationId: activeConversationId,
      })
      if (!activeConversationId && result.conversationId) {
        setActiveConversationId(result.conversationId)
      }
    },
    [activeConversationId, askAiBuddy]
  )

  const handleNewConversation = useCallback(async () => {
    setActiveConversationId(undefined)
  }, [])

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation.mutateAsync(id)
      if (activeConversationId === id) {
        setActiveConversationId(undefined)
      }
    },
    [activeConversationId, deleteConversation]
  )

  const handleTogglePin = useCallback(
    async (id: string, pinned: boolean) => {
      await togglePin.mutateAsync({ id, is_pinned: pinned })
    },
    [togglePin]
  )

  const handleSuggestedQuestion = useCallback(
    (question: string) => {
      handleSend(question)
    },
    [handleSend]
  )

  const showWelcome = !activeConversationId && messages.length === 0

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <PageHeader
        title="AI Buddy"
        description="Your NDIS policy and compliance assistant. Ask questions about practice standards, procedures, and regulations."
      />

      <div className="flex flex-1 overflow-hidden rounded-lg border mx-6 mb-6">
        {/* Conversation sidebar */}
        <div className="w-64 shrink-0 hidden md:block">
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={setActiveConversationId}
            onNew={handleNewConversation}
            onDelete={handleDeleteConversation}
            onTogglePin={handleTogglePin}
          />
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col min-w-0">
          {showWelcome ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Hi! I'm your AI Buddy</h2>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
                I can help you find answers from NDIS Practice Standards, your internal policies,
                compliance requirements, and more. Just ask a question!
              </p>

              {/* Suggested questions */}
              {suggestedQuestions.length > 0 && (
                <div className="w-full max-w-2xl">
                  <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Suggested questions
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestedQuestion(q)}
                        disabled={askAiBuddy.isPending}
                        className="flex items-start gap-2.5 rounded-xl border bg-card p-3 text-left text-sm hover:bg-muted/80 transition-colors disabled:opacity-50"
                      >
                        <BookOpen className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Info card */}
              <Card className="mt-8 max-w-md">
                <CardContent className="flex items-start gap-3 pt-4">
                  <ExternalLink className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">How it works</p>
                    <p>
                      AI Buddy searches your uploaded NDIS policy documents using semantic search,
                      then generates an answer grounded in those sources. All responses include
                      source references so you can verify the information.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  sources={msg.sources}
                  createdAt={msg.created_at}
                />
              ))}

              {askAiBuddy.isPending && (
                <div className="flex gap-3 py-4 items-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span>Searching policies & generating answer...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          <ChatInput onSend={handleSend} isLoading={askAiBuddy.isPending} />
        </div>
      </div>
    </div>
  )
}
