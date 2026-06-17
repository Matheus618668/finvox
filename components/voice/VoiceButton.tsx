'use client'

import { useVoice } from '@/hooks/useVoice'
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { VoiceParseResult } from '@/types'
import toast from 'react-hot-toast'

interface VoiceButtonProps {
  onParsed: (result: VoiceParseResult) => void
  className?: string
}

export default function VoiceButton({ onParsed, className }: VoiceButtonProps) {
  const [parsing, setParsing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { state, transcript, startRecording, stopRecording, reset, error } = useVoice(async (text) => {
    setParsing(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode: 'parse' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao processar')
      onParsed(data)
    } catch (err: any) {
      const msg = err.message || 'Erro ao processar áudio'
      setErrorMsg(msg)
      toast.error(msg, { duration: 4000 })
    } finally {
      setParsing(false)
    }
  })

  const isRecording  = state === 'recording'
  const isProcessing = state === 'processing' || parsing
  const isDone       = state === 'done' && !parsing && !errorMsg
  const isError      = state === 'error' || !!errorMsg

  function handleClick() {
    if (isError || isDone) { reset(); setErrorMsg(null); return }
    if (isRecording) { stopRecording(); return }
    startRecording()
  }

  const displayError = errorMsg || error

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className={cn(
          'relative w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg',
          isRecording  && 'bg-red-500 scale-110',
          isProcessing && 'bg-yellow-500/80 cursor-wait',
          isDone       && 'bg-primary-500',
          isError      && 'bg-red-600',
          !isRecording && !isProcessing && !isDone && !isError
            && 'bg-primary-500 hover:bg-primary-600 active:scale-95'
        )}
      >
        {isProcessing && <Loader2 className="w-7 h-7 text-white animate-spin" />}
        {isRecording  && <MicOff  className="w-7 h-7 text-white" />}
        {isDone       && <CheckCircle className="w-7 h-7 text-white" />}
        {isError      && <RefreshCw className="w-7 h-7 text-white" />}
        {!isRecording && !isProcessing && !isDone && !isError &&
          <Mic className="w-7 h-7 text-white" />
        }
        {isRecording && (
          <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-60" />
        )}
      </button>

      <p className="text-xs text-center max-w-[200px]">
        {isRecording  && <span className="text-red-400">Fale agora… clique para parar</span>}
        {isProcessing && <span className="text-yellow-400">Processando…</span>}
        {isDone       && <span className="text-primary-400">Pronto! Clique para gravar de novo</span>}
        {isError      && <span className="text-red-400">Toque para tentar de novo</span>}
        {!isRecording && !isProcessing && !isDone && !isError &&
          <span className="text-dark-400">Clique para falar</span>
        }
      </p>

      {isError && displayError && (
        <p className="text-xs text-red-400/80 italic text-center max-w-xs">
          {displayError}
        </p>
      )}

      {transcript && !isError && (
        <p className="text-xs text-dark-400 italic text-center max-w-xs">
          "{transcript}"
        </p>
      )}
    </div>
  )
}
