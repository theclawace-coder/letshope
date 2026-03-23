import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type RecordingStatus = 'idle' | 'recording' | 'transcribing' | 'done' | 'error'

interface UseVoiceRecorderReturn {
  status: RecordingStatus
  startRecording: () => Promise<void>
  stopRecording: () => void
  transcript: string | null
  duration: number
  error: string | null
  reset: () => void
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [transcript, setTranscript] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const getMimeType = useCallback(() => {
    if (typeof MediaRecorder === 'undefined') return null
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm'
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4'
    if (MediaRecorder.isTypeSupported('audio/ogg')) return 'audio/ogg'
    return null
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setTranscript(null)
      setDuration(0)
      chunksRef.current = []

      const mimeType = getMimeType()
      if (!mimeType) {
        setError('Audio recording is not supported in this browser')
        setStatus('error')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null

        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        const blob = new Blob(chunksRef.current, { type: mimeType })
        await transcribeAudio(blob, mimeType)
      }

      recorder.start(1000) // Collect in 1s chunks
      setStatus('recording')

      // Start duration timer
      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording'
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setError('Microphone access denied. Please allow microphone access in your browser settings.')
      } else {
        setError(message)
      }
      setStatus('error')
    }
  }, [getMimeType])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const transcribeAudio = async (blob: Blob, mimeType: string) => {
    setStatus('transcribing')

    try {
      // Upload audio to Supabase Storage
      const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'ogg'
      const fileName = `recording_${Date.now()}.${ext}`
      const filePath = `recordings/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(filePath, blob, { contentType: mimeType })

      if (uploadError) {
        // Storage bucket might not exist yet — fall back gracefully
        toast.info('Voice recording captured. Audio storage not configured yet.', {
          description: 'Please type your note content manually.',
        })
        setStatus('done')
        return
      }

      // Call edge function for transcription
      const { data, error: fnError } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioPath: filePath },
      })

      if (fnError || !data?.text) {
        toast.info('Voice recording saved. Transcription unavailable.', {
          description: data?.error || 'Configure OpenAI API key in Supabase secrets to enable transcription.',
        })
        setStatus('done')
        return
      }

      setTranscript(data.text)
      setStatus('done')
      toast.success('Audio transcribed successfully')
    } catch {
      toast.info('Voice recording captured. Transcription service unavailable.', {
        description: 'Please type your note content manually.',
      })
      setStatus('done')
    }
  }

  const reset = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    chunksRef.current = []
    setStatus('idle')
    setTranscript(null)
    setDuration(0)
    setError(null)
  }, [])

  return { status, startRecording, stopRecording, transcript, duration, error, reset }
}
