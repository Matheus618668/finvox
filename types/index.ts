export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  currency: string
  created_at: string
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  icon: string
  color: string
  type: 'income' | 'expense'
  is_default: boolean
  created_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'other'
  balance: number
  color: string
  icon: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string | null
  category_id: string | null
  type: 'income' | 'expense' | 'transfer'
  amount: number
  description: string
  date: string
  notes: string | null
  voice_input: string | null
  is_recurring: boolean
  recurring_id: string | null
  created_at: string
  // joins
  category?: Category
  account?: Account
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  icon: string
  color: string
  status: 'active' | 'completed' | 'paused'
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  month: number
  year: number
  amount: number
  created_at: string
  category?: Category
  spent?: number
}

export interface Asset {
  id: string
  user_id: string
  name: string
  type: 'real_estate' | 'vehicle' | 'investment' | 'crypto' | 'other'
  value: number
  notes: string | null
  created_at: string
}

export interface MonthlySummary {
  year: number
  month: number
  total_income: number
  total_expense: number
  balance: number
}

export interface VoiceParseResult {
  type: 'income' | 'expense' | 'unknown'
  amount: number | null
  description: string
  category_suggestion: string | null
  date: string | null
  raw: string
}
