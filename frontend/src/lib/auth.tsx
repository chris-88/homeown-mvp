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
    const [{ data: profile }, { data: clientData }, { data: staffMember }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('clients').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('staff_members').select('*').eq('user_id', user.id).maybeSingle(),
    ])

    let client = clientData as Client | null

    // Auto-create/link client record for OAuth sign-ups where one doesn't exist yet
    if (profile?.role === 'client' && !client) {
      const meta = user.user_metadata as { full_name?: string; name?: string }
      const nameParts = (meta.full_name || meta.name || '').split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // If a client row exists with this email (e.g. from a calc save), link it
      const { data: byEmail } = await supabase
        .from('clients').select('id').eq('email', user.email!).maybeSingle()

      if (byEmail) {
        await supabase.from('clients').update({ user_id: user.id }).eq('id', byEmail.id)
      } else {
        await supabase.from('clients').insert({
          user_id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          lead_stage: 'new_lead',
        })
      }

      const { data: refreshed } = await supabase
        .from('clients').select('*').eq('user_id', user.id).maybeSingle()
      client = refreshed as Client | null
    }

    setState({
      user,
      profile: profile ?? null,
      client,
      staffMember: (staffMember as StaffMember) ?? null,
      loading: false,
    })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      await loadUser(session?.user ?? null)

      // After OAuth sign-in, navigate to any stored destination (e.g. /calc/save)
      if (event === 'SIGNED_IN') {
        const next = localStorage.getItem('homeown_oauth_next')
        if (next) {
          localStorage.removeItem('homeown_oauth_next')
          window.location.hash = next
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

// ── Shared OAuth helpers ───────────────────────────────────────
function oauthRedirectTo() {
  return `${window.location.origin}${window.location.pathname}`
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: oauthRedirectTo() },
  })
}

export async function signInWithApple() {
  return supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: oauthRedirectTo() },
  })
}
