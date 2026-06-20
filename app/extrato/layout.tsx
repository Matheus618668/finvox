import Sidebar from '@/components/layout/Sidebar'
import React from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-black overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 w-full overflow-x-hidden pt-20 lg:pt-0">
        <div className="w-full max-w-full px-4 py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
