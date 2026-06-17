'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { TrendingUp, Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    })
    if (error) {
      toast.error('Erro ao enviar e-mail.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-primary-500 p-2 rounded-xl">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">FinVox</span>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4 space-y-3">
              <div className="text-4xl">📧</div>
              <h2 className="text-lg font-bold text-white">E-mail enviado!</h2>
              <p className="text-dark-400 text-sm">Verifique sua caixa de entrada e clique no link para redefinir sua senha.</p>
              <Link href="/auth/login" className="btn-primary inline-block mt-2">Voltar ao login</Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Link href="/auth/login" className="text-dark-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-bold text-white">Recuperar senha</h1>
              </div>

              <p className="text-dark-400 text-sm mb-6">
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="email"
                      className="input pl-10"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
