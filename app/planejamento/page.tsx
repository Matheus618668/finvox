'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Budget, Category } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, ChevronLeft, ChevronRight, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PlanejamentoPage() {
  const supabase = createClient()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())
  const [budgets, setBudgets]       = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState({ category_id: '', amount: '' })
  const [spent, setSpent]           = useState<Record<string, number>>({})

  const monthName = new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }

  useEffect(() => {
    supabase.from('categories').select('*').eq('type', 'expense').order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    fetchData()
  }, [month, year])

  async function fetchData() {
    setLoading(true)
    const { data: b } = await supabase
      .from('budgets').select('*, category:categories(*)')
      .eq('month', month).eq('year', year)

    setBudgets(b ?? [])

    // Calcular gastos reais por categoria
    const start = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const end   = new Date(year, month, 0).toISOString().split('T')[0]
    const { data: txs } = await supabase
      .from('transactions').select('category_id, amount')
      .eq('type', 'expense').gte('date', start).lte('date', end)

    const spentMap: Record<string, number> = {}
    txs?.forEach(tx => {
      if (tx.category_id) spentMap[tx.category_id] = (spentMap[tx.category_id] ?? 0) + tx.amount
    })
    setSpent(spentMap)
    setLoading(false)
  }

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('budgets').upsert({
      user_id: user.id, category_id: form.category_id,
      month, year, amount: parseFloat(form.amount),
    }, { onConflict: 'user_id,category_id,month,year' })
    if (error) { toast.error('Erro ao salvar.'); return }
    toast.success('Orçamento salvo!')
    setShowForm(false); setForm({ category_id: '', amount: '' }); fetchData()
  }

  async function handleDelete(id: string) {
    await supabase.from('budgets').delete().eq('id', id)
    fetchData()
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent  = budgets.reduce((s, b) => s + (spent[b.category_id] ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Planejamento</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-ghost p-2"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-medium text-dark-200 capitalize min-w-[120px] text-center">{monthName}</span>
          <button onClick={nextMonth} className="btn-ghost p-2"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Total */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-xs text-dark-500">Orçamento total</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-dark-500">Gasto até agora</p>
          <p className={`text-xl font-bold ${totalSpent > totalBudget ? 'text-red-400' : 'text-primary-400'}`}>
            {formatCurrency(totalSpent)}
          </p>
        </div>
      </div>

      <button onClick={() => setShowForm(true)} className="btn-secondary w-full flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Adicionar categoria ao orçamento
      </button>

      {/* Budget list */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-dark-800 rounded-2xl animate-pulse" />)}</div>
      ) : budgets.length === 0 ? (
        <div className="card text-center py-10 text-dark-500">Nenhum orçamento definido para este mês.</div>
      ) : (
        <div className="space-y-3">
          {budgets.map(b => {
            const s = spent[b.category_id] ?? 0
            const pct = Math.min((s / b.amount) * 100, 100)
            const over = s > b.amount
            return (
              <div key={b.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{b.category?.icon ?? '💰'}</span>
                    <span className="text-sm font-medium text-dark-100">{b.category?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${over ? 'text-red-400' : 'text-dark-300'}`}>
                      {formatCurrency(s)} / {formatCurrency(b.amount)}
                    </span>
                    <button onClick={() => handleDelete(b.id)} className="text-dark-600 hover:text-red-400"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${over ? 'bg-red-500' : 'bg-primary-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-sm bg-dark-800 rounded-2xl border border-dark-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">Definir orçamento</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-dark-400" /></button>
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Limite mensal (R$)</label>
              <input type="number" className="input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <button onClick={handleSave} className="btn-primary w-full flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
