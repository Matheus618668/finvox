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
    <html lang='pt-BR'>
      <body className={inter.className + ' bg-black text-white'}>
        <ThemeWrapper>
          <div className='flex min-h-screen bg-black'>
            <Sidebar />
            <main className='flex-1 w-full p-4 pb-24 md:pl-72'>
              <div className='max-w-2xl mx-auto'>
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
