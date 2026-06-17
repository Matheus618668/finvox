'use client'

import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Mic, Trash2, Search, ChevronLeft, ChevronRight, Edit2, X, Check } from 'lucide-react'
import VoiceInputModal from '@/components/voice/VoiceInputModal'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { Transaction } from '@/types'
import { useEffect } from 'react'

export default function ExtratoPage() {
  const supabase = createClient()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [showVoice, setShowVoice] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [editForm, setEditForm] = useState({ description: '', amount: '', date: '', type: 'expense' as 'income' | 'expense' })
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [editCategoryId, setEditCategoryId] = useState('')

  const { transactions, summary, loading, refresh, deleteTransaction } = useTransactions(month, year)

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data ?? []))
  }, [])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  const filtered = transactions.filter(tx => {
    const matchType = typeFilter === 'all' || tx.type === typeFilter
    const matchSearch = tx.description.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  async function handleDelete(id: string) {
    if (!confirm('Deletar esta transação?')) return
    const error = await deleteTransaction(id)
    if (error) toast.error('Erro ao deletar.')
    else toast.success('Transação removida.')
  }

  function openEdit(tx: Transaction) {
    setEditTx(tx)
    setEditForm({
      description: tx.description,
      amount: tx.amount.toString(),
      date: tx.date,
      type: tx.type as 'income' | 'expense',
    })
    setEditCategoryId(tx.category_id ?? '')
  }

  async function handleSaveEdit() {
    if (!editTx) return
    setSaving(true)
    const { error } = await supabase.from('transactions').update({
      description: editForm.description,
      amount: parseFloat(editForm.amount),
      date: editForm.date,
      type: editForm.type,
      category_id: editCategoryId || null,
    }).eq('id', editTx.id)

    if (error) {
      toast.error('Erro ao salvar.')
    } else {
      toast.success('Transação atualizada!')
      setEditTx(null)
      refresh()
    }
    setSaving(false)
  }

  const monthName = new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Extrato</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-ghost p-2"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-medium text-dark-200 capitalize min-w-[120px] text-center">{monthName}</span>
          <button onClick={nextMonth} className="btn-ghost p-2"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Entradas', value: summary.income,  color: 'text-primary-400' },
          { label: 'Saídas',   value: summary.expense, color: 'text-red-400' },
          { label: 'Saldo',    value: summary.balance, color: summary.balance >= 0 ? 'text-primary-400' : 'text-red-400' },
        ].map(item => (
          <div key={item.label} className="card text-center">
            <p className="text-xs text-dark-500">{item.label}</p>
            <p className={`text-base font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            className="input pl-9 py-2"
            placeholder="Buscar descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-dark-800 rounded-xl p-1">
          {(['all', 'income', 'expense'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === t ? 'bg-dark-600 text-white' : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              {t === 'all' ? 'Todos' : t === 'income' ? 'Entradas' : 'Saídas'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-dark-700 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-dark-500">
            <p>Nenhuma transação encontrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-700">
            {filtered.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-dark-700/50 transition-colors group">
                <div className="text-2xl">{(tx as any).category?.icon ?? '💰'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-100 truncate">{tx.description}</p>
                  <p className="text-xs text-dark-500">
                    {formatDate(tx.date)} • {(tx as any).category?.name ?? 'Sem categoria'}
                    {(tx as any).voice_input && ' 🎙️'}
                  </p>
                </div>
                <span className={`text-sm font-semibold shrink-0 ${tx.type === 'income' ? 'text-primary-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(tx)}
                    className="text-dark-500 hover:text-white p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-dark-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowVoice(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center shadow-xl shadow-primary-500/30 transition-all active:scale-95"
      >
        <Mic className="w-6 h-6 text-white" />
      </button>

      {showVoice && <VoiceInputModal onClose={() => setShowVoice(false)} onSaved={refresh} />}

      {/* Modal editar transação */}
      {editTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditTx(null)} />
          <div className="relative w-full max-w-sm bg-dark-800 rounded-2xl border border-dark-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">Editar transação</h2>
              <button onClick={() => setEditTx(null)}><X className="w-5 h-5 text-dark-400" /></button>
            </div>

            {/* Tipo */}
            <div className="flex gap-2">
              {(['expense', 'income'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setEditForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    editForm.type === t
                      ? t === 'expense' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                      : 'bg-dark-700 text-dark-400 border border-transparent'
                  }`}
                >
                  {t === 'expense' ? '↓ Saída' : '↑ Entrada'}
                </button>
              ))}
            </div>

            <div>
              <label className="label">Descrição</label>
              <input className="input" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Valor (R$)</label>
                <input type="number" step="0.01" className="input" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="flex-1">
                <label className="label">Data</label>
                <input type="date" className="input" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="label">Categoria</label>
              <select className="input" value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)}>
                <option value="">Sem categoria</option>
                {categories.filter(c => c.type === editForm.type).map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <button onClick={handleSaveEdit} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
