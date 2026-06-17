import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: ptBR })
}

export function formatMonth(month: number, year: number): string {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR })
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function getMonthRange(month: number, year: number) {
  const start = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const end   = new Date(year, month, 0).toISOString().split('T')[0]
  return { start, end }
}
