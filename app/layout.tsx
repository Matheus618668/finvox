import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ThemeWrapper from '@/components/theme/ThemeWrapper'
import Sidebar from '@/components/layout/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FinVox',
  description: 'Gere suas financas por voz',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='pt-BR' className='dark'>
      <body className={inter.className + ' bg-black text-white selection:bg-primary-500/30'}>
        <ThemeWrapper>
          <div className='flex min-h-screen bg-black'>
            <Sidebar />
            <main className='flex-1 w-full flex flex-col min-w-0'>
              <div className='flex-1 w-full max-w-[100vw] px-4 pt-20 pb-32 lg:pt-8 lg:px-8 lg:pl-8'>
                {children}
              </div>
            </main>
          </div>
        </ThemeWrapper>
        <Toaster position='top-center' />
      </body>
    </html>
  )
}
