import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Disc3, BookOpen, Music, Network, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/shelf', label: 'Estante', icon: BookOpen },
  { to: '/graph', label: 'Grafo', icon: Network },
  { to: '/sessions', label: 'Sessões', icon: Music },
]

export function Navbar() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-[#2A2A2A]">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo — links to Home */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-full bg-[#C9A84C] flex items-center justify-center">
            <Disc3 className="w-4 h-4 text-[#0A0A0A]" />
          </div>
          <span className="font-display font-bold text-lg text-gradient-gold hidden sm:block">
            Vitrola
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to)
            return (
              <Link key={to} to={to}>
                <motion.div
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                    active
                      ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                      : 'text-[#9A9080] hover:text-[#F5F0E8] hover:bg-[#1A1A1A]'
                  )}
                  whileTap={{ scale: 0.97 }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{label}</span>
                </motion.div>
              </Link>
            )
          })}
        </div>

        {/* User actions: Settings + Logout */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
          {user && (
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
