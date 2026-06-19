'use client'

import { useState, useEffect } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Mic, Trash2, Search, ChevronLeft, ChevronRight, Edit2, X, Check } from 'lucide-react'
import VoiceInputModal from '@/components/voice/VoiceInputModal'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { Transaction } from '@/types'

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

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }

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
    setEditForm({ description: tx.description, amount: tx.amount.toString(), date: tx.date, type: tx.type as 'income' | 'expense' })
    setEditCategoryId(tx.category_id ?? '')
  }

  async function handleSaveEdit() {
    if (!editTx) return
    setSaving(true)
    const { error } = await supabase.from('transactions').update({
      description: editForm.description, amount: parseFloat(editForm.amount), date: editForm.date, type: editForm.type, category_id: editCategoryId || null
    }).eq('id', editTx.id)
    if (error) toast.error('Erro ao salvar.')
    else { toast.success('Transação atualizada!'); setEditTx(null); refresh() }
    setSaving(false)
  }

  const monthName = new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className='flex flex-col gap-6 w-full max-w-full overflow-x-hidden pb-24 px-1'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <h1 className='text-xl font-bold text-white'>Extrato</h1>
        <div className='flex items-center justify-between bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-full sm:w-auto'>
          <button onClick={prevMonth} className='p-2 hover:bg-slate-800 rounded-lg'><ChevronLeft className='w-4 h-4' /></button>
          <span className='text-xs font-semibold text-slate-200 capitalize px-4'>{monthName}</span>
          <button onClick={nextMonth} className='p-2 hover:bg-slate-800 rounded-lg'><ChevronRight className='w-4 h-4' /></button>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-2'>
        {[
          { label: 'Entradas', value: summary.income, color: 'text-green-500' },
          { label: 'Saídas', value: summary.expense, color: 'text-red-500' },
          { label: 'Saldo', value: summary.balance, color: summary.balance >= 0 ? 'text-green-500' : 'text-red-500' },
        ].map(item => (
          <div key={item.label} className='bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center'>
            <p className='text-[10px] text-slate-500 uppercase font-bold mb-1'>{item.label}</p>
            <p className={`text-xs font-bold truncate ${item.color}`}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      <div className='flex flex-col gap-3'>
        <div className='relative w-full'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500' />
          <input className='w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none' placeholder='Buscar...' value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className='flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto'>
          {(['all', 'income', 'expense'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`flex-1 min-w-fit px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors ${typeFilter === t ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>
              {t === 'all' ? 'Todos' : t === 'income' ? 'Ganhos' : 'Gastos'}
            </button>
          ))}
        </div>
      </div>

      <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
        {loading ? (
          <div className='p-4 space-y-3'>{[...Array(5)].map((_, i) => <div key={i} className='h-14 bg-slate-800/50 rounded-xl animate-pulse' />)}</div>
        ) : filtered.length === 0 ? (
          <div className='text-center py-12 text-slate-500 text-sm'>Nenhuma transação.</div>
        ) : (
          <div className='divide-y divide-slate-800'>
            {filtered.map(tx => (
              <div key={tx.id} className='flex items-center gap-3 p-4 active:bg-slate-800 transition-colors'>
                <div className='w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-lg shrink-0'>{(tx as any).category?.icon ?? '💰'}</div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-bold text-slate-200 truncate'>{tx.description}</p>
                  <p className='text-[10px] text-slate-500'>{formatDate(tx.date)} • {(tx as any).category?.name ?? 'Sem cat.'}</p>
                </div>
                <div className='flex flex-col items-end gap-1'>
                  <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <div className='flex gap-2'>
                    <button onClick={() => openEdit(tx)} className='p-1 text-slate-600'><Edit2 className='w-3 h-3' /></button>
                    <button onClick={() => handleDelete(tx.id)} className='p-1 text-slate-600'><Trash2 className='w-3 h-3' /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4'><button onClick={() => setShowVoice(true)} className='w-full bg-green-600 h-14 rounded-2xl flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-transform'><Mic className='w-5 h-5 text-white' /><span className='text-white font-bold text-sm'>Lancar com Voz</span></button></div>
      {showVoice && <VoiceInputModal onClose={() => setShowVoice(false)} onSaved={refresh} />}

      {editTx && (
        <div className='fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-0 sm:px-4'>
          <div className='absolute inset-0 bg-black/80' onClick={() => setEditTx(null)} />
          <div className='relative w-full max-w-sm bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 pb-10 sm:pb-6'>
            <div className='flex items-center justify-between'><h2 className='font-bold text-white'>Editar Transacao</h2><button onClick={() => setEditTx(null)} className='p-2 bg-slate-800 rounded-full'><X className='w-4 h-4 text-slate-400' /></button></div>
            <div className='flex gap-2'>
              {(['expense', 'income'] as const).map(t => (
                <button key={t} onClick={() => setEditForm(f => ({ ...f, type: t }))} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${editForm.type === t ? (t === 'expense' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'bg-slate-800 text-slate-500'}`}>
                  {t === 'expense' ? 'Saida' : 'Entrada'}
                </button>
              ))}
            </div>
            <div className='space-y-1'><label className='text-[10px] uppercase font-bold text-slate-500 ml-1'>Descricao</label><input className='w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-slate-500' value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className='flex gap-3'>
              <div className='flex-1 space-y-1'><label className='text-[10px] uppercase font-bold text-slate-500 ml-1'>Valor</label><input type='number' className='w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none' value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div className='flex-1 space-y-1'><label className='text-[10px] uppercase font-bold text-slate-500 ml-1'>Data</label><input type='date' className='w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none' value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <div className='space-y-1'><label className='text-[10px] uppercase font-bold text-slate-500 ml-1'>Categoria</label><select className='w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none appearance-none' value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)}><option value=''>Sem categoria</option>{categories.filter(c => c.type === editForm.type).map(c => (<option key={c.id} value={c.id}>{c.icon} {c.name}</option>))}</select></div>
            <button onClick={handleSaveEdit} disabled={saving} className='w-full bg-green-600 h-14 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform'><Check className='w-5 h-5' />{saving ? 'Salvando...' : 'Salvar Alteracoes'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
