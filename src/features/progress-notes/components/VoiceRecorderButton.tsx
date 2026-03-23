import { Mic, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'

interface VoiceRecorderButtonProps {
  onTranscript: (text: string) => void
}

export function VoiceRecorderButton({ onTranscript }: VoiceRecorderButtonProps) {
  const { status, startRecording, stopRecording, transcript, duration, error, reset } = useVoiceRecorder()

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (status === 'error') {
    return (
      <div className="text-sm text-destructive">
        {error}
        <Button variant="link" size="sm" onClick={reset} className="ml-1 p-0 h-auto">
          Try again
        </Button>
      </div>
    )
  }

  if (status === 'recording') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-sm font-medium text-red-600">Recording {formatTime(duration)}</span>
        </div>
        <Button variant="destructive" size="sm" onClick={stopRecording}>
          <Square className="h-3.5 w-3.5 mr-1" />
          Stop
        </Button>
      </div>
    )
  }

  if (status === 'transcribing') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Transcribing...
      </div>
    )
  }

  if (status === 'done' && transcript) {
    return (
      <div className="space-y-2">
        <div className="rounded-md bg-muted p-3 text-sm">{transcript}</div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              onTranscript(transcript)
              reset()
            }}
          >
            Use Transcript
          </Button>
          <Button variant="outline" size="sm" onClick={reset}>
            Discard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={startRecording} type="button">
      <Mic className="h-4 w-4 mr-1" />
      Voice Note
    </Button>
  )
}
