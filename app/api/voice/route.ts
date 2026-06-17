import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio, parseTransactionFromText } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const body = await req.json()

      // Modo 1: áudio em base64 → transcrever + parsear
      if (body.mode === 'transcribe_and_parse' && body.audio) {
        const buffer   = Buffer.from(body.audio, 'base64')
        const mimeType = body.mimeType || 'audio/webm'
        const transcript = await transcribeAudio(buffer, mimeType)
        const parsed     = await parseTransactionFromText(transcript)
        return NextResponse.json({ transcript, ...parsed })
      }

      // Modo 2: texto já transcrito → só parsear
      if (body.mode === 'parse' && body.text) {
        const parsed = await parseTransactionFromText(body.text)
        return NextResponse.json(parsed)
      }
    }

    // Modo 3: multipart (legado)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const audioFile = formData.get('audio') as File
      if (!audioFile) return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 400 })
      const buffer   = Buffer.from(await audioFile.arrayBuffer())
      const mimeType = audioFile.type || 'audio/webm'
      const transcript = await transcribeAudio(buffer, mimeType)
      const parsed     = await parseTransactionFromText(transcript)
      return NextResponse.json({ transcript, ...parsed })
    }

    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })

  } catch (err: any) {
    console.error('[voice API]', err)

    // Erros conhecidos com mensagem amigável
    const code = err?.code
    if (code === 429) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido. Aguarde alguns segundos e tente de novo.' },
        { status: 429 }
      )
    }
    if (code === 503) {
      return NextResponse.json(
        { error: 'Serviço temporariamente indisponível. Tente de novo em instantes.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: 'Erro ao processar áudio. Tente de novo.' }, { status: 500 })
  }
}
