import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function LogoutPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.signOut().then(() => navigate('/auth/login', { replace: true }))
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing out…</p>
    </div>
  )
}
