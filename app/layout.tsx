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
    <html lang='pt-BR' className='dark overflow-x-hidden'>
      <body className={inter.className + ' bg-black text-white overflow-x-hidden min-h-screen'}>
        <ThemeWrapper>
          <div className='flex flex-col lg:flex-row min-h-screen bg-black overflow-x-hidden'>
            <Sidebar />
            <main className='flex-1 w-full max-w-full overflow-x-hidden'>
              <div className='w-full px-4 pt-24 pb-32 lg:pt-8 lg:px-8'>
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
