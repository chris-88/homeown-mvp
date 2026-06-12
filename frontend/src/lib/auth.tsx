import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Client, Profile, StaffMember } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  client: Client | null
  staffMember: StaffMember | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({
  user: null, profile: null, client: null, staffMember: null, loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null, profile: null, client: null, staffMember: null, loading: true,
  })

  async function loadUser(user: User | null) {
    if (!user) {
      setState({ user: null, profile: null, client: null, staffMember: null, loading: false })
      return
    }
    const [{ data: profile }, { data: client }, { data: staffMember }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('clients').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('staff_members').select('*').eq('user_id', user.id).maybeSingle(),
    ])
    setState({
      user,
      profile: profile ?? null,
      client: (client as Client) ?? null,
      staffMember: (staffMember as StaffMember) ?? null,
      loading: false,
    })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
