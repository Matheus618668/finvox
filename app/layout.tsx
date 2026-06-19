import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ThemeWrapper from '@/components/theme/ThemeWrapper'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FinVox',
  description: 'Gere suas financas por voz',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='pt-BR'>
      <body className={inter.className + ' bg-black'}>
        <ThemeWrapper>
          <div className='flex flex-col min-h-screen'>
            <Navbar />
            <main className='flex-1 w-full px-4 pt-4 pb-20'>
              <div className='max-w-md mx-auto'>
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
