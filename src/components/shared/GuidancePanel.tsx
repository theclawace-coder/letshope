import { cn } from '@/lib/utils'
import { Lightbulb, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface GuidancePanelProps {
  title: string
  content: string
  policyRef?: string
  open: boolean
  onClose: () => void
}

export function GuidancePanel({ title, content, policyRef, open, onClose }: GuidancePanelProps) {
  return (
    <div
      className={cn(
        'fixed right-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-80 border-l bg-background shadow-lg transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold text-sm">Guidance</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100%-3rem)] p-4">
        <h3 className="font-semibold mb-2">{title}</h3>
        <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {content}
        </div>
        {policyRef && (
          <div className="mt-4 rounded-md bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground">Policy Reference</p>
            <p className="text-sm font-medium mt-1">{policyRef}</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
