import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Toaster } from '@/components/ui/toaster'

export function Layout() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] w-full max-w-[100vw] overflow-x-hidden">
      <Navbar />
      <main className="pt-14 min-h-[calc(100dvh-3.5rem)] w-full">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
