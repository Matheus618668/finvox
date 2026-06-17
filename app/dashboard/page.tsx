'use client'

import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, Plus, Mic, ChevronLeft, ChevronRight } from 'lucide-react'
import VoiceInputModal from '@/components/voice/VoiceInputModal'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function DashboardPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())
  const [showVoice, setShowVoice] = useState(false)

  const { profile } = useAuth()
  const { transactions, summary, loading, refresh } = useTransactions(month, year)

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Agrupa por dia para o gráfico
  const chartData = Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => {
    const day = i + 1
    const dayStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const dayTxs = transactions.filter(t => t.date === dayStr)
    return {
      day,
      entrada: dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      saída:   dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  }).filter(d => d.entrada > 0 || d.saída > 0)

  const recentTxs = transactions.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Olá, {profile?.name?.split(' ')[0] ?? 'usuário'} 👋
          </h1>
          <p className="text-dark-400 text-sm mt-0.5">Aqui está seu resumo financeiro</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-ghost p-2"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-medium text-dark-200 capitalize min-w-[110px] text-center">
            {formatMonth(month, year)}
          </span>
          <button onClick={nextMonth} className="btn-ghost p-2"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="bg-primary-500/20 p-3 rounded-xl">
            <TrendingUp className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <p className="text-dark-400 text-xs">Entradas</p>
            <p className="text-xl font-bold text-primary-400">{formatCurrency(summary.income)}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="bg-red-500/20 p-3 rounded-xl">
            <TrendingDown className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-dark-400 text-xs">Saídas</p>
            <p className="text-xl font-bold text-red-400">{formatCurrency(summary.expense)}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-xl">
            <Wallet className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-dark-400 text-xs">Saldo</p>
            <p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-primary-400' : 'text-red-400'}`}>
              {formatCurrency(summary.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Fluxo do mês</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Area type="monotone" dataKey="entrada" stroke="#22c55e" fill="url(#colorEntrada)" strokeWidth={2} />
              <Area type="monotone" dataKey="saída"   stroke="#ef4444" fill="url(#colorSaida)"   strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Últimas transações</h2>
          <a href="/extrato" className="text-primary-400 text-sm hover:text-primary-300">Ver todas →</a>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-dark-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentTxs.length === 0 ? (
          <div className="text-center py-8 text-dark-500">
            <p>Nenhuma transação ainda.</p>
            <p className="text-sm mt-1">Use o botão abaixo para adicionar! 🎙️</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTxs.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-3 hover:bg-dark-700 rounded-xl transition-colors">
                <div className="text-2xl">{tx.category?.icon ?? '💰'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-100 truncate">{tx.description}</p>
                  <p className="text-xs text-dark-500">{formatDate(tx.date)} • {tx.category?.name ?? 'Sem categoria'}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-primary-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
        <button
          onClick={() => setShowVoice(true)}
          className="w-14 h-14 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center shadow-xl shadow-primary-500/30 transition-all active:scale-95"
          title="Adicionar por voz"
        >
          <Mic className="w-6 h-6 text-white" />
        </button>
      </div>

      {showVoice && (
        <VoiceInputModal onClose={() => setShowVoice(false)} onSaved={refresh} />
      )}
    </div>
  )
}
