import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { RouteGuard } from '@/components/shared/RouteGuard'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import {
  BarChart3, UserSearch, Home, Route, Users2, Landmark,
  Building2, UserCircle, LogOut, Menu, X, MoreVertical, Bell,
} from 'lucide-react'
import { canViewProspects, canViewProperty, canViewPathway, canViewCircle, canViewDACs, canManageTeam } from '@/lib/rbac'
import type { StaffMember, StaffRole } from '@/types'
import { Logo } from '@/components/shared/Logo'
import { useNotifications } from '@/hooks/useNotifications'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
  exact?: boolean
  show?: (role: StaffRole | undefined) => boolean
}

const NAV: NavItem[] = [
  { to: '/app/staff',           label: 'Overview',    icon: <BarChart3 className="h-4 w-4" />,    exact: true },
  { to: '/app/staff/prospects', label: 'Prospects',   icon: <UserSearch className="h-4 w-4" />,   show: canViewProspects },
  { to: '/app/staff/property',  label: 'Property',    icon: <Home className="h-4 w-4" />,         show: canViewProperty },
  { to: '/app/staff/pathway',   label: 'Pathway',     icon: <Route className="h-4 w-4" />,        show: canViewPathway },
  { to: '/app/staff/circle',    label: 'Circle CRM',  icon: <Users2 className="h-4 w-4" />,       show: canViewCircle },
  { to: '/app/staff/dacs',      label: 'DACs',        icon: <Landmark className="h-4 w-4" />,     show: canViewDACs },
  { to: '/app/staff/team',      label: 'Team',        icon: <Building2 className="h-4 w-4" />,    show: canManageTeam },
]

function initials(staffMember: StaffMember | null) {
  if (!staffMember) return '?'
  const name = staffMember.display_name || `${staffMember.first_name} ${staffMember.last_name}`
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]!.toUpperCase())
    .join('')
}

function SidebarContent({
  pathname,
  role,
  staffMember,
  unreadCount,
  assignedToMe,
  onToggleAssigned,
  onNavClick,
}: {
  pathname: string
  role: StaffRole | undefined
  staffMember: StaffMember | null
  unreadCount: number
  assignedToMe: boolean
  onToggleAssigned: () => void
  onNavClick?: () => void
}) {
  const name = staffMember?.display_name || (staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Loading…')

  return (
    <>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {NAV.filter(item => !item.show || item.show(role)).map(({ to, label, icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavClick}
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

      <div className="shrink-0 border-t border-white/10 p-3 space-y-1">
        {/* Assigned to me toggle */}
        <button
          onClick={onToggleAssigned}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-brand-cream/70 hover:bg-white/10 hover:text-brand-cream transition-colors"
        >
          <span>Assigned to me</span>
          <div className={cn(
            'relative h-5 w-9 rounded-full transition-colors shrink-0',
            assignedToMe ? 'bg-brand-cream/40' : 'bg-white/15',
          )}>
            <div className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
              assignedToMe ? 'translate-x-[18px]' : 'translate-x-0.5',
            )} />
          </div>
        </button>

        {/* Name / profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-white/10">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-medium text-brand-cream">
                {initials(staffMember)}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-brand-cream">{name}</span>
                <span className="block truncate text-xs text-brand-cream/60">{staffMember?.email}</span>
              </span>
              <MoreVertical className="h-4 w-4 shrink-0 text-brand-cream/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52">
            <DropdownMenuItem asChild onClick={onNavClick}>
              <Link to="/app/staff/notifications">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={onNavClick}>
              <Link to="/app/staff/profile"><UserCircle className="h-4 w-4" />My Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild onClick={onNavClick}>
              <Link to="/auth/logout"><LogOut className="h-4 w-4" />Sign out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

export default function StaffLayout() {
  const { pathname } = useLocation()
  const { staffMember } = useAuth()
  const role = staffMember?.role
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [assignedToMe, setAssignedToMe] = useState(
    () => localStorage.getItem('staff_assigned_to_me') === 'true'
  )
  const { unreadCount } = useNotifications()

  function toggleAssigned() {
    const next = !assignedToMe
    setAssignedToMe(next)
    localStorage.setItem('staff_assigned_to_me', String(next))
  }

  const sidebarProps = {
    pathname,
    role,
    staffMember,
    unreadCount,
    assignedToMe,
    onToggleAssigned: toggleAssigned,
  }

  return (
    <RouteGuard requiredRole="staff">
      <div className="portal-context flex h-screen overflow-hidden bg-background">

        {/* ── Desktop sidebar ───────────────────────────────────── */}
        <aside className="hidden h-screen w-60 shrink-0 md:flex md:flex-col bg-brand-green text-brand-cream">
          <div className="flex h-14 shrink-0 items-center border-b border-white/10 px-4">
            <Link to="/" className="flex flex-col gap-0.5">
              <Logo className="h-5 w-auto text-brand-cream" />
              <span className="text-[10px] font-medium tracking-widest text-brand-cream/60 uppercase">Staff</span>
            </Link>
          </div>
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* ── Mobile: header + main ─────────────────────────────── */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden md:contents">
          {/* Mobile header */}
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-brand-green px-4 md:hidden">
            <Link to="/" className="flex flex-col gap-0.5">
              <Logo className="h-5 w-auto text-brand-cream" />
              <span className="text-[10px] font-medium tracking-widest text-brand-cream/60 uppercase">Staff</span>
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-1.5 text-brand-cream/70 hover:bg-white/10 hover:text-brand-cream transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto md:h-screen"><Outlet /></main>
        </div>

        {/* ── Mobile drawer backdrop ────────────────────────────── */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* ── Mobile drawer ─────────────────────────────────────── */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-brand-green text-brand-cream transition-transform duration-200 ease-in-out md:hidden',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-6">
            <Link to="/" className="flex flex-col gap-0.5">
              <Logo className="h-5 w-auto text-brand-cream" />
              <span className="text-[10px] font-medium tracking-widest text-brand-cream/60 uppercase">Staff</span>
            </Link>
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="rounded-md p-1.5 text-brand-cream/70 hover:bg-white/10 hover:text-brand-cream transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SidebarContent {...sidebarProps} onNavClick={() => setDrawerOpen(false)} />
        </aside>

      </div>
    </RouteGuard>
  )
}
