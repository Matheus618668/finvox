import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import ThemeWrapper from '@/components/theme/ThemeWrapper'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FinVox',
  description: 'Gestão financeira por voz',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <ThemeWrapper>
          {children}
        </ThemeWrapper>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
