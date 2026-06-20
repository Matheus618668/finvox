import { VoiceParseResult } from '@/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

const MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
]

async function callModel(model: string, contents: any[]): Promise<string> {
  // A URL correta deve ter o 'models/' antes do nome, mas fora do parâmetro se usarmos o path direto
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const code = err?.error?.code ?? res.status
    const message = err?.error?.message ?? 'Unknown error'
    console.error(`[gemini] Error ${code} on ${model}:`, message)
    throw Object.assign(new Error(`Gemini ${model} error ${code}`), { code, message, retryable: code === 429 || code === 503 || code === 404 })
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
      console.warn(`[gemini] ${model} falhou (${err.code}), tentando próximo...`)
      if (err.code === 404 || err.code === 400) continue 
      if (!err.retryable) throw err
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

  const prompt = `Você é um assistente financeiro inteligente. Extraia os dados da transação do texto abaixo.
Hoje é ${today}. Ontem foi ${yesterday}.

Responda APENAS com JSON válido, sem markdown:
{"type":"income|expense|unknown","amount":numero_ou_null,"description":"descrição curta","category_suggestion":"categoria em português ou null","date":"YYYY-MM-DD ou null"}

Regras de Categoria Inteligente:
- Se for transporte (Uber, 99, Táxi, Combustível, Estacionamento) → use "Transporte"
- Se for comida (Ifood, Restaurante, Mercado, Lanche, Pizza, Café) → use "Alimentação"
- Se for lazer (Netflix, Cinema, Spotify, Show, Bar, Viagem) → use "Lazer"
- Se for casa (Aluguel, Luz, Água, Internet, Condomínio, Faxina) → use "Casa"
- Se for saúde (Farmácia, Médico, Dentista, Exame) → use "Saúde"
- Se for salário (Pix recebido, Salário, Bônus, Dividendos) → use "Salário"

Regras Gerais:
- "gastei","paguei","comprei","saiu" → expense
- "recebi","ganhei","entrou","depositei" → income
- Extraia só o número do valor (ignore "reais","R$","conto","real")
- description: máximo 50 caracteres (Ex: "Uber para o trabalho")
- Se não mencionar data → use ${today}

Texto: "${text}"`

  const raw = await callGemini([{ parts: [{ text: prompt }] }])

  try {
    const clean  = raw.replace(/\`\`\`json|\`\`\`/g, '').trim()
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
