import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { RouteGuard } from '@/components/shared/RouteGuard'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, Home, Clock, User, LogOut, Menu, X } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { NotificationBell } from '@/components/shared/NotificationBell'

const nav = [
  { to: '/app/client',           label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
  { to: '/app/client/documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
  { to: '/app/client/property',  label: 'Property',  icon: <Home className="h-4 w-4" /> },
  { to: '/app/client/timeline',  label: 'Timeline',  icon: <Clock className="h-4 w-4" /> },
  { to: '/app/client/profile',   label: 'Profile',   icon: <User className="h-4 w-4" /> },
]

function SidebarContent({ pathname, onNavClick }: { pathname: string; onNavClick?: () => void }) {
  return (
    <>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map(({ to, label, icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to)
          return (
            <Link
              key={to}
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
              {label}
            </Link>
          )
        })}
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
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <RouteGuard requiredRole="client">
      <div className="portal-context flex min-h-screen bg-background">

        {/* ── Desktop sidebar ───────────────────────────────────── */}
        <aside className="hidden w-56 shrink-0 border-r md:flex md:flex-col">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Link to="/"><Logo className="h-5 w-auto text-foreground" /></Link>
            <NotificationBell />
          </div>
          <SidebarContent pathname={pathname} />
        </aside>

        {/* ── Mobile: header + main ─────────────────────────────── */}
        <div className="flex flex-1 flex-col min-w-0 md:contents">
          {/* Mobile header */}
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
            'fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r bg-card transition-transform duration-200 ease-in-out md:hidden',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b px-6">
            <Link to="/"><Logo className="h-5 w-auto text-foreground" /></Link>
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SidebarContent pathname={pathname} onNavClick={() => setDrawerOpen(false)} />
        </aside>

      </div>
    </RouteGuard>
  )
}
