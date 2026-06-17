'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Goal } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Target, Trash2, Edit2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ObjetivosPage() {
  const supabase = createClient()
  const [goals, setGoals]     = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '', deadline: '', icon: '🎯', color: '#22c55e' })

  async function fetchGoals() {
    setLoading(true)
    const { data } = await supabase.from('goals').select('*').order('created_at', { ascending: false })
    setGoals(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchGoals() }, [])

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      name: form.name,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount || '0'),
      deadline: form.deadline || null,
      icon: form.icon,
      color: form.color,
    }

    const { error } = editGoal
      ? await supabase.from('goals').update(payload).eq('id', editGoal.id)
      : await supabase.from('goals').insert(payload)

    if (error) { toast.error('Erro ao salvar.'); return }
    toast.success(editGoal ? 'Objetivo atualizado!' : 'Objetivo criado! 🎯')
    setShowForm(false); setEditGoal(null)
    setForm({ name: '', target_amount: '', current_amount: '', deadline: '', icon: '🎯', color: '#22c55e' })
    fetchGoals()
  }

  function openEdit(g: Goal) {
    setEditGoal(g)
    setForm({
      name: g.name, target_amount: g.target_amount.toString(),
      current_amount: g.current_amount.toString(),
      deadline: g.deadline ?? '', icon: g.icon, color: g.color,
    })
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar objetivo?')) return
    await supabase.from('goals').delete().eq('id', id)
    fetchGoals()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Objetivos</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo objetivo
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-dark-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="card text-center py-12 text-dark-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nenhum objetivo ainda.</p>
          <p className="text-sm mt-1">Crie uma meta e acompanhe seu progresso!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map(g => {
            const pct = Math.min((g.current_amount / g.target_amount) * 100, 100)
            return (
              <div key={g.id} className="card group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{g.icon}</span>
                    <div>
                      <p className="font-semibold text-white">{g.name}</p>
                      {g.deadline && <p className="text-xs text-dark-500">até {formatDate(g.deadline)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(g)} className="p-1 text-dark-500 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(g.id)} className="p-1 text-dark-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">{formatCurrency(g.current_amount)}</span>
                    <span className="text-dark-300 font-medium">{formatCurrency(g.target_amount)}</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: g.color }}
                    />
                  </div>
                  <p className="text-xs text-dark-500 text-right">{pct.toFixed(0)}% concluído</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setShowForm(false); setEditGoal(null) }} />
          <div className="relative w-full max-w-md bg-dark-800 rounded-2xl border border-dark-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editGoal ? 'Editar' : 'Novo'} objetivo</h2>
              <button onClick={() => { setShowForm(false); setEditGoal(null) }}><X className="w-5 h-5 text-dark-400" /></button>
            </div>
            <div>
              <label className="label">Nome</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Viagem para Europa" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Meta (R$)</label>
                <input type="number" className="input" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} />
              </div>
              <div className="flex-1">
                <label className="label">Já guardou (R$)</label>
                <input type="number" className="input" value={form.current_amount} onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Prazo</label>
                <input type="date" className="input" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="flex-1">
                <label className="label">Ícone</label>
                <input className="input" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🎯" />
              </div>
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
