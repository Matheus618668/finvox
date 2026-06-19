import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ThemeWrapper from '@/components/theme/ThemeWrapper'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FinVox - Financas por voz',
  description: 'Gerencie suas financas com comandos de voz',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'FinVox' },
}

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='pt-BR' className='dark'>
      <body className={inter.className + ' bg-black text-white min-h-screen antialiased overflow-x-hidden'}>
        <ThemeWrapper>
          <div className='flex flex-col min-h-screen w-full overflow-x-hidden'>
            <Navbar />
            <main className='flex-1 w-full max-w-screen-xl mx-auto px-4 pb-24 pt-4 overflow-x-hidden'>
              {children}
            </main>
          </div>
        </ThemeWrapper>
        <Toaster position='top-center' />
      </body>
    </html>
  )
}
