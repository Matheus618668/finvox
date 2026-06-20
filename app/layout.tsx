import './globals.css'
import React from 'react'

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
    <html lang="pt-BR">
      <body className="overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
