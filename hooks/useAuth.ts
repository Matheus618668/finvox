'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'

export function useAuth() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchProfile(user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(user: User) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      // Se o perfil não tiver nome, pega do metadata do auth
      if (!data.name) {
        const name = user.user_metadata?.name
          || user.user_metadata?.full_name
          || user.email?.split('@')[0]
          || null

        // Salva o nome no perfil
        if (name) {
          await supabase
            .from('profiles')
            .update({ name, email: user.email })
            .eq('id', user.id)
          setProfile({ ...data, name })
        } else {
          setProfile(data)
        }
      } else {
        setProfile(data)
      }
    } else {
      // Perfil não existe, cria agora
      const name = user.user_metadata?.name
        || user.user_metadata?.full_name
        || user.email?.split('@')[0]
        || null

      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: user.id, name, email: user.email })
        .select()
        .single()

      setProfile(newProfile)
    }

    setLoading(false)
  }

  const signOut = () => supabase.auth.signOut()

  return { user, profile, loading, signOut }
}
