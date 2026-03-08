import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Toaster } from '@/components/ui/toaster'

export function Layout() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-14 min-h-[calc(100vh-3.5rem)]">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
