import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { RouteGuard } from '@/components/shared/RouteGuard'
import { cn } from '@/lib/utils'
import { LayoutDashboard, TrendingUp, PieChart, FileText, User, LogOut, Menu, X } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { NotificationBell } from '@/components/shared/NotificationBell'

const nav = [
  { to: '/app/circle',                label: 'Dashboard',    icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
  { to: '/app/circle/opportunities',  label: 'Opportunities', icon: <TrendingUp className="h-4 w-4" /> },
  { to: '/app/circle/portfolio',       label: 'My Portfolio', icon: <PieChart className="h-4 w-4" /> },
  { to: '/app/circle/documents',       label: 'Documents',    icon: <FileText className="h-4 w-4" /> },
  { to: '/app/circle/profile',         label: 'Profile',      icon: <User className="h-4 w-4" /> },
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
          onClick={onNavClick}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-brand-cream/70 transition-colors hover:bg-white/10 hover:text-brand-cream"
        >
          <LogOut className="h-4 w-4" />Sign out
        </Link>
      </div>
    </>
  )
}

export default function CircleLayout() {
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <RouteGuard requiredRole="circle">
      <div className="portal-context flex min-h-screen bg-background">

        {/* ── Desktop sidebar ───────────────────────────────────── */}
        <aside className="hidden w-60 shrink-0 md:flex md:flex-col bg-brand-burgundy text-brand-cream">
          <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
            <Link to="/" className="flex flex-col gap-0.5">
              <Logo className="h-5 w-auto text-brand-cream" />
              <span className="text-[10px] font-medium tracking-widest text-brand-cream/60 uppercase">Circle</span>
            </Link>
            <NotificationBell iconClassName="text-brand-cream/80" />
          </div>
          <SidebarContent pathname={pathname} />
        </aside>

        {/* ── Mobile: header + main ─────────────────────────────── */}
        <div className="flex flex-1 flex-col min-w-0 md:contents">
          {/* Mobile header */}
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-brand-burgundy px-4 md:hidden">
            <Link to="/" className="flex flex-col gap-0.5">
              <Logo className="h-5 w-auto text-brand-cream" />
              <span className="text-[10px] font-medium tracking-widest text-brand-cream/60 uppercase">Circle</span>
            </Link>
            <div className="flex items-center gap-1">
              <NotificationBell iconClassName="text-brand-cream/80" />
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="rounded-md p-1.5 text-brand-cream/70 hover:bg-white/10 hover:text-brand-cream transition-colors"
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
            'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-brand-burgundy text-brand-cream transition-transform duration-200 ease-in-out md:hidden',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-6">
            <Link to="/" className="flex flex-col gap-0.5">
              <Logo className="h-5 w-auto text-brand-cream" />
              <span className="text-[10px] font-medium tracking-widest text-brand-cream/60 uppercase">Circle</span>
            </Link>
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="rounded-md p-1.5 text-brand-cream/70 hover:bg-white/10 hover:text-brand-cream transition-colors"
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
