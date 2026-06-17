import OpenAI from 'openai'
import { VoiceParseResult } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Transcreve um arquivo de áudio usando Whisper
 */
export async function transcribeAudio(audioBuffer: Buffer, filename = 'audio.webm'): Promise<string> {
  const file = new File([audioBuffer], filename, { type: 'audio/webm' })
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'pt',
  })
  return transcription.text
}

/**
 * Interpreta o texto transcrito e extrai dados de transação
 * Exemplos de entrada:
 *   "gastei 50 reais no mercado"
 *   "recebi 3000 de salário hoje"
 *   "paguei 120 de conta de luz ontem"
 */
export async function parseTransactionFromText(text: string): Promise<VoiceParseResult> {
  const today = new Date().toISOString().split('T')[0]

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Você é um assistente financeiro que extrai dados de transações a partir de texto em português.
Hoje é ${today}.
Responda SEMPRE em JSON com este formato exato:
{
  "type": "income" | "expense" | "unknown",
  "amount": número ou null,
  "description": "descrição limpa da transação",
  "category_suggestion": "categoria sugerida em português ou null",
  "date": "YYYY-MM-DD ou null"
}
Regras:
- Se a pessoa disser "gastei", "paguei", "comprei" → type = "expense"
- Se a pessoa disser "recebi", "ganhei", "entrou" → type = "income"
- Extraia o valor numérico (ignore "reais", "R$", etc.)
- Se mencionar "hoje" → date = hoje; "ontem" → date = ontem; "semana passada" → calcule
- description deve ser curta e clara (máximo 50 chars)`,
      },
      { role: 'user', content: text },
    ],
  })

  try {
    const parsed = JSON.parse(response.choices[0].message.content || '{}')
    return { ...parsed, raw: text }
  } catch {
    return {
      type: 'unknown',
      amount: null,
      description: text,
      category_suggestion: null,
      date: null,
      raw: text,
    }
  }
}
