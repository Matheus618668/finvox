import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseTransactionFromText, transcribeAudio } from '@/lib/gemini'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ZAPBOT_SECRET = process.env.ZAPBOT_SECRET!
const FINVOX_USER_ID = process.env.FINVOX_USER_ID!

export async function POST(req: NextRequest) {
  // Valida token
  const auth = req.headers.get('authorization')
  if (!auth || auth !== `Bearer ${ZAPBOT_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    let text: string

    // Modo áudio: base64
    if (body.audio && body.mimeType) {
      const buffer = Buffer.from(body.audio, 'base64')
      text = await transcribeAudio(buffer, body.mimeType)
    } else if (body.text) {
      text = body.text
    } else {
      return NextResponse.json({ error: 'Envie text ou audio.' }, { status: 400 })
    }

    // Parseia com Gemini
    const parsed = await parseTransactionFromText(text)

    if (parsed.type === 'unknown' || !parsed.amount) {
      return NextResponse.json({
        ok: false,
        message: 'Não consegui identificar um lançamento financeiro nessa mensagem.',
        transcript: text,
      })
    }

    // Busca categoria sugerida
    let category_id: string | null = null
    if (parsed.category_suggestion) {
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name')
        .or(`user_id.eq.${FINVOX_USER_ID},user_id.is.null`)
        .ilike('name', `%${parsed.category_suggestion}%`)
        .limit(1)

      if (cats && cats.length > 0) category_id = cats[0].id
    }

    // Salva transação
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase.from('transactions').insert({
      user_id: FINVOX_USER_ID,
      type: parsed.type,
      amount: parsed.amount,
      description: parsed.description,
      date: parsed.date || today,
      category_id,
      voice_input: text,
      notes: '📱 Lançado via WhatsApp/Zapia',
    }).select().single()

    if (error) throw error

    const emoji = parsed.type === 'income' ? '💚' : '🔴'
    const sinal = parsed.type === 'income' ? '+' : '-'
    const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsed.amount)
    const data_fmt = new Date(parsed.date || today + 'T12:00:00').toLocaleDateString('pt-BR')

    return NextResponse.json({
      ok: true,
      message: `${emoji} Lançado no FinVox!\n*${parsed.description}*\n${sinal}${valor} • ${data_fmt}${category_id ? '' : '\n_Sem categoria_'}`,
      transaction: data,
      transcript: text,
    })

  } catch (err: any) {
    console.error('[zapbot]', err)
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
