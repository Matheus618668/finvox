'use client'

import { useState, useEffect } from 'react'
import { VoiceParseResult, Category } from '@/types'
import { createClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import VoiceButton from './VoiceButton'
import { X, Check, TrendingUp, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface VoiceInputModalProps {
  onClose: () => void
  onSaved: () => void
}

export default function VoiceInputModal({ onClose, onSaved }: VoiceInputModalProps) {
  const supabase = createClient()
  const [parsed, setParsed]       = useState<VoiceParseResult | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  function handleParsed(result: VoiceParseResult) {
    setParsed(result)
    setForm({
      description: result.description,
      amount: result.amount?.toString() ?? '',
      type: result.type === 'unknown' ? 'expense' : result.type,
      date: result.date ?? new Date().toISOString().split('T')[0],
      category_id: categories.find(c =>
        c.name.toLowerCase().includes((result.category_suggestion ?? '').toLowerCase())
      )?.id ?? '',
    })
  }

  async function handleSave() {
    if (!form.amount || !form.description) {
      toast.error('Preencha o valor e a descrição.')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
      date: form.date,
      category_id: form.category_id || null,
      voice_input: parsed?.raw ?? null,
    })

    if (error) {
      toast.error('Erro ao salvar transação.')
    } else {
      toast.success('Transação salva! 🎉')
      onSaved()
      onClose()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-dark-800 rounded-2xl border border-dark-700 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Nova transação por voz</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Voice button */}
        <div className="flex justify-center py-2">
          <VoiceButton onParsed={handleParsed} />
        </div>

        {/* Transcript */}
        {parsed && (
          <div className="bg-dark-900 rounded-xl px-4 py-3 text-sm text-dark-300 italic">
            "{parsed.raw}"
          </div>
        )}

        {/* Form */}
        <div className="space-y-3">
          {/* Tipo */}
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  form.type === t
                    ? t === 'expense'
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-primary-500/20 border-primary-500 text-primary-400'
                    : 'border-dark-700 text-dark-400 hover:border-dark-500'
                }`}
              >
                {t === 'expense' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {t === 'expense' ? 'Saída' : 'Entrada'}
              </button>
            ))}
          </div>

          <div>
            <label className="label">Descrição</label>
            <input
              className="input"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ex: Mercado, Aluguel, Salário..."
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div className="flex-1">
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Categoria</label>
            <select
              className="input"
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
            >
              <option value="">Sem categoria</option>
              {categories
                .filter(c => c.type === form.type)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))
              }
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar transação'}
        </button>
      </div>
    </div>
  )
}
