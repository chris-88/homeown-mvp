import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { STAFF_ROLES } from '@/types'
import type { Role } from '@/types'

interface RouteGuardProps {
  // 'staff' is a meta-sentinel meaning "any staff role"
  requiredRole: Role | 'staff'
  children: React.ReactNode
}

export function RouteGuard({ requiredRole, children }: RouteGuardProps) {
  const { user, profile, client, staffMember, circleMember, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>
  }

  if (!user) return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />

  const role = profile?.role

  const isActive =
    role === 'client' ? (client?.active ?? true)
      : role === 'circle' ? (circleMember?.active ?? true)
        : role && STAFF_ROLES.has(role) ? (staffMember?.active ?? true)
          : true

  if (!isActive) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-medium">Your account has been disabled.</p>
        <p className="text-sm text-muted-foreground">Please contact your Homeown representative if you believe this is a mistake.</p>
        <button onClick={() => supabase.auth.signOut()} className="text-sm font-medium underline underline-offset-4">Sign out</button>
      </div>
    )
  }

  const allowed =
    requiredRole === 'staff'
      ? !!role && STAFF_ROLES.has(role)
      : role === requiredRole

  if (!allowed) {
    if (role === 'client') return <Navigate to="/app/client" replace />
    if (role && STAFF_ROLES.has(role)) return <Navigate to="/app/staff" replace />
    if (role === 'circle') return <Navigate to="/app/circle" replace />
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}
