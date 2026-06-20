import './globals.css'
import React from 'react'

export const metadata = {
  title: 'FinVox',
  description: 'Gestão financeira por voz',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  )
}
