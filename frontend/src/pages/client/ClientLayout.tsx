import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { RouteGuard } from '@/components/shared/RouteGuard'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, TrendingUp, Home, Clock, User, LogOut, Menu, X, Lock } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { NotificationBell } from '@/components/shared/NotificationBell'

function NavItem({
  to, label, icon, exact, locked, pathname, onNavClick,
}: {
  to: string; label: string; icon: React.ReactNode; exact?: boolean
  locked?: boolean; pathname: string; onNavClick?: () => void
}) {
  const active = exact ? pathname === to : pathname.startsWith(to)
  return (
    <Link
      to={to}
      onClick={onNavClick}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {locked && <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
    </Link>
  )
}

function SidebarContent({ pathname, locked, onNavClick }: { pathname: string; locked: boolean; onNavClick?: () => void }) {
  return (
    <>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <NavItem to="/app/client" label="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />} exact pathname={pathname} onNavClick={onNavClick} />
        <NavItem to="/app/client/documents" label="Documents" icon={<FileText className="h-4 w-4" />} pathname={pathname} onNavClick={onNavClick} />
        <NavItem to="/app/client/pathway" label="My Pathway" icon={<TrendingUp className="h-4 w-4" />} pathname={pathname} onNavClick={onNavClick} />
        <NavItem to="/app/client/property" label="Property" icon={<Home className="h-4 w-4" />} locked={locked} pathname={pathname} onNavClick={onNavClick} />
        <NavItem to="/app/client/timeline" label="Timeline" icon={<Clock className="h-4 w-4" />} locked={locked} pathname={pathname} onNavClick={onNavClick} />
        <NavItem to="/app/client/profile" label="Profile" icon={<User className="h-4 w-4" />} pathname={pathname} onNavClick={onNavClick} />
      </nav>
      <div className="border-t p-3">
        <Link
          to="/auth/logout"
          onClick={onNavClick}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Link>
      </div>
    </>
  )
}

export default function ClientLayout() {
  const { pathname } = useLocation()
  const { client } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isEligible = client?.lead_stage === 'eligible' || !!client?.programme_stage
  const locked = !isEligible

  return (
    <RouteGuard requiredRole="client">
      <div className="portal-context flex min-h-screen bg-background">

        {/* ── Desktop sidebar ───────────────────────────────────── */}
        <aside className="hidden w-56 shrink-0 border-r md:flex md:flex-col">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Link to="/"><Logo className="h-5 w-auto text-foreground" /></Link>
            <NotificationBell />
          </div>
          <SidebarContent pathname={pathname} locked={locked} />
        </aside>

        {/* ── Mobile: header + main ─────────────────────────────── */}
        <div className="flex flex-1 flex-col min-w-0 md:contents">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:hidden">
            <Link to="/"><Logo className="h-5 w-auto text-foreground" /></Link>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto"><Outlet /></main>
        </div>

        {drawerOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setDrawerOpen(false)} />
        )}

        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r bg-card transition-transform duration-200 ease-in-out md:hidden',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b px-6">
            <Link to="/"><Logo className="h-5 w-auto text-foreground" /></Link>
            <button onClick={() => setDrawerOpen(false)} aria-label="Close menu"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <SidebarContent pathname={pathname} locked={locked} onNavClick={() => setDrawerOpen(false)} />
        </aside>

      </div>
    </RouteGuard>
  )
}
