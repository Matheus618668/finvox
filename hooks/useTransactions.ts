'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Transaction } from '@/types'

export function useTransactions(month?: number, year?: number) {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)

    const start = new Date(y, m - 1, 1).toISOString().split('T')[0]
    const end   = new Date(y, m, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*), account:accounts(*)')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setTransactions(data as Transaction[])
    }
    setLoading(false)
  }, [m, y])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('transactions').insert({
      ...tx,
      user_id: user.id,
    })
    if (!error) fetchTransactions()
    return error
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) fetchTransactions()
    return error
  }

  const summary = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income')  acc.income  += tx.amount
      if (tx.type === 'expense') acc.expense += tx.amount
      return acc
    },
    { income: 0, expense: 0 }
  )

  return {
    transactions,
    loading,
    error,
    summary: { ...summary, balance: summary.income - summary.expense },
    refresh: fetchTransactions,
    addTransaction,
    deleteTransaction,
  }
}
