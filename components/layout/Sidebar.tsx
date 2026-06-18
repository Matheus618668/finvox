'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, Target, Calendar, Landmark,
  LogOut, TrendingUp, Menu, X, Palette
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/extrato',       label: 'Extrato',        icon: ArrowLeftRight },
  { href: '/planejamento',  label: 'Planejamento',   icon: Calendar },
  { href: '/objetivos',     label: 'Objetivos',      icon: Target },
  { href: '/patrimonio',    label: 'Patrimônio',     icon: Landmark },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  async function handleSignOut() {
    await signOut()
    router.push('/auth/login')
  }

  async function toggleTheme() {
    const newTheme = profile?.theme === 'purple' ? 'green' : 'purple'
    await supabase
      .from('profiles')
      .update({ theme: newTheme })
      .eq('id', profile?.id)
    
    // Forçar atualização local ou recarregar se necessário
    window.location.reload()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-dark-700">
        <div className="bg-primary-500 p-1.5 rounded-lg">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-white">FinVox</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-dark-400 hover:bg-dark-800 hover:text-dark-100'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-2 py-4 border-t border-dark-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-primary-500/30 rounded-full flex items-center justify-center text-primary-400 font-semibold text-sm">
            {profile?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark-100 truncate">{profile?.name ?? 'Usuário'}</p>
            <p className="text-xs text-dark-500 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm text-dark-400 hover:bg-dark-800 hover:text-primary-400 transition-colors mb-1"
        >
          <Palette className="w-5 h-5" />
          Mudar Cor
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm text-dark-400 hover:bg-dark-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-56 bg-dark-900 border-r border-dark-700 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-dark-900 border-b border-dark-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary-500 p-1.5 rounded-lg">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">FinVox</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-dark-300 p-1">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-dark-900 border-r border-dark-700">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
