import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const ALLOWED_EMAIL = 'victorloureirolima@gmail.com'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      if (u && u.email !== ALLOWED_EMAIL) {
        supabase.auth.signOut()
        setAccessDenied(true)
        setLoading(false)
        return
      }
      setSession(session)
      setUser(u)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      if (u && u.email !== ALLOWED_EMAIL) {
        supabase.auth.signOut()
        setAccessDenied(true)
        setSession(null)
        setUser(null)
        return
      }
      setSession(session)
      setUser(u)
      if (u) setAccessDenied(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    })

  const signInWithEmail = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUpWithEmail = (email: string, password: string) =>
    supabase.auth.signUp({ email, password })

  const signOut = () => supabase.auth.signOut()

  return { user, session, loading, accessDenied, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }
}
