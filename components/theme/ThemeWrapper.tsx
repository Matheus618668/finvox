'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.theme === 'purple') {
      document.documentElement.setAttribute('data-theme', 'purple')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [profile?.theme])

  return <>{children}</>
}
