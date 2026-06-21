import { VoiceParseResult } from '@/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

// Apenas o modelo que temos certeza que funciona na v1beta
const MODELS = ['gemini-1.5-flash']

async function callModel(model: string, contents: any[]): Promise<string> {
  // Construção manual da URL sem concatenar 'models/' no parâmetro, usando o path completo
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + GEMINI_API_KEY
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const code = err?.error?.code ?? res.status
    const message = err?.error?.message ?? 'Unknown error'
    console.error('[gemini] Error ' + code + ': ' + message)
    throw Object.assign(new Error('Gemini error ' + code), { code, message })
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function callGemini(contents: any[]): Promise<string> {
  let lastError: any
  for (const model of MODELS) {
    try {
      return await callModel(model, contents)
    } catch (err: any) {
      lastError = err
      if (err.code === 404 || err.code === 400) continue
      throw err
    }
  }
  throw lastError
}

function normalizeMimeType(mimeType: string): string {
  if (mimeType.includes('x-m4a') || mimeType.includes('m4a')) return 'audio/mp4'
  if (mimeType.includes('webm')) return 'audio/webm'
  if (mimeType.includes('ogg'))  return 'audio/ogg'
  return mimeType.split(';')[0]
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType = 'audio/webm'): Promise<string> {
  const base64 = audioBuffer.toString('base64')
  const type   = normalizeMimeType(mimeType)

  const text = await callGemini([
    {
      parts: [
        { inlineData: { mimeType: type, data: base64 } },
        { text: 'Transcreva o áudio em português. Retorne APENAS o texto falado, sem explicações.' },
      ],
    },
  ])

  return text.trim()
}

export async function parseTransactionFromText(text: string): Promise<VoiceParseResult> {
  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const prompt = 'Você é um assistente financeiro inteligente. Extraia os dados da transação do texto abaixo.
' +
    'Hoje é ' + today + '. Ontem foi ' + yesterday + '.

' +
    'Responda APENAS com JSON válido, sem markdown:
' +
    '{"type":"income|expense|unknown","amount":numero_ou_null,"description":"descrição curta","category_suggestion":"categoria em português ou null","date":"YYYY-MM-DD ou null"}

' +
    'Texto: "' + text + '"'

  const raw = await callGemini([{ parts: [{ text: prompt }] }])

  try {
    const clean  = raw.replace(//g, '').trim()
    const parsed = JSON.parse(clean)
    return { ...parsed, raw: text }
  } catch {
    return {
      type: 'unknown',
      amount: null,
      description: text,
      category_suggestion: null,
      date: today,
      raw: text,
    }
  }
}
