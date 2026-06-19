'use client'
import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, Mic, ChevronLeft, ChevronRight } from 'lucide-react'
import VoiceInputModal from '@/components/voice/VoiceInputModal'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const now = new Date(); const [month, setMonth] = useState(now.getMonth() + 1); const [year, setYear] = useState(now.getFullYear()); const [showVoice, setShowVoice] = useState(false)
  const { profile } = useAuth(); const { transactions, summary, refresh } = useTransactions(month, year)
  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }
  const chartData = Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => {
    const day = i + 1; const dayStr = year + '-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0'); const dayTxs = transactions.filter(t => t.date === dayStr)
    return { day, entrada: dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), saida: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) }
  }).filter(d => d.entrada > 0 || d.saida > 0)
  const recentTxs = transactions.slice(0, 5)
  return (
    <div className='flex flex-col gap-6 w-full max-w-full overflow-x-hidden pb-24 px-1'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div><h1 className='text-xl font-bold text-white'>Ola, {profile?.name?.split(' ')[0] ?? 'usuario'}</h1><p className='text-slate-400 text-xs'>Seu resumo financeiro</p></div>
        <div className='flex items-center justify-between bg-slate-900/50 p-1 rounded-xl border border-slate-800'><button onClick={prevMonth} className='p-2 hover:bg-slate-800 rounded-lg'><ChevronLeft className='w-4 h-4' /></button><span className='text-xs font-semibold text-slate-200 capitalize px-4'>{formatMonth(month, year)}</span><button onClick={nextMonth} className='p-2 hover:bg-slate-800 rounded-lg'><ChevronRight className='w-4 h-4' /></button></div>
      </div>
      <div className='grid grid-cols-1 gap-3'>
        <div className='bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4'><div className='bg-green-500/10 p-3 rounded-xl'><TrendingUp className='w-5 h-5 text-green-500' /></div><div><p className='text-slate-500 text-[10px] uppercase tracking-wider font-bold'>Entradas</p><p className='text-lg font-bold text-green-500'>{formatCurrency(summary.income)}</p></div></div>
        <div className='bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4'><div className='bg-red-500/10 p-3 rounded-xl'><TrendingDown className='w-5 h-5 text-red-500' /></div><div><p className='text-slate-500 text-[10px] uppercase tracking-wider font-bold'>Saidas</p><p className='text-lg font-bold text-red-500'>{formatCurrency(summary.expense)}</p></div></div>
        <div className='bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4'><div className='bg-blue-500/10 p-3 rounded-xl'><Wallet className='w-5 h-5 text-blue-500' /></div><div><p className='text-slate-500 text-[10px] uppercase tracking-wider font-bold'>Saldo Atual</p><p className={'text-lg font-bold ' + (summary.balance >= 0 ? 'text-green-500' : 'text-red-500')}>{formatCurrency(summary.balance)}</p></div></div>
      </div>
      {chartData.length > 0 && (
        <div className='bg-slate-900 border border-slate-800 p-4 rounded-2xl'><h2 className='text-sm font-bold text-white mb-4'>Fluxo de Caixa</h2><div className='h-48 w-full'><ResponsiveContainer width='100%' height='100%'><AreaChart data={chartData}><CartesianGrid strokeDasharray='3 3' stroke='#1e293b' vertical={false} /><XAxis dataKey='day' hide /><YAxis hide /><Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '12px' }} /><Area type='monotone' dataKey='entrada' stroke='#22c55e' fill='#22c55e22' strokeWidth={2} /><Area type='monotone' dataKey='saida' stroke='#ef4444' fill='#ef444422' strokeWidth={2} /></AreaChart></ResponsiveContainer></div></div>
      )}
      <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
        <div className='p-4 border-b border-slate-800'><h2 className='text-sm font-bold text-white'>Ultimas Atividades</h2></div>
        <div className='divide-y divide-slate-800'>
          {recentTxs.map(tx => (<div key={tx.id} className='flex items-center justify-between p-4 active:bg-slate-800 transition-colors'><div className='flex items-center gap-3'><div className='w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-lg'>{tx.category?.icon ?? 'money'}</div><div><p className='text-sm font-bold text-slate-200 line-clamp-1'>{tx.description}</p><p className='text-[10px] text-slate-500'>{formatDate(tx.date)}</p></div></div><p className={'text-sm font-bold ' + (tx.type === 'income' ? 'text-green-500' : 'text-red-500')}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</p></div>))}
        </div>
      </div>
      <div className='fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4'><button onClick={() => setShowVoice(true)} className='w-full bg-green-600 hover:bg-green-700 h-14 rounded-2xl flex items-center justify-center gap-2 shadow-2xl shadow-green-900/20 active:scale-95 transition-transform'><Mic className='w-5 h-5 text-white' /><span className='text-white font-bold text-sm'>Lancar com Voz</span></button></div>
      {showVoice && <VoiceInputModal onClose={() => setShowVoice(false)} onSaved={refresh} />}
    </div>
  )
}
