'use client'

import { useCallback, useRef, useState } from 'react'

type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error'

interface UseVoiceReturn {
  state: RecordingState
  transcript: string
  startRecording: () => void
  stopRecording: () => void
  reset: () => void
  error: string | null
}

function getSupportedMimeType(): string {
  const types = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

export function useVoice(onTranscript?: (text: string) => void): UseVoiceReturn {
  const [state, setState] = useState<RecordingState>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    setError(null)
    setTranscript('')
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })

        setState('processing')

        try {
          const arrayBuffer = await blob.arrayBuffer()
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((d, b) => d + String.fromCharCode(b), '')
          )

          const res = await fetch('/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64,
              mimeType: mimeType || 'audio/webm',
              mode: 'transcribe_and_parse',
            }),
          })

          if (!res.ok) throw new Error('Erro ao processar áudio')
          const data = await res.json()

          setTranscript(data.transcript || '')
          onTranscript?.(data.transcript || '')
          setState('done')
        } catch (err: any) {
          setError(err.message || 'Erro ao processar áudio')
          setState('error')
        }
      }

      recorder.start()
      setState('recording')
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Permissão de microfone negada. Habilite nas configurações.')
      } else {
        setError('Não foi possível acessar o microfone.')
      }
      setState('error')
    }
  }, [onTranscript])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    setTranscript('')
    setError(null)
    setState('idle')
  }, [])

  return { state, transcript, startRecording, stopRecording, reset, error }
}
