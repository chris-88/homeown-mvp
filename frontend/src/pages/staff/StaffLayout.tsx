import { Outlet, Link, useLocation } from 'react-router-dom'
import { RouteGuard } from '@/components/shared/RouteGuard'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import {
  BarChart3, ListTodo, UserSearch, Users, Users2, Landmark,
  Building2, UserCircle, LogOut,
} from 'lucide-react'
import { canViewProspects, canViewClients, canViewCircle, canViewDACs, canManageTeam } from '@/lib/rbac'
import type { StaffRole } from '@/types'
import { Logo } from '@/components/shared/Logo'

type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
  exact?: boolean
  show?: (role: StaffRole | undefined) => boolean
}

const NAV: NavItem[] = [
  { to: '/app/staff',           label: 'Overview',    icon: <BarChart3 className="h-4 w-4" />,    exact: true },
  { to: '/app/staff/queue',     label: 'My Queue',    icon: <ListTodo className="h-4 w-4" /> },
  { to: '/app/staff/prospects', label: 'Prospects',   icon: <UserSearch className="h-4 w-4" />,   show: canViewProspects },
  { to: '/app/staff/clients',   label: 'Clients',     icon: <Users className="h-4 w-4" />,        show: canViewClients },
  { to: '/app/staff/circle',    label: 'Circle CRM',  icon: <Users2 className="h-4 w-4" />,       show: canViewCircle },
  { to: '/app/staff/dacs',      label: 'DACs',        icon: <Landmark className="h-4 w-4" />,     show: canViewDACs },
  { to: '/app/staff/team',      label: 'Team',        icon: <Building2 className="h-4 w-4" />,    show: canManageTeam },
  { to: '/app/staff/profile',   label: 'My Profile',  icon: <UserCircle className="h-4 w-4" /> },
]

export default function StaffLayout() {
  const { pathname } = useLocation()
  const { staffMember } = useAuth()
  const role = staffMember?.role

  return (
    <RouteGuard requiredRole="staff">
      <div className="portal-context flex min-h-screen bg-background">
        <aside className="hidden w-60 shrink-0 md:flex md:flex-col bg-brand-green text-brand-cream">
          <div className="flex h-14 items-center border-b border-white/10 px-6">
            <Link to="/" className="flex flex-col gap-0.5">
              <Logo className="h-5 w-auto text-brand-cream" />
              <span className="text-[10px] font-medium tracking-widest text-brand-cream/60 uppercase">Staff</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {NAV.filter(item => !item.show || item.show(role)).map(({ to, label, icon, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-white/15 text-brand-cream font-medium'
                      : 'text-brand-cream/70 hover:bg-white/10 hover:text-brand-cream',
                  )}
                >
                  {icon}{label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-white/10 p-3">
            <Link
              to="/auth/logout"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-brand-cream/70 transition-colors hover:bg-white/10 hover:text-brand-cream"
            >
              <LogOut className="h-4 w-4" />Sign out
            </Link>
          </div>
        </aside>
        <main className="flex-1 overflow-auto"><Outlet /></main>
      </div>
    </RouteGuard>
  )
}
