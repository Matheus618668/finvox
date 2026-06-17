'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Asset } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, Edit2, X, Check, Landmark } from 'lucide-react'
import toast from 'react-hot-toast'

const ASSET_TYPES = [
  { value: 'real_estate', label: 'Imóvel',       icon: '🏠' },
  { value: 'vehicle',     label: 'Veículo',       icon: '🚗' },
  { value: 'investment',  label: 'Investimento',  icon: '📈' },
  { value: 'crypto',      label: 'Cripto',        icon: '₿' },
  { value: 'other',       label: 'Outro',         icon: '💼' },
]

export default function PatrimonioPage() {
  const supabase = createClient()
  const [assets, setAssets]   = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const [form, setForm] = useState({ name: '', type: 'other', value: '', notes: '' })

  async function fetchAssets() {
    setLoading(true)
    const { data } = await supabase.from('assets').select('*').order('value', { ascending: false })
    setAssets(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchAssets() }, [])

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload = { user_id: user.id, name: form.name, type: form.type as Asset['type'], value: parseFloat(form.value), notes: form.notes || null }
    const { error } = editAsset
      ? await supabase.from('assets').update(payload).eq('id', editAsset.id)
      : await supabase.from('assets').insert(payload)
    if (error) { toast.error('Erro ao salvar.'); return }
    toast.success(editAsset ? 'Atualizado!' : 'Ativo adicionado!')
    setShowForm(false); setEditAsset(null); setForm({ name: '', type: 'other', value: '', notes: '' }); fetchAssets()
  }

  function openEdit(a: Asset) {
    setEditAsset(a)
    setForm({ name: a.name, type: a.type, value: a.value.toString(), notes: a.notes ?? '' })
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar este ativo?')) return
    await supabase.from('assets').delete().eq('id', id)
    fetchAssets()
  }

  const total = assets.reduce((s, a) => s + a.value, 0)

  const byType = ASSET_TYPES.map(t => ({
    ...t,
    total: assets.filter(a => a.type === t.value).reduce((s, a) => s + a.value, 0),
    items: assets.filter(a => a.type === t.value),
  })).filter(t => t.items.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Patrimônio</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Adicionar ativo
        </button>
      </div>

      {/* Total */}
      <div className="card bg-gradient-to-r from-primary-600/20 to-blue-600/20 border-primary-500/30">
        <p className="text-dark-400 text-sm">Patrimônio total</p>
        <p className="text-3xl font-bold text-white mt-1">{formatCurrency(total)}</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-dark-800 rounded-2xl animate-pulse" />)}</div>
      ) : assets.length === 0 ? (
        <div className="card text-center py-12 text-dark-500">
          <Landmark className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nenhum ativo cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {byType.map(group => (
            <div key={group.value} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{group.icon}</span>
                  <span className="font-semibold text-white">{group.label}</span>
                </div>
                <span className="text-sm font-bold text-primary-400">{formatCurrency(group.total)}</span>
              </div>
              <div className="space-y-2">
                {group.items.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-t border-dark-700 group">
                    <div>
                      <p className="text-sm text-dark-100">{a.name}</p>
                      {a.notes && <p className="text-xs text-dark-500">{a.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-dark-200">{formatCurrency(a.value)}</span>
                      <button onClick={() => openEdit(a)} className="opacity-0 group-hover:opacity-100 text-dark-500 hover:text-white p-1 transition-opacity"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(a.id)} className="opacity-0 group-hover:opacity-100 text-dark-500 hover:text-red-400 p-1 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setShowForm(false); setEditAsset(null) }} />
          <div className="relative w-full max-w-sm bg-dark-800 rounded-2xl border border-dark-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">{editAsset ? 'Editar' : 'Novo'} ativo</h2>
              <button onClick={() => { setShowForm(false); setEditAsset(null) }}><X className="w-5 h-5 text-dark-400" /></button>
            </div>
            <div>
              <label className="label">Nome</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Apartamento centro" />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Valor estimado (R$)</label>
              <input type="number" className="input" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div>
              <label className="label">Observações (opcional)</label>
              <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
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
