'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, Target, Calendar, Landmark,
  LogOut, TrendingUp, Menu, X, Palette
} from 'lucide-react'
import { useState, useEffect } from 'react'
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

  useEffect(() => {
    console.log('Sidebar rendered, profile:', profile)
  }, [profile])

  async function handleSignOut() {
    await signOut()
    router.push('/auth/login')
  }

  async function toggleTheme() {
    const newTheme = profile?.theme === 'purple' ? 'green' : 'purple'
    const { error } = await supabase
      .from('profiles')
      .update({ theme: newTheme })
      .eq('id', profile?.id)
    
    if (!error) {
      window.location.reload()
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-dark-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-8">
        <div className="bg-primary-500 p-2 rounded-lg shadow-lg shadow-primary-500/20">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">FinVox</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200",
                isActive 
                  ? "bg-primary-500 text-white font-semibold shadow-md shadow-primary-500/20" 
                  : "text-dark-400 hover:bg-dark-800 hover:text-dark-100"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User / Settings */}
      <div className="p-4 border-t border-dark-800 space-y-2">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-dark-800/50 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold border-2 border-dark-700">
            {profile?.name?.[0] || profile?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {profile?.name || 'Usuário'}
            </p>
            <p className="text-[10px] text-primary-400 font-medium uppercase tracking-wider">
              Plano Pro
            </p>
          </div>
        </div>
        
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm text-dark-200 hover:bg-dark-800 hover:text-primary-400 transition-all border border-transparent hover:border-dark-700"
        >
          <Palette className="w-5 h-5" />
          <span>Mudar Cor</span>
        </button>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm text-dark-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-dark-900 border-r border-dark-800 h-screen sticky top-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-dark-900/80 backdrop-blur-md border-b border-dark-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary-500 p-1.5 rounded-lg">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">FinVox</span>
        </div>
        <button 
          onClick={() => setOpen(!open)} 
          className="text-white p-2 hover:bg-dark-800 rounded-lg transition-colors"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Side Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" 
            onClick={() => setOpen(false)} 
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-dark-900 shadow-2xl animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
